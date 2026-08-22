"""Per-user emotion + thought journal, backed by Supabase Postgres.

MDA's managed `memory.py` is deliberately not used here: it mounts one
`/memories/agent/` tree shared by *every* caller of the deployment, and this
app's whole point is a private journal per signed-in user. Supabase is
already in the picture for identity (see `identity.py`), so its Postgres
database also serves as the per-user journal store — each row scoped by
`runtime.identity["user"]["id"]`, the server-verified caller id that a
client can't spoof.

One combined entry shape covers both mood tracking and thought-pattern
tracking, since both come from the same conversational moment: the
emotion/intensity/trigger/technique fields plus an optional automatic
thought and reframe (optional because not every technique — grounding,
TIPP — produces a clean thought/reframe pair).

Requires in `.env`:
  SUPABASE_URL               e.g. https://<project_ref>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY  service role key (server-side only, bypasses
                              RLS — never expose this to a client)

Run `supabase/schema.sql` against your project before using these tools.
"""

import os
from datetime import datetime, timezone

import httpx
from langchain.tools import ToolRuntime, tool

_TABLE = "emotion_journal_entries"


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


@tool
def log_emotion_entry(
    emotion: str,
    intensity: int,
    trigger: str,
    technique_used: str,
    reflection: str,
    automatic_thought: str = "",
    reframe: str = "",
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
        automatic_thought: The specific automatic thought identified, if any. Leave blank if the conversation didn't surface one (e.g. a grounding-only exchange).
        reframe: The reframed version of that thought, if one emerged. Leave blank if there wasn't a clean reframe.
    """
    user_id = _caller_id(runtime)
    if user_id is None:
        return (
            "Could not log this entry: no signed-in user for this session. "
            "Tell the user their journal isn't available right now."
        )
    if not 0 <= intensity <= 10:
        return "intensity must be between 0 and 10 — ask the user and retry."

    row = {
        "user_id": user_id,
        "emotion": emotion,
        "intensity": intensity,
        "trigger": trigger,
        "technique_used": technique_used,
        "reflection": reflection,
        "automatic_thought": automatic_thought or None,
        "reframe": reframe or None,
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
    return "Entry saved."


@tool
def get_emotion_progress(
    days: int,
    runtime: ToolRuntime,
) -> str:
    """Fetch the signed-in user's recent emotion journal entries.

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
        "select": (
            "emotion,intensity,trigger,technique_used,reflection,"
            "automatic_thought,reframe,created_at"
        ),
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
        "",
    ]
    for e in entries:
        line = (
            f"- {e['created_at']}: {e['emotion']} ({e['intensity']}/10), "
            f"trigger: {e['trigger']}, technique: {e['technique_used']} "
            f"— {e['reflection']}"
        )
        if e.get("automatic_thought"):
            line += f" | thought: {e['automatic_thought']}"
        if e.get("reframe"):
            line += f" -> reframe: {e['reframe']}"
        lines.append(line)
    return "\n".join(lines)
