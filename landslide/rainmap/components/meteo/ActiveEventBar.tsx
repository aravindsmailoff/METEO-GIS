import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCountdownTime, type MeteoGisZone } from "@/lib/meteo/meteoGisData";
import { SF_PRO } from "../flood/ui";

interface Props {
  currentZone: MeteoGisZone;
  zoneIndex: number;
  totalZones: number;
  onPrevZone: () => void;
  onNextZone: () => void;
  onInspectZone: () => void;
  compact?: boolean;
}

export function ActiveEventBar({
  currentZone,
  zoneIndex,
  totalZones,
  onPrevZone,
  onNextZone,
  onInspectZone,
  compact = false,
}: Props) {
  const [countdown, setCountdown] = useState(
    getCountdownTime(currentZone.validDurationHours, zoneIndex * 713200)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(currentZone.validDurationHours, zoneIndex * 713200));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentZone.validDurationHours, zoneIndex]);

  const isRed = currentZone.severity === "RED";
  const badgeBg = isRed ? "#EF4444" : "#F59E0B";

  // Mobile-Optimized Floating Apple Island Capsule
  if (compact) {
    return (
      <View style={styles.floatingCapsule}>
        <View style={styles.capsuleTopRow}>
          {/* Zone Stepper */}
          <View style={styles.capsuleStepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous zone"
              onPress={onPrevZone}
              style={styles.capsuleStepBtn}
            >
              <Ionicons name="chevron-back" size={13} color="rgba(255, 255, 255, 0.9)" />
            </Pressable>
            <Text style={styles.capsuleStepperText}>
              {zoneIndex + 1}/{totalZones}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next zone"
              onPress={onNextZone}
              style={styles.capsuleStepBtn}
            >
              <Ionicons name="chevron-forward" size={13} color="rgba(255, 255, 255, 0.9)" />
            </Pressable>
          </View>

          {/* District Name with Apple Typography */}
          <Pressable onPress={onInspectZone} style={styles.capsuleTitlePressable}>
            <Text numberOfLines={1} style={styles.capsuleDistrictTitle}>
              {currentZone.district}
            </Text>
          </Pressable>

          {/* Live pulsing dot */}
          <View style={styles.capsuleLiveDotWrapper}>
            <View style={styles.capsuleLiveDot} />
          </View>
        </View>

        {/* Sub Row: Hazard Severity Badge & Doppler Countdown */}
        <View style={styles.capsuleBottomRow}>
          <View style={[styles.capsuleBadge, { backgroundColor: badgeBg }]}>
            <Ionicons name="flash" size={10} color="#000000" />
            <Text style={styles.capsuleBadgeText}>{currentZone.badgeLabel}</Text>
          </View>

          <View style={styles.capsuleTimerRow}>
            <Ionicons name="time-outline" size={11} color="#F59E0B" />
            <Text style={styles.capsuleTimerText}>{countdown.clockStr} REMAINING</Text>
          </View>
        </View>
      </View>
    );
  }

  // Desktop Standard Active Event Bar
  return (
    <View style={styles.container}>
      {/* Left: Zone Stepper */}
      <View style={styles.zoneStepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous zone"
          onPress={onPrevZone}
          style={styles.stepButton}
        >
          <Ionicons name="chevron-back" size={13} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>
        <Text style={styles.zoneStepperText}>
          ZONE {zoneIndex + 1}/{totalZones}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next zone"
          onPress={onNextZone}
          style={styles.stepButton}
        >
          <Ionicons name="chevron-forward" size={13} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>
      </View>

      {/* Primary Hazard Severity Badge */}
      <View style={[styles.categoryBadge, { backgroundColor: badgeBg }]}>
        <Ionicons name="flash" size={12} color="#000000" />
        <Text style={styles.categoryBadgeText}>{currentZone.badgeLabel}</Text>
      </View>

      {/* Hazard Headline & District Details */}
      <View style={styles.middleDetails}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.districtTitle}>
            {currentZone.district} ({currentZone.state})
          </Text>
          <View style={styles.stormAlertPill}>
            <Ionicons name="flash" size={10} color="#F59E0B" />
            <Text style={styles.stormAlertText}>STORM ALERT</Text>
          </View>
        </View>
        <Text numberOfLines={1} style={styles.headlineText}>
          {currentZone.headline}
        </Text>
      </View>

      {/* Right: Doppler Countdown & Inspect Zone Action */}
      <View style={styles.rightSection}>
        {/* Countdown Box */}
        <View style={styles.countdownContainer}>
          <View style={styles.countdownLabelRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.countdownEyebrow}>DOPPLER NOWCAST VALIDITY COUNTDOWN</Text>
          </View>
          <View style={styles.clockRow}>
            <Text style={styles.clockDigits}>{countdown.clockStr}</Text>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingText}>REMAINING</Text>
            </View>
          </View>
        </View>

        {/* Source and Inspect Button */}
        <View style={styles.actionColumn}>
          <View style={styles.sourceFeedRow}>
            <Text style={styles.sourceFeedLabel}>Source Feed</Text>
            <Text style={styles.sourceFeedValue}>{currentZone.sourceFeed}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Inspect zone ${currentZone.district}`}
            onPress={onInspectZone}
            style={({ pressed }) => [styles.inspectButton, pressed && styles.inspectButtonPressed]}
          >
            <Text style={styles.inspectButtonText}>INSPECT ZONE</Text>
            <Ionicons name="arrow-forward" size={12} color="#000000" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCapsule: {
    backgroundColor: "rgba(10, 15, 29, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  capsuleTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  capsuleStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 99,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  capsuleStepBtn: {
    padding: 3,
  },
  capsuleStepperText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.2,
  },
  capsuleTitlePressable: {
    flex: 1,
    paddingHorizontal: 10,
  },
  capsuleDistrictTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontFamily: SF_PRO,
  },
  capsuleLiveDotWrapper: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  capsuleLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  capsuleBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  capsuleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capsuleBadgeText: {
    color: "#000000",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.4,
    fontFamily: SF_PRO,
  },
  capsuleTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  capsuleTimerText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: SF_PRO,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5,
  },
  container: {
    height: 52,
    backgroundColor: "#0A0E17",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    zIndex: 50,
  },
  zoneStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 4,
  },
  stepButton: {
    padding: 3,
    borderRadius: 4,
  },
  zoneStepperText: {
    color: "#F8FAFC",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: SF_PRO,
    letterSpacing: 0.5,
  },
  middleDetails: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  districtTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
    fontFamily: SF_PRO,
  },
  stormAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.35)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  stormAlertText: {
    color: "#F59E0B",
    fontSize: 8.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.5,
  },
  headlineText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 10.5,
    marginTop: 1,
    fontFamily: SF_PRO,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  countdownContainer: {
    alignItems: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  countdownLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F59E0B",
  },
  countdownEyebrow: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 8,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.6,
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clockDigits: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: SF_PRO,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  remainingPill: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  remainingText: {
    color: "#F59E0B",
    fontSize: 7.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    letterSpacing: 0.5,
  },
  actionColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sourceFeedRow: {
    alignItems: "flex-end",
  },
  sourceFeedLabel: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 7.5,
    fontFamily: SF_PRO,
  },
  sourceFeedValue: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 8.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  inspectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F59E0B",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inspectButtonPressed: {
    opacity: 0.8,
  },
  inspectButtonText: {
    color: "#000000",
    fontSize: 9.5,
    fontWeight: "800",
    fontFamily: SF_PRO,
    letterSpacing: 0.4,
  },
});
