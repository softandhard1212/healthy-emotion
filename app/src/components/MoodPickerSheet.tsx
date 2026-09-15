import { BlurView } from "expo-blur";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../theme/Text";
import { tokens } from "../theme";
import {
  EMOTIONS,
  QUADRANTS,
  QUADRANT_ORDER,
  quadrantFor,
  type Emotion,
  type QuadrantId,
} from "../lib/emotions";

interface MoodPickerSheetProps {
  visible: boolean;
  selectedWords: string[];
  onToggle: (word: string) => void;
  onCancel: () => void;
  onDone: () => void;
}

const MOOD_COLORS: Record<QuadrantId, { main: string; light: string; border: string }> = {
  highUnpleasant: { main: "#D86A58", light: "rgba(216, 106, 88, 0.18)", border: "rgba(216, 106, 88, 0.35)" },
  highPleasant: { main: "#C97836", light: "rgba(201, 120, 54, 0.18)", border: "rgba(201, 120, 54, 0.35)" },
  lowUnpleasant: { main: "#5B75B5", light: "rgba(91, 117, 181, 0.18)", border: "rgba(91, 117, 181, 0.35)" },
  lowPleasant: { main: "#3E8F7E", light: "rgba(62, 143, 126, 0.18)", border: "rgba(62, 143, 126, 0.35)" },
};

function MoodChip({
  emotion,
  selected,
  onPress,
}: {
  emotion: Emotion;
  selected: boolean;
  onPress: (word: string) => void;
}) {
  const quadrant = quadrantFor(emotion);
  const palette = MOOD_COLORS[quadrant];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={emotion.word}
      onPress={() => onPress(emotion.word)}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? palette.main : palette.border,
          backgroundColor: selected ? palette.light : "rgba(255, 255, 255, 0.7)",
        },
        pressed && styles.pressed,
      ]}
    >
      <Text variant="ui.label-small" color={palette.main}>
        {emotion.word}
      </Text>
    </Pressable>
  );
}

function SelectedChip({ emotion, onRemove }: { emotion: Emotion; onRemove: (word: string) => void }) {
  const palette = MOOD_COLORS[quadrantFor(emotion)];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Remove ${emotion.word}`}
      onPress={() => onRemove(emotion.word)}
      style={({ pressed }) => [
        styles.selectedChip,
        { borderColor: palette.border, backgroundColor: palette.light },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.selectedDot, { backgroundColor: palette.main }]} />
      <Text variant="ui.label-small" color={palette.main}>
        {emotion.word}
      </Text>
      <Text variant="ui.label-small" color={palette.main} accessibilityElementsHidden>
        ×
      </Text>
    </Pressable>
  );
}

function MoodGroup({
  id,
  selectedWords,
  onToggle,
}: {
  id: QuadrantId;
  selectedWords: string[];
  onToggle: (word: string) => void;
}) {
  const palette = MOOD_COLORS[id];
  const emotions = EMOTIONS.filter((emotion) => quadrantFor(emotion) === id);

  return (
    <View style={styles.group}>
      <View style={styles.groupHeading}>
        <View style={[styles.groupDot, { backgroundColor: palette.main }]} />
        <Text variant="ui.overline" color="rgba(74, 60, 50, 0.60)">
          {QUADRANTS[id].title}
        </Text>
      </View>
      <View style={styles.chipGrid}>
        {emotions.map((emotion) => (
          <MoodChip
            key={emotion.word}
            emotion={emotion}
            selected={selectedWords.includes(emotion.word)}
            onPress={onToggle}
          />
        ))}
      </View>
    </View>
  );
}

/** The Figma mood vocabulary, presented as a modal sheet over Talk. */
export function MoodPickerSheet({
  visible,
  selectedWords,
  onToggle,
  onCancel,
  onDone,
}: MoodPickerSheetProps) {
  const selected = selectedWords
    .map((word) => EMOTIONS.find((emotion) => emotion.word === word))
    .filter((emotion): emotion is Emotion => Boolean(emotion));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close mood picker"
          onPress={onCancel}
          style={styles.backdrop}
        />
        <BlurView accessibilityViewIsModal intensity={45} tint="light" style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text variant="body.large-bold">I am feeling</Text>
            <Text variant="body.small" tone="secondary">
              it is ok to feel.
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {selected.length > 0 ? (
              <View style={styles.selectedSection}>
                <Text variant="ui.overline" tone="secondary">
                  Selected
                </Text>
                <View style={styles.chipGrid}>
                  {selected.map((emotion) => (
                    <SelectedChip key={emotion.word} emotion={emotion} onRemove={onToggle} />
                  ))}
                </View>
              </View>
            ) : null}

            {QUADRANT_ORDER.map((id) => (
              <MoodGroup key={id} id={id} selectedWords={selectedWords} onToggle={onToggle} />
            ))}
          </ScrollView>

          <View style={styles.doneWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use selected moods"
              disabled={selectedWords.length === 0}
              onPress={onDone}
              style={({ pressed }) => [
                styles.done,
                selectedWords.length === 0 && styles.doneDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text variant="ui.button" tone="inverse">
                done
              </Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(199, 204, 225, 0.28)",
  },
  sheet: {
    height: "82.2%",
    maxHeight: 694,
    minHeight: 560,
    overflow: "hidden",
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    backgroundColor: "rgba(250, 247, 240, 0.9)",
    paddingTop: tokens.spacing["12"],
    paddingHorizontal: tokens.spacing["20"],
    shadowColor: tokens.color.semantic.text.primary,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -10 },
    elevation: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(114, 95, 117, 0.24)",
  },
  header: { marginTop: tokens.spacing["20"], gap: tokens.spacing["4"] },
  scroll: { flex: 1, marginTop: tokens.spacing["16"] },
  scrollContent: { gap: tokens.spacing["20"], paddingBottom: tokens.spacing["8"] },
  selectedSection: { gap: tokens.spacing["8"] },
  group: { gap: tokens.spacing["10"] },
  groupHeading: { flexDirection: "row", alignItems: "center", gap: tokens.spacing["6"] },
  groupDot: { width: 7, height: 7, borderRadius: 4 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing["6"] },
  chip: {
    minHeight: 32,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    paddingVertical: tokens.spacing["6"],
    paddingHorizontal: tokens.spacing["12"],
  },
  selectedChip: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing["6"],
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    paddingVertical: tokens.spacing["6"],
    paddingHorizontal: tokens.spacing["10"],
  },
  selectedDot: { width: 6, height: 6, borderRadius: 3 },
  doneWrap: { paddingTop: tokens.spacing["12"], paddingBottom: tokens.spacing["20"] },
  done: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.radius.full,
    backgroundColor: tokens.color.primitives.neutral.dark,
  },
  doneDisabled: { opacity: 0.35 },
  pressed: { opacity: 0.72 },
});
