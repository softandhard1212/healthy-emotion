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
  /** Where step 1 landed — the canvas opens centred on this corner. */
  activeQuadrant: QuadrantId;
  selected: string[];
  /** The most recent pick, whose definition is showing. */
  lastPicked: string | null;
  onToggle: (word: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Each corner is sized to about fill the viewport, so the canvas runs roughly
 * two screens wide and two deep and you travel between quadrants by dragging
 * in the direction that quadrant lies.
 *
 * The width is deliberately a little under the viewport: it leaves a band of
 * the next corner's colour showing at the edge, which is the only thing
 * telling someone the other three exist. Full-width would fill the screen more
 * handsomely and strand them in one quadrant.
 */
const QUADRANT_PX = 308;
const CANVAS_GAP = 20;

/**
 * Step 2 — the whole vocabulary as one 2×2 field.
 *
 * Laid out as the circumplex itself: unpleasant on the left, pleasant on the
 * right, high energy up, low energy down. Within each corner the bubbles are
 * shaded by how far from neutral the word sits, so "irritated" and "angry"
 * read as the same family at different strengths rather than two equal chips.
 *
 * Not filtered to the quadrant from step 1: that was a guess, and "exhausted
 * but also relieved" spans two corners. The view merely *opens* centred on the
 * guess with its neighbours in frame — a starting point to correct by panning,
 * not a filter to clear.
 */
export default function EmotionField({
  activeQuadrant,
  selected,
  lastPicked,
  onToggle,
  onBack,
  onContinue,
}: Props) {
  const cornerRefs = useRef<Partial<Record<QuadrantId, HTMLDivElement | null>>>({});

  useEffect(() => {
    const target = cornerRefs.current[activeQuadrant];
    if (!target) return;
    const id = requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
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
          Tap any that are true — drag around for the rest.
        </p>
      </header>

      <div
        className="-mx-5 min-h-0 flex-1 overflow-auto overscroll-contain px-5 py-2"
        style={{ scrollSnapType: "both proximity" }}
      >
        <div
          className="grid grid-cols-2"
          style={{ width: QUADRANT_PX * 2 + CANVAS_GAP, gap: CANVAS_GAP }}
        >
          {QUADRANT_ORDER.map((id) => {
            const q = QUADRANTS[id];
            return (
              <div
                key={id}
                ref={(el) => {
                  cornerRefs.current[id] = el;
                }}
                className="flex flex-col gap-2"
                style={{ width: QUADRANT_PX, scrollSnapAlign: "center" }}
              >
                <span
                  className="px-1 text-[10.5px] font-bold uppercase leading-tight tracking-widest opacity-55"
                  style={{ color: q.ink }}
                >
                  {q.title}
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  {emotionsIn(id).map((emotion) => {
                    const on = selected.includes(emotion.word);
                    const ink = QUADRANTS[quadrantFor(emotion)].ink;
                    return (
                      <motion.button
                        key={emotion.word}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(emotion.word)}
                        whileTap={{ scale: 0.9 }}
                        animate={{ scale: on ? 1.06 : 1 }}
                        transition={{ type: "spring", stiffness: 420, damping: 26 }}
                        className="flex aspect-square items-center justify-center rounded-full px-2 text-center text-[12px] leading-[1.15]"
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
            );
          })}
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
