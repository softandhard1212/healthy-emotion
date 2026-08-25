"""The thinking-pattern taxonomy the journal is built around.

Spotting a distorted thought and putting a kinder, truer one next to it is
the core CBT move this app is trying to make automatic. For that to be
worth anything across entries, the *same* pattern has to come back with
the same name — free-text labels ("catastrophising", "worst-case
thinking", "spiralling") would fragment into noise and the journal could
never say "that's the fourth time this month."

So the agent picks from this fixed list, `log_emotion_entry` validates
against it, and the web app renders each slug with the plain-language
label below. Slugs are the contract; labels are deliberately warm and
non-clinical, because the user reads them.

`web/src/lib/patterns.ts` mirrors this table. Change one, change both.
"""

from typing import TypedDict


class ThinkingPattern(TypedDict):
    label: str
    description: str
    question: str


# slug -> how it reads to the user, and the question that loosens it.
THINKING_PATTERNS: dict[str, ThinkingPattern] = {
    "catastrophizing": {
        "label": "Jumping to the worst case",
        "description": "The mind runs straight to the worst possible ending and treats it as the likely one.",
        "question": "If the worst case didn't happen, what's the most ordinary way this plays out?",
    },
    "all_or_nothing": {
        "label": "All or nothing",
        "description": "Something is either a total success or a total failure, with nothing in between.",
        "question": "What would the middle version of this look like?",
    },
    "overgeneralizing": {
        "label": "Always and never",
        "description": "One event becomes a rule about how things always go.",
        "question": "Is there a time it went differently, even a little?",
    },
    "mind_reading": {
        "label": "Mind reading",
        "description": "Assuming you know what someone else is thinking about you, usually the worst of it.",
        "question": "What else could explain what they did, if it wasn't about you?",
    },
    "fortune_telling": {
        "label": "Predicting the future",
        "description": "Treating a guess about what's coming as something already settled.",
        "question": "How sure can anyone actually be about that yet?",
    },
    "emotional_reasoning": {
        "label": "Feeling it makes it true",
        "description": "Because it feels true, it gets taken as evidence that it is true.",
        "question": "If a friend felt this way, would you take the feeling as proof?",
    },
    "should_statements": {
        "label": "Shoulds and musts",
        "description": "A rule about how you're supposed to be, that mostly produces guilt.",
        "question": "Where did that rule come from, and would you hold anyone else to it?",
    },
    "personalizing": {
        "label": "Taking it all on yourself",
        "description": "Reading yourself as the cause of something that had many causes.",
        "question": "What else was going on that had nothing to do with you?",
    },
    "labeling": {
        "label": "Labeling yourself",
        "description": "Turning something you did into a verdict on who you are.",
        "question": "What happened, said plainly, without the label?",
    },
    "mental_filter": {
        "label": "Only the bad part",
        "description": "One bad detail takes up the whole picture and the rest disappears.",
        "question": "What else was in the picture that got left out?",
    },
    "discounting_positives": {
        "label": "Discounting the good",
        "description": "Good things get explained away as luck, or as not really counting.",
        "question": "If someone else had done that, would it count then?",
    },
    "comparison": {
        "label": "Measuring against others",
        "description": "Your insides get measured against everyone else's outsides.",
        "question": "What are you not seeing about where they actually are?",
    },
}

PATTERN_SLUGS = tuple(THINKING_PATTERNS)


def normalize_patterns(raw: str) -> tuple[list[str], list[str]]:
    """Split a comma-separated slug list into (recognized, unrecognized).

    Tolerant on the way in — case, spaces, and hyphens are normalized, so
    "Mind Reading, all-or-nothing" lands on the right slugs — but anything
    still unrecognized is handed back rather than silently stored, so the
    tool can tell the agent which label it invented.
    """
    recognized: list[str] = []
    unrecognized: list[str] = []
    for part in raw.split(","):
        slug = part.strip().lower().replace(" ", "_").replace("-", "_")
        if not slug:
            continue
        if slug in THINKING_PATTERNS:
            if slug not in recognized:
                recognized.append(slug)
        elif slug not in unrecognized:
            unrecognized.append(slug)
    return recognized, unrecognized


def patterns_reference() -> str:
    """The taxonomy as prompt-ready text, for instructions.md to stay in sync."""
    return "\n".join(
        f"- `{slug}` — {p['label']}: {p['description']}"
        for slug, p in THINKING_PATTERNS.items()
    )
