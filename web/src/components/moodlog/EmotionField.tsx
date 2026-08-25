import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  QUADRANTS,
  QUADRANT_ORDER,
  bubbleFill,
  emotionsIn,
  findEmotion,
  quadrantFor,
  type QuadrantId,
} from "../../lib/emotions";

interface Props {
  /** Where step 1 landed — the field opens scrolled to this band. */
  activeQuadrant: QuadrantId;
  selected: string[];
  /** The most recent pick, whose definition is showing. */
  lastPicked: string | null;
  onToggle: (word: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Step 2 — every word on one continuous field.
 *
 * Not filtered to the quadrant from step 1: that was a guess, and "exhausted
 * but also relieved" spans two. So the whole vocabulary stays on one surface,
 * shaded by where each word sits on the circumplex, and the view simply
 * *opens* on the predicted band with its neighbours visible — a starting
 * point to correct by scrolling, not a filter to clear.
 *
 * Each pick surfaces what the word means. Telling "discouraged" from
 * "frustrated" is most of what makes a check-in worth anything later.
 */
export default function EmotionField({
  activeQuadrant,
  selected,
  lastPicked,
  onToggle,
  onBack,
  onContinue,
}: Props) {
  const bandRefs = useRef<Partial<Record<QuadrantId, HTMLDivElement | null>>>({});

  useEffect(() => {
    const target = bandRefs.current[activeQuadrant];
    if (!target) return;
    const id = requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => cancelAnimationFrame(id);
  }, [activeQuadrant]);

  const detail = lastPicked ? findEmotion(lastPicked) : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex flex-none flex-col gap-1">
        <h1 className="text-[26px] leading-tight font-medium tracking-tight text-stone-800">
          Which words fit?
        </h1>
        <p className="text-[13.5px] leading-relaxed text-stone-500">
          Tap any that are true — scroll for the rest.
        </p>
      </header>

      <div className="-mx-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-1">
        <div className="flex flex-col gap-4">
          {QUADRANT_ORDER.map((id) => (
            <div
              key={id}
              ref={(el) => {
                bandRefs.current[id] = el;
              }}
              className="flex scroll-m-4 flex-col gap-2"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest opacity-55"
                style={{ color: QUADRANTS[id].ink }}
              >
                {QUADRANTS[id].title}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {emotionsIn(id).map((emotion) => {
                  const on = selected.includes(emotion.word);
                  const ink = QUADRANTS[quadrantFor(emotion)].ink;
                  return (
                    <motion.button
                      key={emotion.word}
                      type="button"
                      aria-pressed={on}
                      onClick={() => onToggle(emotion.word)}
                      whileTap={{ scale: 0.92 }}
                      animate={{ scale: on ? 1.04 : 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 26 }}
                      className="flex aspect-square items-center justify-center rounded-full px-1 text-center text-[10.5px] leading-[1.15] hyphens-auto"
                      style={{
                        background: bubbleFill(emotion),
                        color: ink,
                        fontWeight: on ? 800 : 500,
                        boxShadow: on ? `inset 0 0 0 2.5px ${ink}` : "none",
                      }}
                    >
                      {emotion.word}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none">
        <AnimatePresence mode="wait">
          {detail && (
            <motion.div
              key={detail.word}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mb-2 rounded-2xl border px-4 py-3"
              style={{
                background: bubbleFill(detail),
                borderColor: QUADRANTS[quadrantFor(detail)].border,
              }}
            >
              <p
                className="text-[13px] leading-snug"
                style={{ color: QUADRANTS[quadrantFor(detail)].ink }}
              >
                <span className="font-bold">{detail.word}</span>
                {" — "}
                {detail.definition}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[48px] rounded-full px-4 text-[14px] font-medium text-stone-500"
          >
            Back
          </button>
          <motion.button
            type="button"
            onClick={onContinue}
            disabled={selected.length === 0}
            animate={{ opacity: selected.length ? 1 : 0.45 }}
            className="min-h-[48px] flex-1 rounded-full bg-teal-700 px-5 text-[15px] font-semibold text-white disabled:cursor-default"
          >
            {selected.length ? `Continue with ${selected.length}` : "Pick at least one"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
