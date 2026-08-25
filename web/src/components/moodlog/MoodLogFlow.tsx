import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CircumplexGrid from "./CircumplexGrid";
import EmotionMatrix from "./EmotionMatrix";
import ContextStep from "./ContextStep";
import {
  quadrantFor,
  type MoodLogDraft,
  type MoodPoint,
  type QuadrantId,
} from "../../lib/emotions";

interface Props {
  /** Receives the finished draft; resolves when the caller is done with it. */
  onComplete: (draft: MoodLogDraft) => void | Promise<void>;
  saving?: boolean;
}

type StepIndex = 0 | 1 | 2;

/** Slide direction follows travel: forward moves left, back moves right. */
const slide = {
  enter: (back: boolean) => ({ x: back ? -28 : 28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (back: boolean) => ({ x: back ? 28 : -28, opacity: 0 }),
};

/**
 * The three-step check-in: a point on the circumplex, the words that fit, then
 * what it's attached to. Each step answers something easier than "how do you
 * feel", and each one narrows what the next has to ask.
 */
export default function MoodLogFlow({ onComplete, saving = false }: Props) {
  const [step, setStep] = useState<StepIndex>(0);
  const [back, setBack] = useState(false);
  const [point, setPoint] = useState<MoodPoint | null>(null);
  const [quadrant, setQuadrant] = useState<QuadrantId | null>(null);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [note, setNote] = useState("");

  function go(next: StepIndex) {
    setBack(next < step);
    setStep(next);
  }

  function handlePick(picked: MoodPoint) {
    setPoint(picked);
    setQuadrant(quadrantFor(picked));
    go(1);
  }

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-4 pt-2">
      <StepDots step={step} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" custom={back} initial={false}>
          <motion.div
            key={step}
            custom={back}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {step === 0 && <CircumplexGrid onPick={handlePick} />}

            {step === 1 && quadrant && (
              <EmotionMatrix
                activeQuadrant={quadrant}
                selected={emotions}
                onToggle={(e) => setEmotions((prev) => toggle(prev, e))}
                onBack={() => go(0)}
                onContinue={() => go(2)}
              />
            )}

            {step === 2 && point && quadrant && (
              <ContextStep
                point={point}
                quadrant={quadrant}
                emotions={emotions}
                activities={activities}
                note={note}
                onToggleActivity={(id) =>
                  setActivities((prev) => toggle(prev, id))
                }
                onNoteChange={setNote}
                onBack={() => go(1)}
                saving={saving}
                onSave={() =>
                  onComplete({ point, quadrant, emotions, activities, note })
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepDots({ step }: { step: StepIndex }) {
  return (
    <div className="flex flex-none items-center gap-1.5 pb-4" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 rounded-full bg-teal-700"
          animate={{
            width: i === step ? 26 : 14,
            opacity: i === step ? 1 : i < step ? 0.5 : 0.18,
          }}
          transition={{ duration: 0.24 }}
        />
      ))}
    </div>
  );
}
