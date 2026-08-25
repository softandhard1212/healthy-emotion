import {
  Activity as ActivityIcon,
  Bed,
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-[26px] leading-tight font-medium tracking-tight text-stone-800">
          What's it attached to?
        </h1>
        <p className="text-[13.5px] leading-relaxed text-stone-500">
          Skip either part if nothing fits.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
        <div className="flex flex-col gap-5">
          <div
            className="flex flex-col gap-2.5 rounded-2xl border p-4"
            style={{ background: q.tint, borderColor: q.border }}
          >
            <span
              className="text-[10.5px] font-bold uppercase tracking-widest opacity-75"
              style={{ color: q.ink }}
            >
              You said
            </span>
            <div className="flex flex-wrap gap-1.5">
              {emotions.map((emotion) => (
                <span
                  key={emotion}
                  className="rounded-full border px-3 py-1 text-[12.5px] font-semibold"
                  style={{
                    background: q.tintActive,
                    borderColor: q.ink,
                    color: q.ink,
                  }}
                >
                  {emotion}
                </span>
              ))}
            </div>
            <span className="text-[12px] opacity-70" style={{ color: q.ink }}>
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
