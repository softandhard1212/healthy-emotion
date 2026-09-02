import { useEffect, type ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { tokens } from "../theme";

/** The frame size every Figma screen is drawn at; bloom coordinates are in it. */
const DESIGN_WIDTH = 390;

/**
 * The four "Warm Glass bloom" ellipses, straight from the design frames.
 *
 * `x`, `y` and `size` are the layer's own box in design space. `from` and `to`
 * are the opacity it breathes between, and `dx`/`dy` how far it drifts — every
 * value read off the file rather than chosen. Each bloom has its own band and
 * its own direction, which is what stops the four reading as one pulsing mass.
 */
const BLOOMS = [
  { x: -86, y: -74, size: 260, color: tokens.color.primitives.mood["high-pleasant"].bg, from: 0.187, to: 0.269, dx: -5, dy: -7 },
  { x: 220, y: 62, size: 220, color: tokens.color.primitives.plum["300"], from: 0.156, to: 0.224, dx: 6, dy: 7 },
  { x: 120, y: 440, size: 280, color: tokens.color.primitives.mood["high-unpleasant"].bg, from: 0.195, to: 0.28, dx: -7, dy: 5 },
  { x: -120, y: 625, size: 240, color: tokens.color.primitives.mood["low-unpleasant"].bg, from: 0.218, to: 0.314, dx: 8, dy: -6 },
] as const;

/** One full breath is 8s in the file: 4s out, 4s back. */
const HALF_CYCLE_MS = 4000;

export interface ScreenBackgroundProps {
  children?: ReactNode;
  /**
   * Hold the blooms still. The design animates them on almost every screen but
   * deliberately not on the check-in ones — words palette, context, expanded
   * card — where the person is reading and choosing. Default follows the
   * common case; the check-in screens opt out.
   */
  still?: boolean;
}

export function ScreenBackground({ children, still = false }: ScreenBackgroundProps) {
  const { width } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;
  // Someone who has asked the system to reduce motion should not be given a
  // permanently moving background, whatever the design says.
  const reduceMotion = useReducedMotion();
  const frozen = still || reduceMotion;

  return (
    <View style={styles.root}>
      {BLOOMS.map((bloom, i) => (
        <Bloom key={i} bloom={bloom} scale={scale} frozen={frozen} />
      ))}
      {children}
    </View>
  );
}

/**
 * One bloom, as its own layer.
 *
 * Each is a plain View that happens to contain a gradient, rather than an
 * ellipse inside one shared SVG. That keeps the animation on the two
 * properties React Native can drive entirely on the UI thread — opacity and
 * transform — instead of animating SVG attributes across the bridge on every
 * frame, for four shapes, forever.
 */
function Bloom({
  bloom,
  scale,
  frozen,
}: {
  bloom: (typeof BLOOMS)[number];
  scale: number;
  frozen: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (frozen) {
      progress.value = 0;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: HALF_CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [frozen, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: bloom.from + (bloom.to - bloom.from) * progress.value,
    transform: [
      { translateX: bloom.dx * scale * progress.value },
      { translateY: bloom.dy * scale * progress.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bloom,
        {
          left: bloom.x * scale,
          top: bloom.y * scale,
          width: bloom.size * scale,
          height: bloom.size * scale,
        },
        animated,
      ]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={bloom.color} stopOpacity={1} />
            {/* A mid stop keeps the falloff gentle; a straight 1->0 ramp reads as a ring. */}
            <Stop offset="55%" stopColor={bloom.color} stopOpacity={0.45} />
            <Stop offset="100%" stopColor={bloom.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={50} r={50} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.semantic.bg.primary, overflow: "hidden" },
  bloom: { position: "absolute" },
});
