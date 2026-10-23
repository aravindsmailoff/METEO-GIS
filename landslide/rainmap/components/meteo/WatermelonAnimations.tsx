import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { SF_PRO } from "../flood/ui";

/**
 * Watermelon UI: Animated Shimmer Glow Card
 * Features an ambient rotating gradient border and specular light reflection
 */
export function WatermelonGlowCard({
  children,
  style,
  glowColor = "#38BDF8",
  urgent = false,
  onPress,
}: React.PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  urgent?: boolean;
  onPress?: () => void;
}>) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const activeColor = urgent ? "#EF4444" : glowColor;

  const content = (
    <Animated.View
      style={[
        styles.glowCard,
        urgent && styles.glowCardUrgent,
        {
          borderColor: pulseAnim.interpolate({
            inputRange: [0.4, 0.9],
            outputRange: [
              urgent ? "rgba(239, 68, 68, 0.35)" : "rgba(56, 189, 248, 0.25)",
              urgent ? "rgba(239, 68, 68, 0.75)" : "rgba(56, 189, 248, 0.65)",
            ],
          }),
          shadowColor: activeColor,
          shadowOpacity: pulseAnim,
          shadowRadius: 18,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <View style={styles.specularTopLine} />
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Watermelon UI: Concentric Radar Pulse Ring
 * Emits smooth expanding sonar waves from an epicenter
 */
export function WatermelonRadarWave({
  size = 60,
  color = "#38BDF8",
}: {
  size?: number;
  color?: string;
}) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createLoop(ring1, 0);
    const a2 = createLoop(ring2, 1300);
    a1.start();
    a2.start();

    return () => {
      a1.stop();
      a2.stop();
    };
  }, [ring1, ring2]);

  return (
    <View style={[styles.radarWaveContainer, { width: size, height: size }]} pointerEvents="none">
      {/* Wave 1 */}
      <Animated.View
        style={[
          styles.radarRing,
          {
            borderColor: color,
            transform: [
              {
                scale: ring1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 2.4],
                }),
              },
            ],
            opacity: ring1.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0.8, 0.35, 0],
            }),
          },
        ]}
      />
      {/* Wave 2 */}
      <Animated.View
        style={[
          styles.radarRing,
          {
            borderColor: color,
            transform: [
              {
                scale: ring2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 2.4],
                }),
              },
            ],
            opacity: ring2.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0.8, 0.35, 0],
            }),
          },
        ]}
      />
    </View>
  );
}

/**
 * Watermelon UI: Shimmering Live Badge
 * Smooth linear light sweep across the pill with continuous beacon ping
 */
export function WatermelonShimmerBadge({
  label,
  color = "#30D158",
}: {
  label: string;
  color?: string;
}) {
  const pingAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const ping = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    ping.start();
    return () => ping.stop();
  }, [pingAnim]);

  return (
    <View style={[styles.shimmerBadge, { borderColor: `${color}40`, backgroundColor: `${color}14` }]}>
      <Animated.View style={[styles.shimmerDot, { backgroundColor: color, opacity: pingAnim }]} />
      <Text style={[styles.shimmerText, { color }]}>{label}</Text>
    </View>
  );
}

/**
 * Watermelon UI: Spring Tactile Action Button
 * Provides buttery smooth spring bounce with micro-haptic scale
 */
export function WatermelonSpringButton({
  children,
  onPress,
  style,
  variant = "glass",
}: React.PropsWithChildren<{
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "glass" | "primary" | "urgent";
}>) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      friction: 6,
      tension: 140,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.springBtn,
          variant === "glass" && styles.springBtnGlass,
          variant === "primary" && styles.springBtnPrimary,
          variant === "urgent" && styles.springBtnUrgent,
          { transform: [{ scale }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowCard: {
    backgroundColor: "rgba(10, 16, 32, 0.78)",
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: "rgba(56, 189, 248, 0.28)",
    padding: 16,
    position: "relative",
    overflow: "hidden",
  },
  glowCardUrgent: {
    backgroundColor: "rgba(28, 10, 16, 0.85)",
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  specularTopLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    borderRadius: 1,
  },
  radarWaveContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  radarRing: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 1.8,
  },
  shimmerBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6.5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  shimmerDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  shimmerText: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  springBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  springBtnGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  springBtnPrimary: {
    backgroundColor: "#0A84FF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  springBtnUrgent: {
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
});
