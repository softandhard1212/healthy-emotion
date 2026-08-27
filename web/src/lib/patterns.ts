/**
 * The pattern taxonomy, mirroring `my-agent/tools/patterns.py`.
 *
 * The agent stores slugs; this table is how they read to the person whose
 * journal it is. Two vocabularies on purpose: the slug is stable enough to
 * count recurrences across months, the label is warm enough to read about
 * yourself. Change one file, change the other.
 *
 * Distortions and lifts live in ONE table, distinguished only by `tone`.
 * That is a product decision, not a convenience: the point of the Patterns
 * page is seeing yourself clearly, and sorting your own mind into a good
 * pile and a bad pile is the opposite of that. `tone` records where on the
 * circumplex a pattern's check-ins tended to land — nothing more.
 */

/** Where a pattern's check-ins tend to land. Neither is the good one. */
export type PatternTone = "cool" | "warm";

export interface ThinkingPattern {
  /** Plain-language name, the only form ever shown to the user. */
  label: string;
  /** What the pattern does, in second person, without clinical framing. */
  description: string;
  tone: PatternTone;
  /**
   * The question that loosens it. Only distortions carry one — there is
   * nothing to loosen about having made something.
   */
  question?: string;
}

export const THINKING_PATTERNS: Record<string, ThinkingPattern> = {
  catastrophizing: {
    label: "Jumping to the worst case",
    description:
      "The mind runs straight to the worst possible ending and treats it as the likely one.",
    tone: "cool",
    question:
      "If the worst case didn't happen, what's the most ordinary way this plays out?",
  },
  all_or_nothing: {
    label: "All or nothing",
    description:
      "Something is either a total success or a total failure, with nothing in between.",
    tone: "cool",
    question: "What would the middle version of this look like?",
  },
  overgeneralizing: {
    label: "Always and never",
    description: "One event becomes a rule about how things always go.",
    tone: "cool",
    question: "Is there a time it went differently, even a little?",
  },
  mind_reading: {
    label: "Mind reading",
    description:
      "Assuming you know what someone else is thinking about you, usually the worst of it.",
    tone: "cool",
    question: "What else could explain what they did, if it wasn't about you?",
  },
  fortune_telling: {
    label: "Predicting the future",
    description:
      "Treating a guess about what's coming as something already settled.",
    tone: "cool",
    question: "How sure can anyone actually be about that yet?",
  },
  emotional_reasoning: {
    label: "Feeling it makes it true",
    description:
      "Because it feels true, it gets taken as evidence that it is true.",
    tone: "cool",
    question: "If a friend felt this way, would you take the feeling as proof?",
  },
  should_statements: {
    label: "Shoulds and musts",
    description:
      "A rule about how you're supposed to be, that mostly produces guilt.",
    tone: "cool",
    question:
      "Where did that rule come from, and would you hold anyone else to it?",
  },
  personalizing: {
    label: "Taking it all on yourself",
    description:
      "Reading yourself as the cause of something that had many causes.",
    tone: "cool",
    question: "What else was going on that had nothing to do with you?",
  },
  labeling: {
    label: "Labeling yourself",
    description: "Turning something you did into a verdict on who you are.",
    tone: "cool",
    question: "What happened, said plainly, without the label?",
  },
  mental_filter: {
    label: "Only the bad part",
    description:
      "One bad detail takes up the whole picture and the rest disappears.",
    tone: "cool",
    question: "What else was in the picture that got left out?",
  },
  discounting_positives: {
    label: "Discounting the good",
    description:
      "Good things get explained away as luck, or as not really counting.",
    tone: "cool",
    question: "If someone else had done that, would it count then?",
  },
  comparison: {
    label: "Measuring against others",
    description: "Your insides get measured against everyone else's outsides.",
    tone: "cool",
    question: "What are you not seeing about where they actually are?",
  },
  // --- Cool patterns caught in a good-feeling moment. The relief was
  // real; it just traces back to avoiding something rather than to the
  // thing itself being resolved. ---
  pleasing_relief: {
    label: "Relief that came from going along",
    description:
      "The good feeling followed agreeing, deferring, or smoothing it over — relief at avoiding someone's disappointment, not at the thing itself getting resolved.",
    tone: "cool",
    question: "What would you have said if it didn't cost you anything to say it?",
  },
  borrowed_footing: {
    label: "Steadiness borrowed from someone else",
    description:
      "The calm came from someone else deciding, leading, or backing you up — not from your own read of the situation.",
    tone: "cool",
    question: "Underneath what they think, what do you actually think?",
  },
  // --- Lifts. Recorded the same way, ranked in the same list, described in
  // the same register: what happened, not how well you did. ---
  making_something_real: {
    label: "Making something real",
    description:
      "A stretch of time with a finished thing at the end of it — something that ran, shipped, or worked.",
    tone: "warm",
  },
  learning_you_could: {
    label: "Learning you could",
    description: "Finding out a thing was inside your reach after all.",
    tone: "warm",
  },
  saying_the_true_thing: {
    label: "Saying the true thing",
    description: "Speaking when staying quiet would have been easier.",
    tone: "warm",
  },
  being_in_your_body: {
    label: "Being in your body",
    description: "Time where the body led and the thinking went quiet.",
    tone: "warm",
  },
  people_who_matter: {
    label: "Time with people who matter",
    description: "Time with someone that left you better than it found you.",
    tone: "warm",
  },
  getting_absorbed: {
    label: "Getting absorbed",
    description: "Long enough inside something that you stopped tracking the time.",
    tone: "warm",
  },
  being_trusted: {
    label: "Being trusted",
    description: "Handed something that mattered, by someone who expected you to carry it.",
    tone: "warm",
  },
  helping_it_land: {
    label: "Helping someone",
    description: "Effort of yours that made a difference to somebody else.",
    tone: "warm",
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

/** Unknown slugs read as cool so an unfamiliar tag still renders legibly. */
export function patternTone(slug: string): PatternTone {
  return THINKING_PATTERNS[slug]?.tone ?? "cool";
}

export function isLift(slug: string): boolean {
  return patternTone(slug) === "warm";
}
