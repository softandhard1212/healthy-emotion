import { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ScreenBackground } from "../../components/ScreenBackground";
import { MoodBubble, BUBBLE_SIZE } from "../../components/MoodBubble";
import { StepDots } from "../../components/StepDots";
import { Button } from "../../components/Button";
import { Text } from "../../theme/Text";
import { quadrantColors, tokens } from "../../theme";
import { QUADRANTS, QUADRANT_ORDER, emotionsIn, findEmotion, type QuadrantId } from "../../lib/emotions";
import { listWords } from "../../lib/format";
import { useCheckIn } from "../../lib/checkin";

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
 * The field opens on the quadrant from step 1, with its neighbours in frame.
 * The canvas is deliberately a little wider than the viewport so a band of the
 * next quadrant stays visible — that sliver is the only thing telling someone
 * the other three exist.
 */
export default function Words() {
  const router = useRouter();
  const { draft, update } = useCheckIn();
  const [lastPicked, setLastPicked] = useState<string | null>(null);
  const horizontal = useRef<ScrollView>(null);
  const vertical = useRef<ScrollView>(null);
  const quadrantHeight = useRef(0);

  const selected = draft.emotions;
  const detail = lastPicked ? findEmotion(lastPicked) : undefined;

  function toggle(word: string) {
    const on = selected.includes(word);
    update({ emotions: on ? selected.filter((w) => w !== word) : [...selected, word] });
    // Deselecting a word should not leave its definition on screen.
    setLastPicked(on && lastPicked === word ? null : word);
  }

  /** Once the first quadrant has laid out, jump to the one step 1 guessed. */
  function openOnGuess(height: number) {
    if (quadrantHeight.current || !draft.guess) return;
    quadrantHeight.current = height;
    const pleasant = draft.guess.endsWith("Pleasant");
    const low = draft.guess.startsWith("low");
    horizontal.current?.scrollTo({ x: pleasant ? QUADRANT_WIDTH + GUTTER : 0, animated: false });
    vertical.current?.scrollTo({ y: low ? height + GUTTER : 0, animated: false });
  }

  // `still`: the design animates the blooms on nearly every screen, but not on
  // the check-in ones, where someone is reading and choosing.
  return (
    <ScreenBackground still>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <StepDots active={1} />
          <Text variant="heading.h1">How would you describe it?</Text>
          <Text variant="body.italic" tone="secondary">
            It is ok to feel.
          </Text>
        </View>

        <ScrollView ref={horizontal} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.canvas}>
          <ScrollView ref={vertical} showsVerticalScrollIndicator={false} contentContainerStyle={styles.column}>
            <View style={[styles.grid, { width: QUADRANT_WIDTH * 2 + GUTTER * 2 }]}>
              {QUADRANT_ORDER.map((id, i) => (
                <Quadrant
                  key={id}
                  id={id}
                  selected={selected}
                  onToggle={toggle}
                  onLayout={i === 0 ? openOnGuess : undefined}
                />
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
              label={selected.length ? "Continue" : "Pick at least one"}
              onPress={() => router.push("/check-in/context")}
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
  onLayout,
}: {
  id: QuadrantId;
  selected: string[];
  onToggle: (word: string) => void;
  onLayout?: (height: number) => void;
}) {
  const { text } = quadrantColors(id);
  return (
    <View
      style={[styles.quadrant, { width: QUADRANT_WIDTH }]}
      onLayout={onLayout ? (e) => onLayout(e.nativeEvent.layout.height) : undefined}
    >
      <Text variant="body.overline" color={text}>
        {QUADRANTS[id].title}
      </Text>
      <View style={styles.bubbles}>
        {emotionsIn(id).map((emotion) => (
          <MoodBubble key={emotion.word} emotion={emotion} selected={selected.includes(emotion.word)} onPress={onToggle} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: tokens.spacing["24"], paddingTop: tokens.spacing["8"], gap: tokens.spacing["6"] },
  canvas: { paddingHorizontal: tokens.spacing["24"] },
  column: { paddingVertical: tokens.spacing["16"] },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GUTTER },
  quadrant: { gap: tokens.spacing["10"] },
  bubbles: { flexDirection: "row", flexWrap: "wrap", gap: GUTTER },
  footer: { paddingHorizontal: tokens.spacing["24"], paddingBottom: tokens.spacing["12"], gap: tokens.spacing["10"] },
  definition: { backgroundColor: "rgba(255, 255, 255, 0.65)", borderRadius: tokens.radius.lg, padding: tokens.spacing["16"] },
  actions: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["12"] },
  continue: { flex: 1 },
});
