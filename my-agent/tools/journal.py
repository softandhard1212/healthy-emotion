"""Per-user emotion + thought journal, backed by Supabase Postgres.

MDA's managed `memory.py` is deliberately not used here: it mounts one
`/memories/agent/` tree shared by *every* caller of the deployment, and this
app's whole point is a private journal per signed-in user. Supabase is
already in the picture for identity (see `identity.py`), so its Postgres
database also serves as the per-user journal store — each row scoped by
`runtime.identity["user"]["id"]`, the server-verified caller id that a
client can't spoof.

One entry per check-in, shaped around the CBT arc the conversation
actually walks through: what set it off, the automatic thought underneath
it, which known thinking pattern(s) that thought fits (see
`tools/patterns.py`), the reframe, and an affirmation to carry out of the
conversation. Mood (emotion + intensity) rides along on the same row
because it comes from the same moment — but the patterns are the part
worth reading back later, since a thought that keeps returning says more
than a mood that moves around.

Requires in `.env`:
  SUPABASE_URL               e.g. https://<project_ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  service role key (server-side only, bypasses
                              RLS — never expose this to a client)

Run `supabase/schema.sql` against your project before using these tools.
"""

import os
from collections import Counter
from datetime import datetime, timezone

import httpx
from langchain.tools import ToolRuntime, tool

from tools.patterns import THINKING_PATTERNS, normalize_patterns

_TABLE = "emotion_journal_entries"

_SELECT = (
    "emotion,intensity,trigger,technique_used,reflection,"
    "automatic_thought,reframe,thinking_patterns,affirmation,created_at"
)


def _rest_url(path: str = "") -> str:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    return f"{base}/rest/v1/{_TABLE}{path}"


def _headers(*, prefer: str | None = None) -> dict[str, str]:
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _caller_id(runtime: ToolRuntime) -> str | None:
    # MDA's wrapper overlays `.identity` onto the injected runtime before this
    # function body runs — see managed-deep-agents skill: annotate the
    # injected parameter as `ToolRuntime` (not `ManagedDeepAgentRuntime`), so
    # LangGraph's own pydantic validation accepts the raw object it injects
    # before MDA's wrapper gets a chance to swap in the identity-aware proxy.
    identity = getattr(runtime, "identity", None)
    if identity is None:
        return None
    return identity["user"]["id"]


def _label(slug: str) -> str:
    return THINKING_PATTERNS[slug]["label"]


@tool
def log_emotion_entry(
    emotion: str,
    intensity: int,
    trigger: str,
    technique_used: str,
    reflection: str,
    thinking_patterns: str,
    affirmation: str,
    automatic_thought: str = "",
    reframe: str = "",
    people: str = "",
    entry_id: str = "",
    *,
    runtime: ToolRuntime,
) -> str:
    """Record one entry in the signed-in user's private emotion journal.

    Args:
        emotion: The primary emotion(s), as given or inferred, e.g. "anxious, overwhelmed".
        intensity: How strong it felt, 0 (barely present) to 10 (overwhelming).
        trigger: What set it off, in a short phrase — the story behind the feeling.
        technique_used: The CBT/DBT technique discussed, e.g. "opposite action".
        reflection: A short note on how the technique landed or what shifted.
        thinking_patterns: Comma-separated slugs naming the distorted thinking pattern(s) behind the automatic thought — only from this list: catastrophizing, all_or_nothing, overgeneralizing, mind_reading, fortune_telling, emotional_reasoning, should_statements, personalizing, labeling, mental_filter, discounting_positives, comparison. Usually one, at most two. Pass an empty string when the thought didn't fit any of them — never invent a slug and never force a fit.
        affirmation: A short affirmation in the user's own first-person voice, written to answer this specific thought (not a generic slogan). One or two sentences, believable rather than relentlessly positive.
        automatic_thought: The specific automatic thought identified, in the user's own words as far as possible. Leave blank if the conversation didn't surface one (e.g. a grounding-only exchange).
        reframe: The reframed version of that thought, if one emerged. Leave blank if there wasn't a clean reframe.
        people: Comma-separated names of who the feeling or the thought was about, exactly as the user names them ("Mom", "Alex", "Dr. Reyes", "my manager"). Use "Self" when it was about the user themselves — that is common and worth recording. Reuse the spelling from earlier entries if you have seen the person before. Empty string if no one came up.
        entry_id: The id from a `[[be-context]]` message opening this conversation, if one appeared — see instructions.md. Updates that existing entry in place instead of creating a second one for the same check-in. Leave blank for a conversation that did not start from one.
    """
    user_id = _caller_id(runtime)
    if user_id is None:
        return (
            "Could not log this entry: no signed-in user for this session. "
            "Tell the user their journal isn't available right now."
        )
    if not 0 <= intensity <= 10:
        return "intensity must be between 0 and 10 — ask the user and retry."

    patterns, unknown = normalize_patterns(thinking_patterns)
    if unknown:
        # Refuse rather than silently dropping: an invented label would read
        # to the agent as "saved" and quietly break pattern recurrence, which
        # is the whole point of the journal.
        return (
            f"Not saved — unrecognized thinking pattern(s): {', '.join(unknown)}. "
            f"Use only these slugs: {', '.join(THINKING_PATTERNS)}. "
            "Pass an empty string if none of them fit, then retry."
        )
    if patterns and not automatic_thought.strip():
        return (
            "Not saved — a thinking pattern needs the automatic thought it "
            "was spotted in. Pass automatic_thought too, or clear "
            "thinking_patterns, then retry."
        )
    if not affirmation.strip():
        return (
            "Not saved — every entry needs an affirmation the user can come "
            "back to. Write one in their first-person voice, then retry."
        )

    fields = {
        "emotion": emotion,
        "intensity": intensity,
        "trigger": trigger,
        "technique_used": technique_used,
        "reflection": reflection,
        "automatic_thought": automatic_thought or None,
        "reframe": reframe or None,
        "thinking_patterns": patterns,
        "affirmation": affirmation.strip(),
        "people": [n.strip() for n in people.split(",") if n.strip()],
    }

    if entry_id.strip():
        # The app already inserted a lightweight row when the check-in was
        # logged through the word-picker (mood, activities, the precise
        # circumplex point). This finishes that same row rather than adding
        # a second entry for one check-in — point_x/point_y and activities
        # are left untouched, since the picker is a truer reading of those
        # than anything said in conversation.
        resp = httpx.patch(
            _rest_url(),
            headers=_headers(prefer="return=representation"),
            params={"id": f"eq.{entry_id.strip()}", "user_id": f"eq.{user_id}"},
            json=fields,
            timeout=10.0,
        )
        if resp.is_error:
            return f"Failed to save the journal entry ({resp.status_code}): {resp.text}"
        if not resp.json():
            return (
                "Not saved — no entry with that id for this user. Call again "
                "with entry_id cleared to log it as a new entry instead."
            )
    else:
        fields["user_id"] = user_id
        fields["created_at"] = datetime.now(timezone.utc).isoformat()
        resp = httpx.post(
            _rest_url(),
            headers=_headers(prefer="return=minimal"),
            json=fields,
            timeout=10.0,
        )
        if resp.is_error:
            return f"Failed to save the journal entry ({resp.status_code}): {resp.text}"

    if patterns:
        return f"Entry saved, tagged: {', '.join(_label(p) for p in patterns)}."
    return "Entry saved."


@tool
def get_emotion_progress(
    days: int,
    runtime: ToolRuntime,
) -> str:
    """Fetch the signed-in user's recent journal entries, with the thinking patterns that keep coming back.

    Args:
        days: How many days of history to look back over (e.g. 30).
    """
    user_id = _caller_id(runtime)
    if user_id is None:
        return (
            "Could not read the journal: no signed-in user for this session. "
            "Tell the user their journal isn't available right now."
        )

    since = datetime.now(timezone.utc).timestamp() - days * 86400
    since_iso = datetime.fromtimestamp(since, tz=timezone.utc).isoformat()
    params = {
        "user_id": f"eq.{user_id}",
        "created_at": f"gte.{since_iso}",
        "order": "created_at.asc",
        "select": _SELECT,
    }
    resp = httpx.get(_rest_url(), headers=_headers(), params=params, timeout=10.0)
    if resp.is_error:
        return f"Failed to load journal history ({resp.status_code}): {resp.text}"

    entries = resp.json()
    if not entries:
        return f"No journal entries in the last {days} days."

    avg_intensity = sum(e["intensity"] for e in entries) / len(entries)
    lines = [
        f"{len(entries)} entries in the last {days} days, "
        f"average intensity {avg_intensity:.1f}/10.",
    ]

    # Recurrence first: a thought that keeps returning is the thing worth
    # naming out loud, more than any single entry or the mood average.
    counts = Counter(
        slug
        for e in entries
        for slug in (e.get("thinking_patterns") or [])
        if slug in THINKING_PATTERNS
    )
    if counts:
        lines.append("")
        lines.append("Recurring thinking patterns:")
        for slug, n in counts.most_common():
            times = "once" if n == 1 else f"{n} times"
            lines.append(f"- {_label(slug)} ({slug}) — {times}")
        top_slug, top_n = counts.most_common(1)[0]
        if top_n >= 3:
            lines.append(
                f"  Worth surfacing gently: '{_label(top_slug)}' has come up "
                f"{top_n} times. The thoughts it showed up in: "
                + " | ".join(
                    e["automatic_thought"]
                    for e in entries
                    if top_slug in (e.get("thinking_patterns") or [])
                    and e.get("automatic_thought")
                )
            )

    lines.append("")
    for e in entries:
        line = (
            f"- {e['created_at']}: {e['emotion']} ({e['intensity']}/10), "
            f"trigger: {e['trigger']}, technique: {e['technique_used']} "
            f"— {e['reflection']}"
        )
        if e.get("automatic_thought"):
            line += f" | thought: {e['automatic_thought']}"
        slugs = [s for s in (e.get("thinking_patterns") or []) if s in THINKING_PATTERNS]
        if slugs:
            line += f" [{', '.join(_label(s) for s in slugs)}]"
        if e.get("reframe"):
            line += f" -> reframe: {e['reframe']}"
        if e.get("affirmation"):
            line += f" | affirmation: {e['affirmation']}"
        lines.append(line)
    return "\n".join(lines)
