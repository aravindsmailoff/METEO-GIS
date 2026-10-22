import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

export const C = {
  bg: "#000000",
  panel: "#1C1C1E",
  panel2: "#2C2C2E",
  line: "rgba(255, 255, 255, 0.12)",
  text: "#FFFFFF",
  muted: "rgba(235, 235, 245, 0.65)",
  dim: "rgba(235, 235, 245, 0.40)",
  teal: "#64D2FF",
  tealDark: "#0A465C",
  amber: "#FFD60A",
  orange: "#FF9F0A",
  coral: "#FF453A",
  blue: "#0A84FF",
  green: "#30D158",
  indigo: "#5E5CE6",
  purple: "#BF5AF2",
  white: "#FFFFFF",
  glass: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(255, 255, 255, 0.16)",
} as const;

export const riskColor = (risk?: string) => {
  switch (risk) {
    case "safe": return C.green;
    case "watch": return C.amber;
    case "warning": return C.orange;
    case "danger":
    case "critical": return C.coral;
    default: return C.teal;
  }
};

export const SF_PRO = Platform.select({
  ios: "System",
  default: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Plus Jakarta Sans', 'Outfit', 'Inter', system-ui, sans-serif",
});

export const SF_PRO_ROUNDED = Platform.select({
  ios: "System",
  default: "-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
});

type SurfaceVariant = "base" | "teal" | "urgent";

const surfaceColors: Record<SurfaceVariant, [string, string, ...string[]]> = {
  base: ["#23242A", "#18191E", "#101114"],
  teal: ["#0A2A38", "#081F2B", "#05131A"],
  urgent: ["#3D1418", "#280C10", "#140407"],
};

const cardColors: Record<SurfaceVariant, string> = {
  base: "#1C1C1E",
  teal: "#0D222E",
  urgent: "#261014",
};

export function GradientSurface({
  children,
  style,
  variant = "base",
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; variant?: SurfaceVariant }>) {
  return (
    <LinearGradient
      colors={surfaceColors[variant]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={[styles.surface, style]}
    >
      <View style={styles.specularTopLine} />
      {children}
    </LinearGradient>
  );
}

export function LiveFeedBadge({ label }: { label?: string }) {
  const displayLabel = label || "LIVE IMD AWS & NASA POWER TELEMETRY ACTIVE";
  return (
    <View accessibilityLabel={displayLabel} style={styles.demoBadge}>
      <View style={styles.demoDot} />
      <Text style={styles.demoBadgeText}>{displayLabel}</Text>
    </View>
  );
}

export const DemoBadge = LiveFeedBadge;

export function SectionTitle({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  variant = "base",
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle>; variant?: SurfaceVariant }>) {
  return (
    <View style={[styles.card, { backgroundColor: cardColors[variant] }, style]}>
      <View style={styles.specularTopLine} />
      {children}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  compact = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, compact && styles.iconButtonCompact, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={compact ? 18 : 20} color={C.text} />
    </Pressable>
  );
}

export function ActionButton({
  label,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  labelStyle,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "quiet";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const gradient: [string, string] = variant === "primary"
    ? ["#0A84FF", "#0062D2"]
    : variant === "danger"
      ? ["#FF453A", "#D70015"]
      : variant === "secondary"
        ? ["#3A3A3C", "#2C2C2E"]
        : ["#2C2C2E", "#1C1C1E"];
  const textColor = variant === "primary" ? C.white : variant === "danger" ? C.white : C.text;
  const variantStyle = variant === "quiet" ? styles.quietButton : styles.filledButton;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variantStyle,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {variant !== "quiet" ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.buttonContent}>
        {icon ? <Ionicons name={icon} size={18} color={textColor} /> : null}
        <Text style={[styles.actionButtonText, { color: textColor }, labelStyle]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function RiskPill({ label, level }: { label: string; level: string }) {
  const color = riskColor(level);
  return (
    <View accessibilityLabel={`${label} risk level`} style={[styles.riskPill, { borderColor: `${color}66`, backgroundColor: `${color}20` }]}>
      <View style={[styles.riskPillDot, { backgroundColor: color }]} />
      <Text style={[styles.riskPillText, { color }]}>{label}</Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  detail,
  color = C.teal,
  style,
}: {
  label: string;
  value: string;
  detail: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statTile, style]}>
      <LinearGradient
        colors={["#24262E", "#181A20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.specularTopLine} />
      <View style={[styles.statAccent, { backgroundColor: color }]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statDetail}>{detail}</Text>
    </View>
  );
}

export function ReservoirGauge({ value, color, size = 72 }: { value: number; color: string; size?: number }) {
  const [scale] = useState(() => new Animated.Value(0.94));
  const safeValue = Math.min(100, Math.max(0, value));
  const strokeWidth = Math.max(5, size * 0.095);
  const radius = (size - strokeWidth) / 2 - 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const animation = Animated.spring(scale, { toValue: 1, tension: 120, friction: 12, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scale, value]);

  return (
    <Animated.View
      accessibilityLabel={`Reservoir capacity ${Math.round(safeValue)} percent`}
      style={[styles.gauge, { width: size, height: size, transform: [{ scale }] }]}
    >
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth={strokeWidth} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - safeValue / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.gaugeTextWrap} pointerEvents="none">
        <Text style={styles.gaugeText}>{Math.round(safeValue)}%</Text>
      </View>
    </Animated.View>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <Card style={styles.loading}>
      <ActivityIndicator color={C.teal} size="small" />
      <Text style={styles.loadingText}>{label}</Text>
    </Card>
  );
}

export const styles = StyleSheet.create({
  surface: {
    borderRadius: 24,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  specularTopLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    zIndex: 1,
  },
  demoBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(48, 209, 88, 0.4)",
    backgroundColor: "rgba(48, 209, 88, 0.12)",
  },
  demoDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
    backgroundColor: "#30D158",
  },
  demoBadgeText: {
    color: "#30D158",
    flexShrink: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  sectionTitleText: {
    color: C.text,
    flexShrink: 1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sectionTrailing: {
    color: C.dim,
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  card: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(44, 44, 46, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  iconButtonCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  actionButton: {
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  filledButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  quietButton: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    backgroundColor: "rgba(44, 44, 46, 0.8)",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  riskPill: {
    alignSelf: "flex-start",
    minHeight: 26,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riskPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  riskPillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statTile: {
    minWidth: 0,
    minHeight: 122,
    flexGrow: 1,
    flexBasis: "47%",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
  },
  statAccent: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  statValue: {
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  statDetail: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  gauge: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeTextWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  loading: {
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
