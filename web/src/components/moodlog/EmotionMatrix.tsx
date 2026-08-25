import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  QUADRANTS,
  QUADRANT_ORDER,
  type QuadrantId,
} from "../../lib/emotions";

interface Props {
  /** Where Step 1 landed — decides which quadrant the view centres on. */
  activeQuadrant: QuadrantId;
  selected: string[];
  onToggle: (emotion: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

/**
 * Step 2 — all four quadrants on one pannable canvas.
 *
 * Deliberately not a filtered list: the guess from Step 1 is only a guess, and
 * someone who feels "tired but also relieved" needs to reach two quadrants
 * without going back. So every word stays on one surface, and the view simply
 * *opens* on the predicted quadrant with its neighbours visible at the edges —
 * a starting point that can be corrected by scrolling rather than a filter
 * that has to be cleared.
 */
export default function EmotionMatrix({
  activeQuadrant,
  selected,
  onToggle,
  onBack,
  onContinue,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const quadrantRefs = useRef<Partial<Record<QuadrantId, HTMLDivElement | null>>>({});

  useEffect(() => {
    const target = quadrantRefs.current[activeQuadrant];
    if (!target) return;
    // Centre the predicted quadrant, leaving its neighbours peeking in at the
    // edges. Deferred a frame so layout has settled after the step transition.
    const id = requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [activeQuadrant]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] leading-tight font-medium tracking-tight text-stone-800">
          Which of these fit?
        </h1>
        <p className="text-[13.5px] leading-relaxed text-stone-500">
          Pick as many as are true. Scroll around if the right word is elsewhere.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="-mx-5 min-h-0 flex-1 overflow-auto overscroll-contain px-5 py-1"
      >
        <div className="grid w-[150%] grid-cols-2 gap-3 sm:w-full">
          {QUADRANT_ORDER.map((id) => {
            const q = QUADRANTS[id];
            const isActive = id === activeQuadrant;
            return (
              <div
                key={id}
                ref={(el) => {
                  quadrantRefs.current[id] = el;
                }}
                className={`flex scroll-m-6 flex-col gap-2.5 rounded-2xl border p-3 transition-shadow duration-500 ${
                  isActive ? "shadow-[0_2px_14px_rgba(41,37,36,0.08)]" : ""
                }`}
                style={{
                  background: q.tint,
                  borderColor: isActive ? q.border : "transparent",
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: q.ink }}
                  >
                    {q.title}
                  </span>
                  <span
                    className="text-[10.5px] leading-snug opacity-70"
                    style={{ color: q.ink }}
                  >
                    {q.hint}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {q.emotions.map((emotion) => {
                    const on = selected.includes(emotion);
                    return (
                      <button
                        key={emotion}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onToggle(emotion)}
                        className="min-h-[34px] rounded-full border px-3 text-[12.5px] font-medium transition-transform duration-150 active:scale-95"
                        style={{
                          background: on ? q.tintActive : "rgba(255,255,255,0.72)",
                          borderColor: on ? q.ink : q.border,
                          color: q.ink,
                          fontWeight: on ? 700 : 500,
                        }}
                      >
                        {emotion}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-none items-center gap-3 pt-1">
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
          {selected.length
            ? `Continue with ${selected.length}`
            : "Pick at least one"}
        </motion.button>
      </div>
    </div>
  );
}
