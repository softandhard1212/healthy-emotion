import {
  Activity as ActivityIcon,
  Bed,
  Clock,
  BookOpen,
  Heart,
  Home,
  Laptop,
  Moon,
  Newspaper,
  Trees,
  Users,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ACTIVITIES,
  QUADRANTS,
  describePoint,
  type MoodPoint,
  type QuadrantId,
} from "../../lib/emotions";

const ICONS: Record<string, LucideIcon> = {
  Laptop, Users, Bed, Heart, Home, Wallet,
  BookOpen, Activity: ActivityIcon, Utensils, Moon, Trees, Newspaper,
};

interface Props {
  point: MoodPoint;
  quadrant: QuadrantId;
  emotions: string[];
  activities: string[];
  note: string;
  onToggleActivity: (id: string) => void;
  onNoteChange: (note: string) => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
}

/**
 * Step 3 — what it's attached to, and anything they want to say.
 *
 * Both fields are optional on purpose: the check-in is already useful with
 * just a point and some words, and a required note is exactly the friction
 * that stops someone logging on the day they most need to.
 */
function listWords(words: string[]): string {
  if (words.length <= 1) return words[0] ?? "";
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export default function ContextStep({
  point,
  quadrant,
  emotions,
  activities,
  note,
  onToggleActivity,
  onNoteChange,
  onBack,
  onSave,
  saving,
}: Props) {
  const q = QUADRANTS[quadrant];
  const loggedAt = new Date().toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-col items-center gap-1 pb-1 text-center">
        <span className="text-[13px] text-stone-500">I&rsquo;m feeling</span>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="text-[30px] leading-[1.15] font-medium tracking-tight"
          style={{ color: q.ink }}
        >
          {listWords(emotions.map((e) => e.toLowerCase()))}
        </motion.h1>
        <span className="flex items-center gap-1.5 text-[12px] text-stone-400">
          <Clock size={12} strokeWidth={1.8} />
          {loggedAt}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <div className="flex flex-col gap-5">
          <div
            className="flex items-center justify-center rounded-2xl border px-4 py-2.5 text-center"
            style={{ background: q.tint + "33", borderColor: q.border }}
          >
            <span className="text-[12.5px]" style={{ color: q.ink }}>
              {describePoint(point)}
            </span>
          </div>

          <section className="flex flex-col gap-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              Anything to do with
            </span>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITIES.map((activity) => {
                const Icon = ICONS[activity.icon] ?? ActivityIcon;
                const on = activities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleActivity(activity.id)}
                    className={`flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-2xl border text-[12px] transition-transform duration-150 active:scale-95 ${
                      on
                        ? "border-teal-700 bg-teal-700/10 font-semibold text-teal-800"
                        : "border-stone-200 bg-white font-medium text-stone-600"
                    }`}
                  >
                    <Icon
                      size={19}
                      strokeWidth={1.7}
                      className={on ? "text-teal-700" : "text-stone-400"}
                    />
                    {activity.label}
                  </button>
                );
              })}
            </div>
          </section>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              Note
            </span>
            <textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a quick note..."
              rows={3}
              className="w-full resize-none rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[14.5px] leading-relaxed text-stone-700 placeholder:text-stone-400 focus:border-teal-700 focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-none items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          disabled={saving}
          className="min-h-[48px] rounded-full px-4 text-[14px] font-medium text-stone-500"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-[48px] flex-1 rounded-full bg-teal-700 px-5 text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save entry"}
        </button>
      </div>
    </div>
  );
}
