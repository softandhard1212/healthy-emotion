import type { ImageSourcePropType } from "react-native";

export interface BeliefCardData {
  id: string;
  title: string;
  meta: string;
  cue?: string;
  colors: readonly [string, string];
  image: ImageSourcePropType;
  imageTop: number;
  artwork: "full" | "half";
  cardWidth: "wide" | "tile";
  cardHeight: 184 | 210;
  imageHeight: 371 | 743;
}

export interface BeliefSectionData {
  title: string;
  cards: BeliefCardData[];
}

const authenticBuilder = require("../../assets/beliefs/authentic-builder.png");
const innerMirror = require("../../assets/beliefs/inner-mirror.png");
const watchfulMind = require("../../assets/beliefs/watchful-mind.png");
const gentleWitness = require("../../assets/beliefs/gentle-witness.png");
const quietAnchor = require("../../assets/beliefs/quiet-anchor.png");
const openExplorer = require("../../assets/beliefs/open-explorer.png");
const clearingSpace = require("../../assets/beliefs/clearing-space.png");

export const BELIEF_SECTIONS: BeliefSectionData[] = [
  {
    title: "WHAT MOVES YOU",
    cards: [
      { id: "authentic-builder", title: "The Authentic Builder", meta: "EMERGING · BUILDER", cue: "Tap to enter", colors: ["#70BDB0", "#91A8E0"], image: authenticBuilder, imageTop: -206, artwork: "full", cardWidth: "wide", cardHeight: 210, imageHeight: 743 },
    ],
  },
  {
    title: "HOW YOU CONNECT",
    cards: [
      { id: "inner-mirror", title: "The Inner Mirror", meta: "REFLECTION", colors: ["#8CABE0", "#B59EE0"], image: innerMirror, imageTop: -95, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 371 },
      { id: "watchful-mind", title: "The Watchful Mind", meta: "UNFOLDING", colors: ["#E38A73", "#F7B575"], image: watchfulMind, imageTop: -45, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 371 },
    ],
  },
  {
    title: "WHAT YOU BELIEVE",
    cards: [
      { id: "gentle-witness", title: "The Gentle Witness", meta: "REFLECTION", colors: ["#A8B8E0", "#D8C7FF"], image: gentleWitness, imageTop: -95, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 371 },
      { id: "quiet-anchor", title: "The Quiet Anchor", meta: "UNFOLDING", colors: ["#E38A73", "#F7B575"], image: quietAnchor, imageTop: -45, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 371 },
      { id: "open-explorer", title: "The Open Explorer", meta: "EMERGING · EXPLORER", cue: "Tap to enter", colors: ["#70BDB0", "#91A8E0"], image: openExplorer, imageTop: -206, artwork: "full", cardWidth: "wide", cardHeight: 210, imageHeight: 743 },
    ],
  },
  {
    title: "WHAT SUPPORTS YOU",
    cards: [
      { id: "clearing-space", title: "The Clearing Space", meta: "EMERGING · SPACE", colors: ["#8CABE0", "#B59EE0"], image: clearingSpace, imageTop: -206, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 743 },
      { id: "resilient-heart", title: "The Resilient Heart", meta: "REFLECTION", colors: ["#A8B8E0", "#D8C7FF"], image: gentleWitness, imageTop: -95, artwork: "half", cardWidth: "tile", cardHeight: 184, imageHeight: 371 },
      { id: "steady-observer", title: "The Steady Observer", meta: "UNFOLDING", colors: ["#E38A73", "#F7B575"], image: quietAnchor, imageTop: -45, artwork: "half", cardWidth: "wide", cardHeight: 184, imageHeight: 371 },
    ],
  },
];

export const BELIEFS = BELIEF_SECTIONS.flatMap((section) => section.cards);

export function beliefById(id: string): BeliefCardData | undefined {
  return BELIEFS.find((belief) => belief.id === id);
}
