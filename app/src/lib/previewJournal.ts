import type { JournalEntry } from "./journal";

export interface PreviewTurn {
  role: "ai" | "user";
  text: string;
}

export interface PreviewJournalPresentation {
  title: string;
  feelings: string[];
  thoughtTags: string[];
  supportiveBelief: string;
  supportiveTags: string[];
  shift: string;
  transcript: PreviewTurn[];
}

export const PREVIEW_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "preview-career",
    emotion: "Anxious and Restless",
    intensity: 7,
    trigger: "Third late night this week. Deadline pressure from the sprint review.",
    technique_used: "",
    reflection: "feel stuck in my career",
    automatic_thought: "I'll freeze up and everyone will realize I don't belong in that room",
    reframe: "I enjoy making an app",
    thinking_patterns: ["catastrophizing", "mind_reading"],
    affirmation: null,
    affirmation_saved: false,
    bright_moment: null,
    revealed: null,
    lift_patterns: null,
    activities: ["work"],
    people: ["Self"],
    point_x: -5,
    point_y: 6,
    created_at: "2026-08-26T21:12:00.000Z",
  },
  {
    id: "preview-inspiration",
    emotion: "Inspired and Energized",
    intensity: 7,
    trigger: "The first working version finally came together after weeks of uncertainty.",
    technique_used: "",
    reflection: "work inspiration",
    automatic_thought: "Maybe I really can build what I imagine.",
    reframe: "I can turn ideas into real things.",
    thinking_patterns: null,
    affirmation: null,
    affirmation_saved: false,
    bright_moment: null,
    revealed: null,
    lift_patterns: null,
    activities: ["creativity"],
    people: ["Self"],
    point_x: -7,
    point_y: -6,
    created_at: "2026-08-25T18:20:00.000Z",
  },
  {
    id: "preview-connection",
    emotion: "Connected and Reassured",
    intensity: 5,
    trigger: "I shared what I was afraid of, and my partner stayed present with me.",
    technique_used: "",
    reflection: "connection",
    automatic_thought: "I don't have to carry everything alone.",
    reframe: "Being seen can be safe.",
    thinking_patterns: null,
    affirmation: null,
    affirmation_saved: false,
    bright_moment: null,
    revealed: null,
    lift_patterns: null,
    activities: ["social"],
    people: ["Partner"],
    point_x: 6,
    point_y: -3,
    created_at: "2026-08-26T14:10:00.000Z",
  },
];

const PRESENTATIONS: Record<string, PreviewJournalPresentation> = {
  "preview-career": {
    title: "feel stuck in my career",
    feelings: ["Anxious", "Restless"],
    thoughtTags: ["Jumping to the worst case", "Mind reading"],
    supportiveBelief: "I enjoy making an app",
    supportiveTags: ["Finding your inspiration"],
    shift: "You realized how powerful you are.",
    transcript: [
      { role: "ai", text: "What feels most present for you today?" },
      { role: "user", text: "I feel anxious about the sprint review." },
      { role: "ai", text: "What does the pressure seem to say about you?" },
      { role: "user", text: "That I might freeze and not belong in the room." },
    ],
  },
  "preview-inspiration": {
    title: "work inspiration",
    feelings: ["Inspired", "Energized"],
    thoughtTags: ["Recognising evidence", "New possibility"],
    supportiveBelief: "I can turn ideas into real things.",
    supportiveTags: ["Owning your capability"],
    shift: "You let lived evidence update who you believe you are.",
    transcript: [
      { role: "user", text: "The first working version finally came together." },
      { role: "ai", text: "It sounds like the finished thing gave you new evidence about yourself." },
    ],
  },
  "preview-connection": {
    title: "connection",
    feelings: ["Connected", "Reassured"],
    thoughtTags: ["Receiving support", "Softening protection"],
    supportiveBelief: "Being seen can be safe.",
    supportiveTags: ["Trusting connection"],
    shift: "Support became evidence, not only reassurance.",
    transcript: [
      { role: "user", text: "I shared what I was afraid of with my partner." },
      { role: "ai", text: "And they stayed present. What did that make possible?" },
      { role: "user", text: "I felt like I didn't have to carry everything alone." },
    ],
  },
};

export function previewJournalPresentation(id: string): PreviewJournalPresentation | undefined {
  return PRESENTATIONS[id];
}
