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

Distortions and lifts live in ONE table, distinguished only by `tone` —
that mirrors the product decision in `web/src/lib/patterns.ts` (which this
file mirrors; change one, change both): sorting a person's own mind into a
good pile and a bad pile is the opposite of the app's point. `tone` is
about where a pattern tends to get *caught*, not a verdict:

- `cool` patterns are worth loosening. Most show up in a hard moment, but
  two of them (`pleasing_relief`, `borrowed_footing`) show up in a good
  one — the relief was real, it just didn't come from where it looked
  like it came from. Those two carry a `question` like any other cool
  pattern, because there's something to loosen.
- `warm` patterns are worth noticing, not loosened — there's nothing to
  fix about having made something or told someone the truth. They carry
  no `question`.
"""

from typing import Literal, NotRequired, TypedDict


class ThinkingPattern(TypedDict):
    label: str
    description: str
    tone: Literal["cool", "warm"]
    # Only cool patterns carry one — there's nothing to loosen about a lift.
    question: NotRequired[str]


# slug -> how it reads to the user, where it tends to get caught, and (for
# cool patterns) the question that loosens it.
THINKING_PATTERNS: dict[str, ThinkingPattern] = {
    "catastrophizing": {
        "label": "Jumping to the worst case",
        "description": "The mind runs straight to the worst possible ending and treats it as the likely one.",
        "tone": "cool",
        "question": "If the worst case didn't happen, what's the most ordinary way this plays out?",
    },
    "all_or_nothing": {
        "label": "All or nothing",
        "description": "Something is either a total success or a total failure, with nothing in between.",
        "tone": "cool",
        "question": "What would the middle version of this look like?",
    },
    "overgeneralizing": {
        "label": "Always and never",
        "description": "One event becomes a rule about how things always go.",
        "tone": "cool",
        "question": "Is there a time it went differently, even a little?",
    },
    "mind_reading": {
        "label": "Mind reading",
        "description": "Assuming you know what someone else is thinking about you, usually the worst of it.",
        "tone": "cool",
        "question": "What else could explain what they did, if it wasn't about you?",
    },
    "fortune_telling": {
        "label": "Predicting the future",
        "description": "Treating a guess about what's coming as something already settled.",
        "tone": "cool",
        "question": "How sure can anyone actually be about that yet?",
    },
    "emotional_reasoning": {
        "label": "Feeling it makes it true",
        "description": "Because it feels true, it gets taken as evidence that it is true.",
        "tone": "cool",
        "question": "If a friend felt this way, would you take the feeling as proof?",
    },
    "should_statements": {
        "label": "Shoulds and musts",
        "description": "A rule about how you're supposed to be, that mostly produces guilt.",
        "tone": "cool",
        "question": "Where did that rule come from, and would you hold anyone else to it?",
    },
    "personalizing": {
        "label": "Taking it all on yourself",
        "description": "Reading yourself as the cause of something that had many causes.",
        "tone": "cool",
        "question": "What else was going on that had nothing to do with you?",
    },
    "labeling": {
        "label": "Labeling yourself",
        "description": "Turning something you did into a verdict on who you are.",
        "tone": "cool",
        "question": "What happened, said plainly, without the label?",
    },
    "mental_filter": {
        "label": "Only the bad part",
        "description": "One bad detail takes up the whole picture and the rest disappears.",
        "tone": "cool",
        "question": "What else was in the picture that got left out?",
    },
    "discounting_positives": {
        "label": "Discounting the good",
        "description": "Good things get explained away as luck, or as not really counting.",
        "tone": "cool",
        "question": "If someone else had done that, would it count then?",
    },
    "comparison": {
        "label": "Measuring against others",
        "description": "Your insides get measured against everyone else's outsides.",
        "tone": "cool",
        "question": "What are you not seeing about where they actually are?",
    },
    # --- Cool patterns caught in a good-feeling moment. The relief was
    # real; it just traces back to avoiding something rather than to the
    # thing itself being resolved. ---
    "pleasing_relief": {
        "label": "Relief that came from going along",
        "description": "The good feeling followed agreeing, deferring, or smoothing it over — relief at avoiding someone's disappointment, not at the thing itself getting resolved.",
        "tone": "cool",
        "question": "What would you have said if it didn't cost you anything to say it?",
    },
    "borrowed_footing": {
        "label": "Steadiness borrowed from someone else",
        "description": "The calm came from someone else deciding, leading, or backing you up — not from your own read of the situation.",
        "tone": "cool",
        "question": "Underneath what they think, what do you actually think?",
    },
    # --- Lifts. Recorded the same way, ranked in the same list, described
    # in the same register: what happened, not how well you did. No
    # `question` — there's nothing to loosen about having made something. ---
    "making_something_real": {
        "label": "Making something real",
        "description": "A stretch of time with a finished thing at the end of it — something that ran, shipped, or worked.",
        "tone": "warm",
    },
    "learning_you_could": {
        "label": "Learning you could",
        "description": "Finding out a thing was inside your reach after all.",
        "tone": "warm",
    },
    "saying_the_true_thing": {
        "label": "Saying the true thing",
        "description": "Speaking when staying quiet would have been easier.",
        "tone": "warm",
    },
    "being_in_your_body": {
        "label": "Being in your body",
        "description": "Time where the body led and the thinking went quiet.",
        "tone": "warm",
    },
    "people_who_matter": {
        "label": "Time with people who matter",
        "description": "Time with someone that left you better than it found you.",
        "tone": "warm",
    },
    "getting_absorbed": {
        "label": "Getting absorbed",
        "description": "Long enough inside something that you stopped tracking the time.",
        "tone": "warm",
    },
    "being_trusted": {
        "label": "Being trusted",
        "description": "Handed something that mattered, by someone who expected you to carry it.",
        "tone": "warm",
    },
    "helping_it_land": {
        "label": "Helping someone",
        "description": "Effort of yours that made a difference to somebody else.",
        "tone": "warm",
    },
}

COOL_PATTERN_SLUGS = tuple(s for s, p in THINKING_PATTERNS.items() if p["tone"] == "cool")
WARM_PATTERN_SLUGS = tuple(s for s, p in THINKING_PATTERNS.items() if p["tone"] == "warm")
PATTERN_SLUGS = tuple(THINKING_PATTERNS)


def normalize_patterns(
    raw: str, *, tone: Literal["cool", "warm"] | None = None
) -> tuple[list[str], list[str]]:
    """Split a comma-separated slug list into (recognized, unrecognized).

    Tolerant on the way in — case, spaces, and hyphens are normalized, so
    "Mind Reading, all-or-nothing" lands on the right slugs — but anything
    still unrecognized, or recognized under the wrong `tone` (a lift slug
    passed as a thinking pattern, say), is handed back rather than silently
    stored, so the tool can tell the agent which label it invented or
    misplaced.
    """
    recognized: list[str] = []
    unrecognized: list[str] = []
    for part in raw.split(","):
        slug = part.strip().lower().replace(" ", "_").replace("-", "_")
        if not slug:
            continue
        pattern = THINKING_PATTERNS.get(slug)
        if pattern and (tone is None or pattern["tone"] == tone):
            if slug not in recognized:
                recognized.append(slug)
        elif slug not in unrecognized:
            unrecognized.append(slug)
    return recognized, unrecognized


def patterns_reference(tone: Literal["cool", "warm"] | None = None) -> str:
    """The taxonomy as prompt-ready text, for instructions.md to stay in sync."""
    return "\n".join(
        f"- `{slug}` — {p['label']}: {p['description']}"
        for slug, p in THINKING_PATTERNS.items()
        if tone is None or p["tone"] == tone
    )
