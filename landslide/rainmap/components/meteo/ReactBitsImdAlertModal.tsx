import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";
import type { DirectImdHazard } from "@/lib/meteo/imdDirectService";
import {
  ReactBitsShinyText,
  ReactBitsBorderBeam,
  ReactBitsSpotlightCard,
  ReactBitsDecryptedText,
  ReactBitsAnimatedCounter,
} from "./ReactBitsComponents";
import { getNearestRadarStation } from "@/lib/meteo/radarStationResolver";

interface Props {
  visible: boolean;
  hazard: DirectImdHazard | null;
  onClose: () => void;
  onOpenRadar?: (radarStationCode: string) => void;
  onOpenSatellite?: () => void;
}

export function ReactBitsImdAlertModal({
  visible,
  hazard,
  onClose,
  onOpenRadar,
  onOpenSatellite,
}: Props) {
  if (!hazard) return null;

  const isRed = hazard.severity === "EXTREME" || hazard.day1Color === "RED";
  const isOrange = hazard.severity === "SEVERE" || hazard.day1Color === "ORANGE";
  const themeColor = isRed ? "#EF4444" : isOrange ? "#F97316" : "#EAB308";

  const nearestRadar = getNearestRadarStation(hazard.latitude, hazard.longitude);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { borderColor: `${themeColor}55` }]}>
          <ReactBitsBorderBeam color={themeColor} size={110} durationMs={2800} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <View style={styles.badgeRow}>
                <View style={[styles.statusPill, { backgroundColor: `${themeColor}22`, borderColor: themeColor }]}>
                  <View style={[styles.pulsingDot, { backgroundColor: themeColor }]} />
                  <Text style={[styles.statusPillText, { color: themeColor }]}>
                    OFFICIAL IMD {isRed ? "RED WARNING" : isOrange ? "ORANGE ALERT" : "YELLOW WATCH"}
                  </Text>
                </View>
                <Text style={styles.govSourceText}>GOVT OF INDIA</Text>
              </View>

              <ReactBitsDecryptedText
                text={hazard.district.toUpperCase()}
                style={[styles.districtTitle, { color: "#F8FAFC" }]}
                characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
              />
              <Text style={styles.stateSubtitle}>{hazard.state} · India</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Official IMD Bulletin Card */}
            <ReactBitsSpotlightCard urgent={isRed} style={styles.bulletinCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="newspaper-outline" size={16} color={themeColor} />
                <ReactBitsShinyText
                  text="OFFICIAL METEOROLOGICAL BULLETIN"
                  shimmerColor={themeColor}
                  baseColor="#94A3B8"
                  style={styles.sectionTitle}
                />
              </View>
              <Text style={styles.bulletinBody}>
                {hazard.bulletinDetails || hazard.headline}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaItem}>🕒 {hazard.issuedAt}</Text>
                <Text style={styles.metaItem}>⏳ {hazard.validUntil}</Text>
              </View>
            </ReactBitsSpotlightCard>

            {/* 5-Day Synoptic Outlook Matrix */}
            <View style={styles.outlookContainer}>
              <Text style={styles.outlookTitle}>5-DAY SYNOPTIC HAZARD TRAJECTORY</Text>
              <View style={styles.daysRow}>
                {[
                  { label: "Day 1", color: hazard.day1Color || (isRed ? "RED" : isOrange ? "ORANGE" : "YELLOW") },
                  { label: "Day 2", color: hazard.day2Color || "YELLOW" },
                  { label: "Day 3", color: hazard.day3Color || "YELLOW" },
                  { label: "Day 4", color: hazard.day4Color || "GREEN" },
                  { label: "Day 5", color: hazard.day5Color || "GREEN" },
                ].map((d, i) => {
                  const dayBg =
                    d.color === "RED"
                      ? "#EF4444"
                      : d.color === "ORANGE"
                      ? "#F97316"
                      : d.color === "YELLOW"
                      ? "#EAB308"
                      : "#10B981";
                  return (
                    <View key={i} style={[styles.dayCard, { borderColor: `${dayBg}44` }]}>
                      <Text style={styles.dayLabel}>{d.label}</Text>
                      <View style={[styles.dayColorPill, { backgroundColor: dayBg }]}>
                        <Text style={styles.dayColorText}>{d.color}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* In-Situ Quantitative Telemetry Grid */}
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryLabel}>EST. RAINFALL</Text>
                <ReactBitsAnimatedCounter
                  value={hazard.rainfallMmH || 24}
                  decimals={1}
                  suffix=" mm/h"
                  style={styles.telemetryValue}
                  color={themeColor}
                />
                <Text style={styles.telemetrySub}>High Rate Risk</Text>
              </View>

              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryLabel}>GUST SPEED</Text>
                <ReactBitsAnimatedCounter
                  value={hazard.windSpeedKmh || 32}
                  decimals={0}
                  suffix=" km/h"
                  style={styles.telemetryValue}
                  color="#38BDF8"
                />
                <Text style={styles.telemetrySub}>{hazard.windCardinal || "SW"} Airflow</Text>
              </View>

              <View style={styles.telemetryCard}>
                <Text style={styles.telemetryLabel}>RADAR ECHO</Text>
                <ReactBitsAnimatedCounter
                  value={hazard.radarEchoDbz || 42}
                  decimals={0}
                  suffix=" dBZ"
                  style={styles.telemetryValue}
                  color="#F59E0B"
                />
                <Text style={styles.telemetrySub}>Reflectivity</Text>
              </View>
            </View>

            {/* Official Precautions */}
            <View style={styles.precautionsCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: "#10B981" }]}>NDMA SAFETY DIRECTIVES</Text>
              </View>
              {hazard.precautions.map((p, idx) => (
                <View key={idx} style={styles.precautionItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.precautionText}>{p}</Text>
                </View>
              ))}
            </View>

            {/* Government Actions Row */}
            <View style={styles.actionsRow}>
              {onOpenRadar ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    onOpenRadar(nearestRadar.code);
                  }}
                  style={styles.radarBtn}
                >
                  <Ionicons name="radio" size={16} color="#38BDF8" />
                  <Text style={styles.radarBtnText}>IMD RADAR ({nearestRadar.code.toUpperCase()})</Text>
                </Pressable>
              ) : null}

              {onOpenSatellite ? (
                <Pressable
                  onPress={() => {
                    onClose();
                    onOpenSatellite();
                  }}
                  style={styles.satBtn}
                >
                  <Ionicons name="globe" size={16} color="#A855F7" />
                  <Text style={styles.satBtnText}>INSAT SATELLITE</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 580,
    maxHeight: "88%",
    backgroundColor: "#07121D",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  titleBlock: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: SF_PRO,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  govSourceText: {
    fontFamily: SF_PRO,
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  districtTitle: {
    fontFamily: SF_PRO,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stateSubtitle: {
    fontFamily: SF_PRO,
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollBody: {
    padding: 18,
    gap: 14,
  },
  bulletinCard: {
    marginBottom: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: SF_PRO,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  bulletinBody: {
    fontFamily: SF_PRO,
    fontSize: 14,
    lineHeight: 21,
    color: "#E2E8F0",
    fontWeight: "500",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  metaItem: {
    fontFamily: SF_PRO,
    fontSize: 11,
    color: "#94A3B8",
  },
  outlookContainer: {
    backgroundColor: "rgba(11, 23, 38, 0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
  },
  outlookTitle: {
    fontFamily: SF_PRO,
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  dayCard: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  dayLabel: {
    fontFamily: SF_PRO,
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 5,
  },
  dayColorPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  dayColorText: {
    fontFamily: SF_PRO,
    fontSize: 9,
    fontWeight: "800",
    color: "#050B14",
  },
  telemetryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: "rgba(11, 23, 38, 0.7)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 12,
    alignItems: "center",
  },
  telemetryLabel: {
    fontFamily: SF_PRO,
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  telemetryValue: {
    fontSize: 17,
  },
  telemetrySub: {
    fontFamily: SF_PRO,
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 2,
  },
  precautionsCard: {
    backgroundColor: "rgba(11, 23, 38, 0.7)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    padding: 14,
  },
  precautionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 6,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
    marginTop: 7,
  },
  precautionText: {
    flex: 1,
    fontFamily: SF_PRO,
    fontSize: 12,
    color: "#CBD5E1",
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  radarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    borderRadius: 14,
    paddingVertical: 13,
  },
  radarBtnText: {
    fontFamily: SF_PRO,
    fontSize: 11,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 0.4,
  },
  satBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    borderRadius: 14,
    paddingVertical: 13,
  },
  satBtnText: {
    fontFamily: SF_PRO,
    fontSize: 11,
    fontWeight: "800",
    color: "#A855F7",
    letterSpacing: 0.4,
  },
});
