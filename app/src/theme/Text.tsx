import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { tokens } from "./tokens.generated";

type Group = keyof typeof tokens.typography;
type VariantOf<G extends Group> = `${G}.${Extract<keyof (typeof tokens.typography)[G], string>}`;

/** Every text style in the token file, as "group.style" — e.g. "heading.h1". */
export type TextVariant = { [G in Group]: VariantOf<G> }[Group];

/** Named colours a piece of text can take, so screens never pass a hex. */
export type TextTone = "primary" | "secondary" | "tertiary" | "inverse";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /**
   * An explicit colour, for the one case tones cannot cover: text on a mood
   * surface, where the right value depends on the quadrant and comes from
   * `quadrantColors()`. Wins over `tone`.
   */
  color?: string;
}

/**
 * Text, always from a token.
 *
 * The reason this exists rather than screens reaching for RNText: a variant
 * carries its font family, size, line height, tracking and casing together.
 * Set them separately and it is far too easy to pair Lora's size with Nunito's
 * name, or to name a face that was never loaded — which React Native answers
 * by silently rendering the system font rather than raising anything.
 */
export function Text({
  variant = "body.default",
  tone = "primary",
  color,
  style,
  ...rest
}: TextProps) {
  const [group, name] = variant.split(".") as [Group, string];
  const base = (tokens.typography[group] as Record<string, TextStyle>)[name];
  return (
    <RNText
      style={[base, { color: color ?? tokens.color.semantic.text[tone] }, style]}
      {...rest}
    />
  );
}
