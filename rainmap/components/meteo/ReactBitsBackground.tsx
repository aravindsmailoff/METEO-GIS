import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Platform, StyleSheet, View } from "react-native";

/**
 * ══════════════════════════════════════════════════════════════════
 * REACT BITS · AURORA & AMBIENT MESH BACKGROUND (2026 EDITION)
 * Inspired by React Bits (reactbits.dev) Aurora, Hyperspeed & Grid
 * Provides buttery smooth, GPU-accelerated atmospheric lighting
 * with glowing volumetric orbs and subtle tactical grid lines.
 * ══════════════════════════════════════════════════════════════════
 */
export function ReactBitsBackground() {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const driftAnim1 = useRef(new Animated.Value(0)).current;
  const driftAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth atmospheric loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim1, {
          toValue: 1,
          duration: 12000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(driftAnim1, {
          toValue: 0,
          duration: 12000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim2, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(driftAnim2, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    ).start();
  }, [pulseAnim, driftAnim1, driftAnim2]);

  const orb1TranslateY = driftAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  const orb2TranslateX = driftAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const orbOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.85],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* Deep Cosmos Base Layer */}
      <View style={styles.deepBase} />

      {/* React Bits Ambient Aurora Orbs */}
      <Animated.View
        style={[
          styles.auroraOrb,
          styles.auroraCyan,
          {
            opacity: orbOpacity,
            transform: [{ translateY: orb1TranslateY }, { scale: 1.1 }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.auroraOrb,
          styles.auroraIndigo,
          {
            opacity: orbOpacity,
            transform: [{ translateX: orb2TranslateX }],
          },
        ]}
      />

      <View style={[styles.auroraOrb, styles.auroraEmerald]} />

      {/* Tactical Radar Grid Layer (React Bits Grid) */}
      <View style={styles.gridOverlay} />

      {/* Vignette Overlay for Depth */}
      <View style={styles.vignetteOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: "hidden",
    backgroundColor: "#030712",
  },
  deepBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#030712",
  },
  auroraOrb: {
    position: "absolute",
    borderRadius: 999,
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(75px)",
          willChange: "transform, opacity",
        } as any)
      : {}),
  },
  auroraCyan: {
    top: "5%",
    right: "-15%",
    width: 320,
    height: 320,
    backgroundColor: "rgba(56, 189, 248, 0.22)",
  },
  auroraIndigo: {
    top: "40%",
    left: "-18%",
    width: 340,
    height: 340,
    backgroundColor: "rgba(99, 102, 241, 0.18)",
  },
  auroraEmerald: {
    bottom: "10%",
    right: "-10%",
    width: 280,
    height: 280,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        } as any)
      : {}),
  },
  vignetteOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(ellipse at center, transparent 30%, rgba(3, 7, 18, 0.6) 100%)",
        } as any)
      : {}),
  },
});
