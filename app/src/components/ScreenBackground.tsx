import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from "react-native-svg";
import { tokens } from "../theme";

/**
 * The "Warm Glass" ground the design puts under most screens: cream, with
 * four soft colour blooms drifting in from the corners.
 *
 * Drawn as SVG radial gradients rather than blurred shapes. In Figma these are
 * large ellipses sitting under a softening overlay, and the obvious port is a
 * blur — but a real blur pass over a full-screen layer is the most expensive
 * thing this app could ask a mid-range Android for, and it would be redrawn on
 * every screen. A radial gradient fading to full transparency is the same
 * image by construction: soft-edged because it never has an edge.
 *
 * The bloom positions and sizes are lifted from the Figma frames, where they
 * sit at the same four offsets on every screen.
 */
const BLOOMS = [
  { cx: 44, cy: 56, r: 130, color: tokens.color.primitives.mood["high-pleasant"].bg },
  { cx: 330, cy: 172, r: 110, color: tokens.color.primitives.plum["300"] },
  { cx: 260, cy: 580, r: 140, color: tokens.color.primitives.mood["high-unpleasant"].bg },
  { cx: 0, cy: 745, r: 120, color: tokens.color.primitives.mood["low-unpleasant"].bg },
] as const;

/** Peak alpha of a bloom at its centre. High enough to tint, low enough to read over. */
const BLOOM_ALPHA = 0.38;

export function ScreenBackground({ children }: { children?: ReactNode }) {
  return (
    <View style={styles.root}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        <Defs>
          {BLOOMS.map((b, i) => (
            <RadialGradient key={i} id={`bloom${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={b.color} stopOpacity={BLOOM_ALPHA} />
              {/* A mid stop keeps the falloff gentle; a straight 0->1 ramp reads as a ring. */}
              <Stop offset="55%" stopColor={b.color} stopOpacity={BLOOM_ALPHA * 0.45} />
              <Stop offset="100%" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x={0} y={0} width={390} height={844} fill={tokens.color.semantic.bg.primary} />
        {BLOOMS.map((b, i) => (
          <Ellipse key={i} cx={b.cx} cy={b.cy} rx={b.r} ry={b.r} fill={`url(#bloom${i})`} />
        ))}
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.semantic.bg.primary },
});
