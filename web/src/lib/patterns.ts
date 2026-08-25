/**
 * The thinking-pattern taxonomy, mirroring `my-agent/tools/patterns.py`.
 *
 * The agent stores slugs; this table is how they read to the person whose
 * journal it is. Two vocabularies on purpose: the slug is stable enough to
 * count recurrences across months, the label is warm enough to read about
 * yourself. Change one file, change the other.
 */

export interface ThinkingPattern {
  /** Plain-language name, the only form ever shown to the user. */
  label: string;
  /** What the pattern does, in second person, without clinical framing. */
  description: string;
  /** The question that loosens it — shown when a pattern keeps recurring. */
  question: string;
}

export const THINKING_PATTERNS: Record<string, ThinkingPattern> = {
  catastrophizing: {
    label: "Jumping to the worst case",
    description:
      "The mind runs straight to the worst possible ending and treats it as the likely one.",
    question:
      "If the worst case didn't happen, what's the most ordinary way this plays out?",
  },
  all_or_nothing: {
    label: "All or nothing",
    description:
      "Something is either a total success or a total failure, with nothing in between.",
    question: "What would the middle version of this look like?",
  },
  overgeneralizing: {
    label: "Always and never",
    description: "One event becomes a rule about how things always go.",
    question: "Is there a time it went differently, even a little?",
  },
  mind_reading: {
    label: "Mind reading",
    description:
      "Assuming you know what someone else is thinking about you, usually the worst of it.",
    question: "What else could explain what they did, if it wasn't about you?",
  },
  fortune_telling: {
    label: "Predicting the future",
    description:
      "Treating a guess about what's coming as something already settled.",
    question: "How sure can anyone actually be about that yet?",
  },
  emotional_reasoning: {
    label: "Feeling it makes it true",
    description:
      "Because it feels true, it gets taken as evidence that it is true.",
    question: "If a friend felt this way, would you take the feeling as proof?",
  },
  should_statements: {
    label: "Shoulds and musts",
    description:
      "A rule about how you're supposed to be, that mostly produces guilt.",
    question:
      "Where did that rule come from, and would you hold anyone else to it?",
  },
  personalizing: {
    label: "Taking it all on yourself",
    description:
      "Reading yourself as the cause of something that had many causes.",
    question: "What else was going on that had nothing to do with you?",
  },
  labeling: {
    label: "Labeling yourself",
    description: "Turning something you did into a verdict on who you are.",
    question: "What happened, said plainly, without the label?",
  },
  mental_filter: {
    label: "Only the bad part",
    description:
      "One bad detail takes up the whole picture and the rest disappears.",
    question: "What else was in the picture that got left out?",
  },
  discounting_positives: {
    label: "Discounting the good",
    description:
      "Good things get explained away as luck, or as not really counting.",
    question: "If someone else had done that, would it count then?",
  },
  comparison: {
    label: "Measuring against others",
    description: "Your insides get measured against everyone else's outsides.",
    question: "What are you not seeing about where they actually are?",
  },
};

/**
 * Renders a slug for display, tolerating one the app doesn't know about —
 * the agent could be a deploy ahead of the web app, and an entry is still
 * worth showing when its tag is unfamiliar.
 */
export function patternLabel(slug: string): string {
  return (
    THINKING_PATTERNS[slug]?.label ??
    slug.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
  );
}

export function patternDetail(slug: string): ThinkingPattern | undefined {
  return THINKING_PATTERNS[slug];
}
