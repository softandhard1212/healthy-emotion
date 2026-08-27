"""Per-user emotion + thought journal, backed by Supabase Postgres.

MDA's managed `memory.py` is deliberately not used here: it mounts one
`/memories/agent/` tree shared by *every* caller of the deployment, and this
app's whole point is a private journal per signed-in user. Supabase is
already in the picture for identity (see `identity.py`), so its Postgres
database also serves as the per-user journal store — each row scoped by
`runtime.identity["user"]["id"]`, the server-verified caller id that a
client can't spoof.

One entry per check-in, and a check-in can go either of two ways — the
entry shape follows whichever one happened:

- **A hard moment.** What set it off, the automatic thought underneath it,
  which known thinking pattern that thought fits (see `tools/patterns.py`),
  the reframe, and an affirmation to carry out of the conversation.
- **A good moment.** What was happening (`bright_moment`), and — because a
  good feeling isn't automatically evidence of anything — which lift or
  cool pattern it actually turned out to be once you looked at where it
  came from (see "the two kinds of good feeling" in `instructions.md`).

Either way, `revealed` is the answer to the same question: what did this
moment say about you? That line is the part worth reading back later, more
than the mood itself — a mood moves around; what a moment reveals about
you tends to recur.

Mood (emotion + intensity + valence/energy, which place the check-in on
the same grid the app's UI check-in uses) rides along on every row because
it comes from the same conversation, but it's the lightest-weight part of
the record.

Requires in `.env`:
  SUPABASE_URL               e.g. https://<project_ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  service role key (server-side only, bypasses
                              RLS — never expose this to a client)

Run `supabase/schema.sql` against your project before using these tools.
"""

import os
from collections import Counter
from datetime import datetime, timezone
from typing import Literal

import httpx
from langchain.tools import ToolRuntime, tool

from tools.patterns import (
    COOL_PATTERN_SLUGS,
    THINKING_PATTERNS,
    WARM_PATTERN_SLUGS,
    normalize_patterns,
)

_TABLE = "emotion_journal_entries"

_ACTIVITIES = (
    "work", "social", "sleep", "health", "family", "money",
    "study", "exercise", "food", "alone", "outdoors", "news",
)

_SELECT = (
    "emotion,intensity,trigger,technique_used,reflection,"
    "automatic_thought,reframe,thinking_patterns,affirmation,"
    "bright_moment,revealed,lift_patterns,created_at"
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


def _point(direction: str, positive: str, negative: str, magnitude: float) -> float | None:
    if direction == positive:
        return magnitude
    if direction == negative:
        return -magnitude
    return None


def _normalize_activities(raw: str) -> tuple[list[str], list[str]]:
    recognized: list[str] = []
    unrecognized: list[str] = []
    for part in raw.split(","):
        slug = part.strip().lower()
        if not slug:
            continue
        if slug in _ACTIVITIES:
            if slug not in recognized:
                recognized.append(slug)
        elif slug not in unrecognized:
            unrecognized.append(slug)
    return recognized, unrecognized


@tool
def log_emotion_entry(
    emotion: str,
    intensity: int,
    valence: Literal["pleasant", "unpleasant"],
    energy: Literal["high", "low"],
    trigger: str,
    technique_used: str,
    reflection: str,
    thinking_patterns: str,
    lift_patterns: str,
    affirmation: str,
    automatic_thought: str = "",
    reframe: str = "",
    bright_moment: str = "",
    revealed: str = "",
    activities: str = "",
    *,
    runtime: ToolRuntime,
) -> str:
    """Record one entry in the signed-in user's private emotion journal.

    Args:
        emotion: The primary emotion(s), as given or inferred, e.g. "anxious, overwhelmed".
        intensity: How strong it felt, 0 (barely present) to 10 (overwhelming).
        valence: Whether the feeling itself was pleasant or unpleasant to be in — places the check-in on the same grid the app's check-in UI uses. This is about how it felt, not whether what caused it was good for them (see "the two kinds of good feeling" in instructions.md).
        energy: Whether it came with high or low energy — wired/activated vs. still/flat.
        trigger: What set it off, in a short phrase — the situation behind the feeling, whichever direction it went.
        technique_used: The CBT/DBT technique discussed, e.g. "opposite action". Pass "none" if the conversation was a good-moment check-in with no technique involved.
        reflection: A short note on how the conversation landed or what shifted.
        thinking_patterns: Comma-separated slugs naming a cool-toned pattern the automatic thought fits — only from this list: catastrophizing, all_or_nothing, overgeneralizing, mind_reading, fortune_telling, emotional_reasoning, should_statements, personalizing, labeling, mental_filter, discounting_positives, comparison, pleasing_relief, borrowed_footing. Usually one, at most two. Pass an empty string when nothing fits — never invent a slug and never force a fit. The last two fit a *good*-feeling moment whose relief traced back to avoiding something rather than resolving it.
        lift_patterns: Comma-separated slugs naming a warm-toned pattern a good moment turned out to be — only from this list: making_something_real, learning_you_could, saying_the_true_thing, being_in_your_body, people_who_matter, getting_absorbed, being_trusted, helping_it_land. Pass an empty string when the good feeling turned out to be one of the cool patterns above instead, or when nothing fits.
        affirmation: A short affirmation in the user's own first-person voice, written to answer this specific thought — or, for a lift, to name what it showed without inflating it. One or two sentences, believable rather than relentlessly positive.
        automatic_thought: The specific automatic thought identified, in the user's own words as far as possible. Leave blank if the conversation didn't surface one (e.g. a grounding-only exchange, or a lift with no thought attached).
        reframe: The reframed version of that thought, if one emerged. Leave blank if there wasn't a clean reframe.
        bright_moment: For a good-moment check-in, what was happening, in the user's own words — the counterpart to `trigger` for the moment that felt good. Leave blank for a hard-moment check-in.
        revealed: What this moment said about them — the one thing worth them reading back later, whichever direction the check-in went. Leave blank only when nothing genuinely surfaced; don't manufacture one to fill the field.
        activities: Comma-separated ids for what the check-in was tied up with — only from: work, social, sleep, health, family, money, study, exercise, food, alone, outdoors, news. Empty string if nothing fits or it wasn't tied to anything in particular.
    """
    user_id = _caller_id(runtime)
    if user_id is None:
        return (
            "Could not log this entry: no signed-in user for this session. "
            "Tell the user their journal isn't available right now."
        )
    if not 0 <= intensity <= 10:
        return "intensity must be between 0 and 10 — ask the user and retry."

    patterns, unknown = normalize_patterns(thinking_patterns, tone="cool")
    if unknown:
        # Refuse rather than silently dropping: an invented or misplaced
        # label would read to the agent as "saved" and quietly break pattern
        # recurrence, which is the whole point of the journal.
        return (
            f"Not saved — unrecognized or misplaced thinking pattern(s): {', '.join(unknown)}. "
            f"thinking_patterns only takes: {', '.join(COOL_PATTERN_SLUGS)}. "
            "A warm/lift pattern belongs in lift_patterns instead. "
            "Pass an empty string if none of them fit, then retry."
        )
    lifts, unknown_lifts = normalize_patterns(lift_patterns, tone="warm")
    if unknown_lifts:
        return (
            f"Not saved — unrecognized or misplaced lift pattern(s): {', '.join(unknown_lifts)}. "
            f"lift_patterns only takes: {', '.join(WARM_PATTERN_SLUGS)}. "
            "A cool pattern belongs in thinking_patterns instead. "
            "Pass an empty string if none of them fit, then retry."
        )
    if patterns and not automatic_thought.strip():
        return (
            "Not saved — a thinking pattern needs the automatic thought it "
            "was spotted in. Pass automatic_thought too, or clear "
            "thinking_patterns, then retry."
        )
    if lifts and not bright_moment.strip():
        return (
            "Not saved — a lift pattern needs the bright_moment it was "
            "spotted in. Pass bright_moment too, or clear lift_patterns, "
            "then retry."
        )
    if not affirmation.strip():
        return (
            "Not saved — every entry needs an affirmation the user can come "
            "back to. Write one in their first-person voice, then retry."
        )

    activity_ids, unknown_activities = _normalize_activities(activities)
    if unknown_activities:
        return (
            f"Not saved — unrecognized activity id(s): {', '.join(unknown_activities)}. "
            f"activities only takes: {', '.join(_ACTIVITIES)}. Retry with "
            "only those, or an empty string."
        )

    row = {
        "user_id": user_id,
        "emotion": emotion,
        "intensity": intensity,
        "trigger": trigger,
        "technique_used": technique_used,
        "reflection": reflection,
        "automatic_thought": automatic_thought or None,
        "reframe": reframe or None,
        "thinking_patterns": patterns,
        "lift_patterns": lifts,
        "affirmation": affirmation.strip(),
        "bright_moment": bright_moment or None,
        "revealed": revealed or None,
        "activities": activity_ids,
        "point_x": _point(valence, "pleasant", "unpleasant", intensity),
        "point_y": _point(energy, "high", "low", intensity),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    resp = httpx.post(
        _rest_url(),
        headers=_headers(prefer="return=minimal"),
        json=row,
        timeout=10.0,
    )
    if resp.is_error:
        return f"Failed to save the journal entry ({resp.status_code}): {resp.text}"
    tagged = patterns + lifts
    if tagged:
        return f"Entry saved, tagged: {', '.join(_label(p) for p in tagged)}."
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

    # Recurrence first: a thought or a lift that keeps returning is the
    # thing worth naming out loud, more than any single entry or the mood
    # average.
    counts = Counter(
        slug
        for e in entries
        for slug in (e.get("thinking_patterns") or []) + (e.get("lift_patterns") or [])
        if slug in THINKING_PATTERNS
    )
    if counts:
        lines.append("")
        lines.append("Recurring patterns:")
        for slug, n in counts.most_common():
            times = "once" if n == 1 else f"{n} times"
            lines.append(f"- {_label(slug)} ({slug}) — {times}")
        top_slug, top_n = counts.most_common(1)[0]
        if top_n >= 3:
            top_lines = [
                e.get("automatic_thought") or e.get("revealed")
                for e in entries
                if top_slug in ((e.get("thinking_patterns") or []) + (e.get("lift_patterns") or []))
                and (e.get("automatic_thought") or e.get("revealed"))
            ]
            lines.append(
                f"  Worth surfacing gently: '{_label(top_slug)}' has come up "
                f"{top_n} times. What it looked like each time: "
                + " | ".join(top_lines)
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
        if e.get("bright_moment"):
            line += f" | bright moment: {e['bright_moment']}"
        slugs = [
            s
            for s in (e.get("thinking_patterns") or []) + (e.get("lift_patterns") or [])
            if s in THINKING_PATTERNS
        ]
        if slugs:
            line += f" [{', '.join(_label(s) for s in slugs)}]"
        if e.get("reframe"):
            line += f" -> reframe: {e['reframe']}"
        if e.get("revealed"):
            line += f" | revealed: {e['revealed']}"
        if e.get("affirmation"):
            line += f" | affirmation: {e['affirmation']}"
        lines.append(line)
    return "\n".join(lines)
