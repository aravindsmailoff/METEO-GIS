import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getCountdownTime, type MeteoGisZone } from "@/lib/meteo/meteoGisData";
import { SF_PRO } from "../flood/ui";
import { WatermelonGlowCard, WatermelonShimmerBadge } from "./WatermelonAnimations";
import { KokonutBentoMetricCard } from "./KokonutUI";

interface Props {
  currentZone: MeteoGisZone;
  zoneIndex: number;
  onClose?: () => void;
}

type TabKey = "overview" | "warnings";

export function ContextualIntelligencePanel({ currentZone, zoneIndex, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [countdown, setCountdown] = useState(
    getCountdownTime(currentZone.validDurationHours, zoneIndex * 713200)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(currentZone.validDurationHours, zoneIndex * 713200));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentZone.validDurationHours, zoneIndex]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "OVERVIEW" },
    { key: "warnings", label: "WARNINGS" },
  ];

  return (
    <View style={styles.container}>
      {/* Panel Header */}
      <View style={styles.header}>
        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbRoot}>INDIA</Text>
          <Ionicons name="chevron-forward" size={10} color="rgba(255, 255, 255, 0.4)" />
          <Text style={styles.breadcrumbActive}>{currentZone.district}</Text>
        </View>

        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.districtHeading}>
              {currentZone.district}
            </Text>
            <Text numberOfLines={1} style={styles.subHeading}>
              National Operational Overview · 28 States & 8 UTs
            </Text>
          </View>

          <WatermelonShimmerBadge label="LIVE TELEMETRY" color="#30D158" />
        </View>

        {/* Apple iOS Segmented Control: strictly OVERVIEW and WARNINGS */}
        <View style={styles.segmentedContainer}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.segmentedTab, isActive && styles.segmentedTabActive]}
              >
                <Text style={[styles.segmentedLabel, isActive && styles.segmentedLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tab Body */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {activeTab === "overview" ? (
          <>
            {/* 1. Doppler Nowcast Validity Countdown Card - DISPLAYED FIRST AT TOP */}
            <WatermelonGlowCard
              glowColor={currentZone.severity === "RED" ? "#EF4444" : currentZone.severity === "ORANGE" ? "#F97316" : "#F59E0B"}
              urgent={currentZone.severity === "RED" || currentZone.severity === "ORANGE"}
              style={styles.countdownCard}
            >
              <View style={styles.countdownCardHeader}>
                <View style={styles.countdownCardTitleRow}>
                  <View style={[styles.pulsingYellowDot, currentZone.severity === "RED" && { backgroundColor: "#EF4444" }]} />
                  <Text style={styles.countdownCardTitle}>DOPPLER NOWCAST VALIDITY COUNTDOWN</Text>
                </View>
                <View style={[
                  styles.cardStormBadge,
                  currentZone.severity === "RED" && { backgroundColor: "rgba(239, 68, 68, 0.2)", borderColor: "rgba(239, 68, 68, 0.4)" }
                ]}>
                  <Ionicons name="flash" size={10} color={currentZone.severity === "RED" ? "#EF4444" : "#F59E0B"} />
                  <Text style={[styles.cardStormBadgeText, currentZone.severity === "RED" && { color: "#EF4444" }]}>
                    {currentZone.badgeLabel || "STORM ALERT"}
                  </Text>
                </View>
              </View>

              {/* Active Warning Headline Banner */}
              {currentZone.headline ? (
                <View style={styles.countdownHeadlineBox}>
                  <Ionicons name="warning" size={13} color="#F59E0B" />
                  <Text numberOfLines={2} style={styles.countdownHeadlineText}>
                    {currentZone.headline}
                  </Text>
                </View>
              ) : null}

              {/* LED Blocks: Hours : Mins : Secs */}
              <View style={styles.ledDisplay}>
                <View style={styles.ledBlock}>
                  <Text style={styles.ledDigits}>{countdown.hrs}</Text>
                  <Text style={styles.ledLabel}>HOURS</Text>
                </View>

                <Text style={styles.ledColon}>:</Text>

                <View style={styles.ledBlock}>
                  <Text style={styles.ledDigits}>{countdown.mins}</Text>
                  <Text style={styles.ledLabel}>MINS</Text>
                </View>

                <Text style={styles.ledColon}>:</Text>

                <View style={styles.ledBlock}>
                  <Text style={styles.ledDigits}>{countdown.secs}</Text>
                  <Text style={styles.ledLabel}>SECS</Text>
                </View>
              </View>

              {/* Card Footer Window and Target */}
              <View style={styles.countdownCardFooter}>
                <Text style={styles.windowLabel}>
                  Window: <Text style={styles.windowValue}>Until Today (24h Forecast Cycle)</Text>
                </Text>
                <Text style={styles.targetLabel}>
                  Target: <Text style={styles.targetValue}>{currentZone.district}</Text>
                </Text>
              </View>
            </WatermelonGlowCard>

            {/* 2. Kokonut UI: 4-Card 2x2 Bento Metric Grid - PLACED BELOW THE TIMER */}
            <View style={styles.metricsGrid}>
              <KokonutBentoMetricCard
                label="TEMPERATURE"
                value={currentZone.tempC}
                unit="°C"
                subtext="ISRO / NASA Satellite"
                icon="thermometer-outline"
                accentColor="#F59E0B"
                sparklineData={[26, 27, 28, 27.5, 29, 29.5, 30, currentZone.tempC]}
              />
              <KokonutBentoMetricCard
                label="HUMIDITY"
                value={currentZone.humidityPercent}
                unit="%"
                subtext="Atmospheric Sounder"
                icon="water-outline"
                accentColor="#38BDF8"
                sparklineData={[68, 70, 72, 75, 73, 71, 74, currentZone.humidityPercent]}
              />
              <KokonutBentoMetricCard
                label="RAINFALL (1H)"
                value={currentZone.rain1hMm}
                unit="mm"
                subtext={currentZone.rain1hMm === 0 ? "0.0 mm (Dry / Nil)" : "Active Precipit."}
                icon="rainy-outline"
                accentColor="#60A5FA"
                sparklineData={[0, 0, 0.2, 0.5, 0.1, 0, currentZone.rain1hMm]}
              />
              <KokonutBentoMetricCard
                label="WIND"
                value={currentZone.windSpeedKmh}
                unit="km/h"
                subtext="NASA GEOS Stream"
                icon="navigate-outline"
                accentColor="#34D399"
                sparklineData={[10, 12, 14, 18, 16, 15, currentZone.windSpeedKmh]}
              />
            </View>
          </>
        ) : (
          /* Warnings / Details Tab */
          <View style={styles.warningsContainer}>
            <WatermelonGlowCard glowColor="#EF4444" urgent={true} style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>{currentZone.headline}</Text>
                <Text style={styles.warningSummary}>{currentZone.summary}</Text>
              </View>
            </WatermelonGlowCard>

            {currentZone.slopeDeg ? (
              <View style={styles.slopeAlertCard}>
                <Ionicons name="trending-down" size={16} color="#F43F5E" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.slopeAlertTitle}>Terrain Slope Stability</Text>
                  <Text style={styles.slopeAlertText}>
                    Slope Gradient: {currentZone.slopeDeg}° · High Soil Moisture Saturation Risk
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.bulletinMeta}>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Authority: </Text>
                <Text style={styles.metaValue}>India Meteorological Department (IMD) / NWFC</Text>
              </Text>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Source Feed: </Text>
                <Text style={styles.metaValue}>{currentZone.sourceFeed}</Text>
              </Text>
              <Text style={styles.metaRow}>
                <Text style={styles.metaLabel}>Validity Cycle: </Text>
                <Text style={styles.metaValue}>{currentZone.validDurationHours} Hours</Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#070B14",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "#0A0F1D",
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  breadcrumbRoot: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  breadcrumbActive: {
    color: "#38BDF8",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  districtHeading: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.4,
    fontFamily: SF_PRO,
  },
  subHeading: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: -0.1,
    fontFamily: SF_PRO,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.35)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    color: "#10B981",
    fontSize: 9.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    padding: 3,
    marginTop: 4,
  },
  segmentedTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentedTabActive: {
    backgroundColor: "#1E293B",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  segmentedLabel: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0.3,
    fontFamily: SF_PRO,
  },
  segmentedLabelActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  scrollBody: {
    padding: 14,
    gap: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: "#0D1322",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 12,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
    fontFamily: SF_PRO,
    fontVariant: ["tabular-nums"],
  },
  metricSub: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
    marginTop: 4,
    letterSpacing: -0.1,
    fontFamily: SF_PRO,
  },
  countdownCard: {
    backgroundColor: "#0A0E18",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 14,
  },
  countdownCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  countdownCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulsingYellowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#F59E0B",
  },
  countdownCardTitle: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
  cardStormBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardStormBadgeText: {
    color: "#F59E0B",
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: SF_PRO,
  },
  ledDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  ledBlock: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 10,
    width: 68,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  ledDigits: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: SF_PRO,
    fontWeight: "700",
    letterSpacing: 0.5,
    fontVariant: ["tabular-nums"],
  },
  ledLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 2,
    fontFamily: SF_PRO,
  },
  ledColon: {
    color: "#F59E0B",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
    fontFamily: SF_PRO,
  },
  countdownCardFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingTop: 10,
    gap: 4,
  },
  windowLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontFamily: SF_PRO,
  },
  windowValue: {
    color: "#F59E0B",
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  targetLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 10,
    fontFamily: SF_PRO,
  },
  targetValue: {
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.2,
    fontFamily: SF_PRO,
  },
  warningsContainer: {
    gap: 12,
  },
  warningBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  warningTitle: {
    color: "#F59E0B",
    fontSize: 12.5,
    fontWeight: "700",
    lineHeight: 17,
    fontFamily: SF_PRO,
  },
  warningSummary: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    fontFamily: SF_PRO,
  },
  slopeAlertCard: {
    backgroundColor: "rgba(244, 63, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  slopeAlertTitle: {
    color: "#F43F5E",
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
  },
  slopeAlertText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
    fontFamily: SF_PRO,
  },
  bulletinMeta: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  metaRow: {
    fontSize: 10.5,
    fontFamily: SF_PRO,
  },
  metaLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  metaValue: {
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  countdownHeadlineBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  countdownHeadlineText: {
    flex: 1,
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 15,
    fontFamily: SF_PRO,
  },
});
