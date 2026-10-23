import React from "react";
import { StyleSheet, View, Pressable, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AceternityCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  className?: string;
  glowColor?: string;
  onPress?: () => void;
}

export function AceternityCard({
  children,
  style,
  glowColor = "rgba(56, 189, 248, 0.15)",
  onPress,
}: AceternityCardProps) {
  const CardContainer = onPress ? Pressable : View;

  return (
    <CardContainer
      onPress={onPress}
      style={[styles.container, style]}
    >
      {/* Specular Ambient Glow Gradient */}
      <LinearGradient
        colors={[glowColor, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientGlow}
        pointerEvents="none"
      />

      {/* Hairline Glass Specular Rim */}
      <View style={styles.hairlineRim} pointerEvents="none" />

      {/* Card Content */}
      <View style={styles.content}>{children}</View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(22, 22, 28, 0.76)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.85,
  },
  hairlineRim: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
