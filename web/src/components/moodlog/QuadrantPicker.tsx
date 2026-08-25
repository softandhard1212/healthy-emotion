import { motion } from "framer-motion";
import { QUADRANTS, QUADRANT_ORDER, type QuadrantId } from "../../lib/emotions";

interface Props {
  onPick: (quadrant: QuadrantId) => void;
}

/** Which corner of the circumplex each quadrant occupies, as it's drawn. */
const CORNER: Record<QuadrantId, string> = {
  highUnpleasant: "⚡",
  highPleasant: "✨",
  lowUnpleasant: "🌧",
  lowPleasant: "🌿",
};

/**
 * Step 1 — which of the four does it feel closest to?
 *
 * Two questions in one tap: is it pleasant, and is there energy behind it.
 * Both are answerable without vocabulary, which is the point — naming the
 * feeling is the hard part, and it comes next, once the field has narrowed.
 * The exact coordinates aren't asked for here; they come from the words
 * picked in step 2, which sit at known places on the circumplex.
 */
export default function QuadrantPicker({ onPick }: Props) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-7 pb-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] leading-tight font-medium tracking-tight text-stone-800">
          Which of these is closest?
        </h1>
        <p className="text-[13.5px] leading-relaxed text-stone-500">
          Rough is fine. You'll find the exact word next.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3.5">
        {QUADRANT_ORDER.map((id, i) => {
          const q = QUADRANTS[id];
          return (
            <motion.button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.28, ease: "easeOut" }}
              whileTap={{ scale: 0.96 }}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-full border px-5 text-center"
              style={{ background: q.tint, borderColor: q.border }}
            >
              <span className="text-[15px] leading-none opacity-70">
                {CORNER[id]}
              </span>
              <span
                className="text-[14px] font-bold leading-[1.15]"
                style={{ color: q.ink }}
              >
                {q.title.split(", ")[0]}
                <br />
                {q.title.split(", ")[1]}
              </span>
              <span
                className="text-[10.5px] leading-snug opacity-70"
                style={{ color: q.ink }}
              >
                {q.hint}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-[12px] text-stone-400">
        Energy runs top to bottom, mood left to right.
      </p>
    </div>
  );
}
