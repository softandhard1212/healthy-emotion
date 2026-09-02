import { Pressable, StyleSheet, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "../theme/Text";
import { quadrantColors, quadrantForPoint, tokens } from "../theme";
import type { JournalEntry } from "../lib/journal";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export interface MonthCalendarProps {
  month: Date;
  entries: JournalEntry[];
  selected: Date | null;
  onSelect: (day: Date) => void;
  onMonthChange: (month: Date) => void;
  /** Show only the week containing `selected`, as the collapsed `14` frame does. */
  compact?: boolean;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * A month of check-ins. Each day carries up to three dots, one per entry,
 * coloured by the quadrant the entry landed in — so a bad week reads as a
 * row of coral before a single word is read.
 */
export function MonthCalendar({ month, entries, selected, onSelect, onMonthChange, compact }: MonthCalendarProps) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const shown = compact && selected ? weeks.filter((w) => w.some((d) => d && sameDay(d, selected))) : weeks;
  const today = new Date();
  const title = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Pressable onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={12} accessibilityLabel="Previous month">
          <ChevronLeft size={18} color={tokens.color.semantic.text.primary} />
        </Pressable>
        <Text variant="heading.h4">{title}</Text>
        <Pressable onPress={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={12} accessibilityLabel="Next month">
          <ChevronRight size={18} color={tokens.color.semantic.text.primary} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {DAYS.map((d, i) => (
          <Text key={i} variant="ui.caption" tone="tertiary" style={styles.cell}>
            {d}
          </Text>
        ))}
      </View>
      {shown.map((week, wi) => (
        <View key={wi} style={styles.row}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;
            const dots = entries
              .filter((e) => sameDay(new Date(e.created_at), day) && e.point_x != null && e.point_y != null)
              .slice(0, 3);
            const isSel = selected ? sameDay(day, selected) : false;
            return (
              <Pressable key={di} onPress={() => onSelect(day)} style={[styles.cell, styles.day, isSel && styles.selected]} accessibilityRole="button">
                <Text variant={sameDay(day, today) ? "ui.label-default" : "ui.label-small"}>{day.getDate()}</Text>
                <View style={styles.dots}>
                  {dots.map((e) => (
                    <View key={e.id} style={[styles.dot, { backgroundColor: quadrantColors(quadrantForPoint(e.point_x!, e.point_y!)).bg }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: tokens.spacing["6"] },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: tokens.spacing["16"], marginBottom: tokens.spacing["6"] },
  row: { flexDirection: "row" },
  cell: { flex: 1, alignItems: "center", textAlign: "center" },
  day: { paddingVertical: tokens.spacing["6"], borderRadius: tokens.radius.md, gap: 3, minHeight: 40 },
  selected: { backgroundColor: "rgba(255, 255, 255, 0.6)" },
  dots: { flexDirection: "row", gap: 2, height: 5 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
