import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../components/ScreenBackground";
import { MoodBubble, BUBBLE_SIZE } from "../components/MoodBubble";
import { Button } from "../components/Button";
import { Text } from "../theme/Text";
import { quadrantColors, tokens } from "../theme";
import {
  QUADRANTS,
  QUADRANT_ORDER,
  emotionsIn,
  findEmotion,
  type QuadrantId,
} from "../lib/emotions";
import { listWords } from "../lib/format";

/** Three bubbles across per quadrant, matching the Figma field. */
const COLUMNS = 3;
const GUTTER = tokens.spacing["12"];
const QUADRANT_WIDTH = COLUMNS * BUBBLE_SIZE + (COLUMNS - 1) * GUTTER;

/**
 * Step 2 of the check-in: the whole vocabulary as one 2x2 field.
 *
 * Laid out as the circumplex itself — unpleasant left, pleasant right, high
 * energy up, low energy down — and pannable in both directions rather than
 * filtered to one corner. The filter was the tempting simplification and it is
 * wrong: "exhausted but also relieved" spans two quadrants, and a field that
 * only shows the corner you guessed cannot express it.
 *
 * The canvas is deliberately a little wider than the viewport so a band of the
 * neighbouring quadrant stays visible. That sliver is the only thing telling
 * someone the other three exist.
 */
export default function CheckIn() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [lastPicked, setLastPicked] = useState<string | null>(null);

  const detail = lastPicked ? findEmotion(lastPicked) : undefined;

  function toggle(word: string) {
    setSelected((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word],
    );
    setLastPicked((prev) => (prev === word && selected.includes(word) ? null : word));
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <StepDots active={1} />
          <Text variant="heading.h1">How would you describe it?</Text>
          <Text variant="body.italic" tone="secondary">
            It is ok to feel.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.canvas}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.column}>
            <View style={[styles.grid, { width: QUADRANT_WIDTH * 2 + GUTTER * 2 }]}>
              {QUADRANT_ORDER.map((id) => (
                <Quadrant key={id} id={id} selected={selected} onToggle={toggle} />
              ))}
            </View>
          </ScrollView>
        </ScrollView>

        <View style={styles.footer}>
          {detail ? (
            <View style={styles.definition}>
              <Text variant="body.small">
                <Text variant="body.small-bold">{detail.word}</Text>
                {" — "}
                {detail.definition}
              </Text>
            </View>
          ) : null}

          {selected.length > 0 ? (
            <Text variant="ui.caption" tone="secondary" numberOfLines={1}>
              {listWords(selected)}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button label="Back" variant="ghost" onPress={() => router.back()} />
            <Button
              label={selected.length ? `Continue with ${selected.length}` : "Pick at least one"}
              onPress={() => router.back()}
              disabled={selected.length === 0}
              style={styles.continue}
            />
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Quadrant({
  id,
  selected,
  onToggle,
}: {
  id: QuadrantId;
  selected: string[];
  onToggle: (word: string) => void;
}) {
  const { text } = quadrantColors(id);
  return (
    <View style={[styles.quadrant, { width: QUADRANT_WIDTH }]}>
      <Text variant="body.overline" color={text}>
        {QUADRANTS[id].title}
      </Text>
      <View style={styles.bubbles}>
        {emotionsIn(id).map((emotion) => (
          <MoodBubble
            key={emotion.word}
            emotion={emotion}
            selected={selected.includes(emotion.word)}
            onPress={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

function StepDots({ active }: { active: 0 | 1 | 2 }) {
  return (
    <View style={styles.dots} accessible={false}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: tokens.spacing["24"], paddingTop: tokens.spacing["8"], gap: tokens.spacing["6"] },
  dots: { flexDirection: "row", gap: tokens.spacing["4"], marginBottom: tokens.spacing["8"] },
  dot: {
    height: 4,
    width: 14,
    borderRadius: 2,
    backgroundColor: "rgba(53, 40, 64, 0.2)",
  },
  dotActive: { width: 26, backgroundColor: tokens.color.semantic.text.primary },
  canvas: { paddingHorizontal: tokens.spacing["24"] },
  column: { paddingVertical: tokens.spacing["16"] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GUTTER },
  quadrant: { gap: tokens.spacing["10"] },
  bubbles: { flexDirection: "row", flexWrap: "wrap", gap: GUTTER },
  footer: {
    paddingHorizontal: tokens.spacing["24"],
    paddingBottom: tokens.spacing["12"],
    gap: tokens.spacing["10"],
  },
  definition: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing["16"],
  },
  actions: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["12"] },
  continue: { flex: 1 },
});
