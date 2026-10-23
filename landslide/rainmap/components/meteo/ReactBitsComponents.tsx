import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";

// ─────────────────────────────────────────────────────────────────────────────
// 1. REACT BITS · SHINY TEXT
// Metallic light shimmer that scans across letters continuously
// ─────────────────────────────────────────────────────────────────────────────
interface ShinyTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  shimmerColor?: string;
  baseColor?: string;
  speedMs?: number;
}

export function ReactBitsShinyText({
  text,
  style,
  shimmerColor = "#38BDF8",
  baseColor = "#94A3B8",
  speedMs = 2800,
}: ShinyTextProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: speedMs,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim, speedMs]);

  const textColor = shimmerAnim.interpolate({
    inputRange: [0, 0.35, 0.5, 0.65, 1],
    outputRange: [baseColor, baseColor, shimmerColor, baseColor, baseColor],
  });

  return (
    <Animated.Text style={[styles.shinyTextBase, style, { color: textColor }]}>
      {text}
    </Animated.Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. REACT BITS · BORDER BEAM
// Laser line tracing smoothly along the perimeter of the active alert card
// ─────────────────────────────────────────────────────────────────────────────
interface BorderBeamProps {
  color?: string;
  size?: number;
  durationMs?: number;
}

export function ReactBitsBorderBeam({
  color = "#38BDF8",
  size = 60,
  durationMs = 3500,
}: BorderBeamProps) {
  const beamAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(beamAnim, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [beamAnim, durationMs]);

  const beamLeft = beamAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["0%", "85%", "0%"],
  });

  const beamOpacity = beamAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.3, 1, 0.3, 1, 0.3],
  });

  return (
    <View pointerEvents="none" style={styles.borderBeamContainer}>
      <Animated.View
        style={[
          styles.beamLine,
          {
            width: size,
            left: beamLeft,
            backgroundColor: color,
            shadowColor: color,
            shadowOpacity: beamOpacity,
            shadowRadius: 10,
            opacity: beamOpacity,
          },
        ]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REACT BITS · SPOTLIGHT CARD
// Interactive glassmorphic card with dynamic touch illumination and 3D spring
// ─────────────────────────────────────────────────────────────────────────────
interface SpotlightCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  spotlightColor?: string;
  borderColor?: string;
  urgent?: boolean;
  onPress?: () => void;
}

export function ReactBitsSpotlightCard({
  children,
  style,
  spotlightColor = "rgba(56, 189, 248, 0.18)",
  borderColor = "rgba(255, 255, 255, 0.12)",
  urgent = false,
  onPress,
}: SpotlightCardProps) {
  const [touchPos, setTouchPos] = useState({ x: 120, y: 40 });
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    setTouchPos({ x: locationX, y: locationY });
  };

  const handlePressIn = () => {
    setIsHovered(true);
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      friction: 8,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsHovered(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const activeBorder = urgent ? "rgba(239, 68, 68, 0.45)" : borderColor;
  const activeSpotlight = urgent ? "rgba(239, 68, 68, 0.22)" : spotlightColor;

  return (
    <Animated.View
      style={[
        styles.spotlightCard,
        {
          borderColor: activeBorder,
          transform: [{ scale: scaleAnim }],
        },
        urgent && styles.spotlightCardUrgent,
        style,
      ]}
    >
      {/* Specular Radial Spotlight Glow */}
      <View
        pointerEvents="none"
        style={[
          styles.spotlightGlow,
          {
            left: touchPos.x - 75,
            top: touchPos.y - 75,
            backgroundColor: activeSpotlight,
            opacity: isHovered ? 0.9 : 0.45,
          },
        ]}
      />

      {/* Top Glass Specular Line */}
      <View style={styles.topGlassLine} />

      {/* Card Content with Touch Tracking */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onTouchMove={handleTouch}
        style={styles.spotlightContent}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REACT BITS · DECRYPTED TEXT
// Cybernetic tactical text unscrambler that rapidly resolves into real letters
// ─────────────────────────────────────────────────────────────────────────────
interface DecryptedTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  speedMs?: number;
  characters?: string;
}

export function ReactBitsDecryptedText({
  text,
  style,
  speedMs = 35,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$@%&",
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            if (letter === " " || letter === "·" || letter === "-") return letter;
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, speedMs);

    return () => clearInterval(interval);
  }, [text, speedMs, characters]);

  return <Text style={[styles.decryptedTextBase, style]}>{displayText}</Text>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. REACT BITS · ANIMATED COUNTER
// Smoothly updates numerical readouts (Rainfall mm, Wind km/h, Alert counts)
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  style?: StyleProp<TextStyle>;
  color?: string;
}

export function ReactBitsAnimatedCounter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  style,
  color = "#F8FAFC",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startVal = displayValue;
    const endVal = value;
    const diff = endVal - startVal;
    if (Math.abs(diff) < 0.01) {
      setDisplayValue(endVal);
      return;
    }

    const steps = 15;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const current = startVal + (diff * step) / steps;
      setDisplayValue(current);
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(endVal);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [value]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <Text style={[styles.counterText, style, { color }]}>
      {prefix}
      {formatted}
      {suffix}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. REACT BITS · PULSE STATUS PILL
// Live radar ping pill with concentric acoustic waves
// ─────────────────────────────────────────────────────────────────────────────
interface PulsePillProps {
  label: string;
  color?: string;
  count?: number;
  onPress?: () => void;
}

export function ReactBitsPulsePill({
  label,
  color = "#10B981",
  count,
  onPress,
}: PulsePillProps) {
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [waveAnim]);

  const waveScale = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const waveOpacity = waveAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.75, 0.2, 0],
  });

  return (
    <Pressable onPress={onPress} style={[styles.pulsePill, { borderColor: `${color}40` }]}>
      <View style={styles.dotContainer}>
        <Animated.View
          style={[
            styles.waveCircle,
            {
              backgroundColor: color,
              transform: [{ scale: waveScale }],
              opacity: waveOpacity,
            },
          ]}
        />
        <View style={[styles.solidDot, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.pulseLabel, { color }]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.countBadge, { backgroundColor: `${color}25` }]}>
          <Text style={[styles.countText, { color }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REACT BITS · AURORA GLOW BACKDROP
// Subtle chromatic aurora orbs that drift slowly in the background
// ─────────────────────────────────────────────────────────────────────────────
export function ReactBitsAuroraGlow() {
  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [driftAnim]);

  const translateX1 = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 40],
  });
  const translateY1 = driftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 30],
  });

  return (
    <View pointerEvents="none" style={styles.auroraContainer}>
      <Animated.View
        style={[
          styles.auroraOrb1,
          {
            transform: [{ translateX: translateX1 }, { translateY: translateY1 }],
          },
        ]}
      />
      <View style={styles.auroraOrb2} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shinyTextBase: {
    fontFamily: SF_PRO,
    fontWeight: "700",
  },
  borderBeamContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    overflow: "hidden",
    zIndex: 10,
  },
  beamLine: {
    height: 2,
    borderRadius: 2,
  },
  spotlightCard: {
    backgroundColor: "rgba(11, 23, 38, 0.88)",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  spotlightCardUrgent: {
    backgroundColor: "rgba(30, 12, 14, 0.92)",
    borderColor: "rgba(239, 68, 68, 0.45)",
  },
  spotlightGlow: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  topGlassLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    zIndex: 2,
  },
  spotlightContent: {
    padding: 14,
    zIndex: 3,
  },
  decryptedTextBase: {
    fontFamily: SF_PRO,
    letterSpacing: 0.3,
  },
  counterText: {
    fontFamily: SF_PRO,
    fontWeight: "800",
  },
  pulsePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 18, 30, 0.85)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 7,
  },
  dotContainer: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  waveCircle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  solidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseLabel: {
    fontFamily: SF_PRO,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontFamily: SF_PRO,
    fontSize: 10,
    fontWeight: "800",
  },
  auroraContainer: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
  auroraOrb1: {
    position: "absolute",
    top: -50,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(10, 132, 255, 0.12)",
  },
  auroraOrb2: {
    position: "absolute",
    bottom: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
});
