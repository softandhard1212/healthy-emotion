import { View } from "react-native";
import { Text } from "../theme/Text";
import { tokens } from "../theme";

/**
 * Overline plus title. The overline is `body.overline` — Lora Bold 11 with
 * wide tracking — and deliberately not `ui.overline`, which is Inter 10.5 for
 * generic UI labels. The two are easy to confuse and the spec calls it out.
 */
export function SectionHeader({ overline, title }: { overline?: string; title: string }) {
  return (
    <View style={{ gap: tokens.spacing["4"] }}>
      {overline ? (
        <Text variant="body.overline" tone="secondary">
          {overline}
        </Text>
      ) : null}
      <Text variant="heading.h2">{title}</Text>
    </View>
  );
}
