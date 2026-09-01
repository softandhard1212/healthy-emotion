import { createContext, useContext } from "react";
import type { QuadrantId } from "./emotions";

/**
 * What the three check-in steps build up between them. Lives in context on
 * the check-in route group rather than in route params, because step 2 is a
 * list of words and step 3 adds a free-text note — neither belongs in a URL.
 */
export interface CheckInDraft {
  /** Where step 1 landed. Only a guess; the words in step 2 decide the point. */
  guess: QuadrantId | null;
  emotions: string[];
  activities: string[];
  note: string;
}

export const EMPTY_DRAFT: CheckInDraft = { guess: null, emotions: [], activities: [], note: "" };

export interface CheckInStore {
  draft: CheckInDraft;
  update: (patch: Partial<CheckInDraft>) => void;
  reset: () => void;
}

export const CheckInContext = createContext<CheckInStore | null>(null);

export function useCheckIn(): CheckInStore {
  const store = useContext(CheckInContext);
  if (!store) throw new Error("useCheckIn must be used inside the check-in route group");
  return store;
}
