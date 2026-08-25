import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { quadrantFor, type MoodPoint } from "../../lib/emotions";

interface Props {
  /** Called once the person commits a point, with coordinates in -10..+10. */
  onPick: (point: MoodPoint) => void;
}

/** How long the dot sits under the finger before the flow moves on. */
const SETTLE_MS = 620;

/**
 * Step 1 — put a point on the circumplex.
 *
 * Naming a feeling cold is the hardest part of any mood check-in, so this asks
 * for something easier: roughly how pleasant it is, and roughly how much
 * energy is behind it. The quadrant that falls out of those two answers is
 * what opens the word list in Step 2.
 */
export default function CircumplexGrid({ onPick }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<MoodPoint | null>(null);
  const committed = useRef(false);

  function readPoint(e: ReactPointerEvent<HTMLDivElement>): MoodPoint | null {
    const pad = padRef.current;
    if (!pad) return null;
    const rect = pad.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-10, Math.min(10, v));
    // Screen y grows downward; energy grows upward, so the sign flips.
    return {
      x: clamp(Number((((e.clientX - rect.left) / rect.width) * 20 - 10).toFixed(1))),
      y: clamp(Number((10 - ((e.clientY - rect.top) / rect.height) * 20).toFixed(1))),
    };
  }

  function handleDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (committed.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPoint(readPoint(e));
  }

  function handleMove(e: ReactPointerEvent<HTMLDivElement>) {
    // Only track while the finger is down — a hover shouldn't move the dot.
    if (committed.current || e.buttons === 0) return;
    setPoint(readPoint(e));
  }

  function handleUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (committed.current) return;
    const picked = readPoint(e) ?? point;
    if (!picked) return;
    committed.current = true;
    setPoint(picked);
    // A beat of stillness so the dot registers as "this is what I chose"
    // before the screen changes under them.
    window.setTimeout(() => onPick(picked), SETTLE_MS);
  }

  const quadrant = point ? quadrantFor(point) : null;

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 pb-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] leading-tight font-medium tracking-tight text-stone-800">
          Where are you right now?
        </h1>
        <p className="text-[13.5px] leading-relaxed text-stone-500">
          Touch anywhere on the square. No need to get it exactly right.
        </p>
      </header>

      <div className="flex items-stretch gap-2.5">
        <div className="flex flex-col items-center justify-between py-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          <span>High</span>
          <span className="[writing-mode:vertical-rl] rotate-180 tracking-[0.2em] text-stone-400/80">
            Energy
          </span>
          <span>Low</span>
        </div>

        <div className="flex flex-1 flex-col gap-2.5">
          <div
            ref={padRef}
            role="application"
            aria-label="Mood and energy grid"
            onPointerDown={handleDown}
            onPointerMove={handleMove}
            onPointerUp={handleUp}
            className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04)]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 78% 22%, #fdf0d8 0%, transparent 58%)," +
                "radial-gradient(circle at 78% 78%, #dff0e8 0%, transparent 58%)," +
                "radial-gradient(circle at 22% 22%, #fbe3de 0%, transparent 58%)," +
                "radial-gradient(circle at 22% 78%, #e3e5f5 0%, transparent 58%)",
            }}
          >
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-stone-300/60" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-stone-300/60" />

            <QuadrantLabel className="left-3 top-3" emoji="⚡" text="Wound up" />
            <QuadrantLabel className="right-3 top-3 text-right" emoji="✨" text="Lit up" />
            <QuadrantLabel className="bottom-3 left-3" emoji="🌧" text="Weighed down" />
            <QuadrantLabel className="bottom-3 right-3 text-right" emoji="🌿" text="Settled" />

            {point && (
              <motion.div
                className="pointer-events-none absolute z-10"
                initial={false}
                animate={{
                  left: `${((point.x + 10) / 20) * 100}%`,
                  top: `${((10 - point.y) / 20) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                style={{ translateX: "-50%", translateY: "-50%" }}
              >
                <span className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-600/15 blur-[6px]" />
                <motion.span
                  className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-teal-700/30"
                  animate={{ scale: [1, 1.5], opacity: [0.55, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
                <span className="relative block h-4 w-4 rounded-full bg-teal-700 ring-4 ring-white/80" />
              </motion.div>
            )}
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            <span>Unpleasant</span>
            <span className="tracking-[0.2em] text-stone-400/80">Mood</span>
            <span>Pleasant</span>
          </div>
        </div>
      </div>

      <p
        aria-live="polite"
        className="min-h-[20px] text-center text-[13px] font-medium text-stone-500"
      >
        {quadrant ? "Got it — finding the words…" : " "}
      </p>
    </div>
  );
}

function QuadrantLabel({
  className,
  emoji,
  text,
}: {
  className: string;
  emoji: string;
  text: string;
}) {
  return (
    <div className={`pointer-events-none absolute ${className}`}>
      <span className="block text-[13px] leading-none opacity-60">{emoji}</span>
      <span className="mt-1 block text-[10.5px] font-semibold uppercase tracking-wider text-stone-400">
        {text}
      </span>
    </div>
  );
}
