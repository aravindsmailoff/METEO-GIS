import React, { useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RescueUnit } from "@/lib/meteo/liveMeteoService";
import { C } from "./ui";

interface Props {
  rescueUnit: RescueUnit;
}

export function NearestRescueWidget({ rescueUnit }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCall = (phone: string) => {
    const cleanNumber = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {});
  };

  return (
    <>
      {/* Sleek Minimalist Apple Glass Floating Pill */}
      <View style={styles.floatingContainer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Nearest Rescue Team: ${rescueUnit.name}, distance ${rescueUnit.distanceKm ?? 0} km. Tap to open details.`}
          onPress={() => setModalOpen(true)}
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={14} color="#30D158" />
          </View>
          <View style={styles.pillTextCol}>
            <View style={styles.row}>
              <Text style={styles.eyebrow}>NEAREST RESCUE</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.agencyBadge}>{rescueUnit.agency}</Text>
            </View>
            <Text numberOfLines={1} style={styles.titleText}>
              {rescueUnit.battalion} · {rescueUnit.distanceKm ? `${rescueUnit.distanceKm} km` : "Nearby"}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={13} color="rgba(255, 255, 255, 0.5)" />
          </View>
        </Pressable>
      </View>

      {/* Apple-grade Minimalist Modal Sheet */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            {/* Grab Bar */}
            <View style={styles.grabBar} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.modalIconWrap}>
                  <Ionicons name="shield-checkmark" size={20} color="#30D158" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.tagRow}>
                    <View style={styles.statusPill}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>{rescueUnit.status}</Text>
                    </View>
                    <Text style={styles.agencyTag}>{rescueUnit.agency} SPECIALIZED UNIT</Text>
                  </View>
                  <Text style={styles.modalTitle}>{rescueUnit.name}</Text>
                </View>
              </View>
              <Pressable onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="rgba(255, 255, 255, 0.6)" />
              </Pressable>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>PROXIMITY</Text>
                <Text style={styles.metricVal}>{rescueUnit.distanceKm ?? 18} km</Text>
                <Text style={styles.metricSub}>Direct Radial</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>EST. ARRIVAL</Text>
                <Text style={styles.metricVal}>~{rescueUnit.etaMinutes ?? 25} min</Text>
                <Text style={styles.metricSub}>Emergency Convoy</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DEPLOYABLE</Text>
                <Text style={styles.metricVal}>{rescueUnit.personnel}</Text>
                <Text style={styles.metricSub}>Trained Responders</Text>
              </View>
            </View>

            {/* Jurisdiction & Base Details */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>OPERATIONAL SECTOR & BASE</Text>
              <Text style={styles.infoText}>{rescueUnit.headquarters}</Text>
            </View>

            {/* Specialized Disaster Equipment */}
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>EQUIPMENT ON STANDBY</Text>
              <View style={styles.equipmentTags}>
                {rescueUnit.equipment.map((item, idx) => (
                  <View key={idx} style={styles.equipBadge}>
                    <Ionicons name="checkmark-circle-outline" size={12} color="#38BDF8" />
                    <Text style={styles.equipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 24x7 Control Room Hotlines */}
            <View style={styles.hotlineSection}>
              <Text style={styles.infoLabel}>24x7 CITIZEN RESCUE HELPLINES</Text>
              <View style={styles.btnRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call NDRF Control Room 1078"
                  style={styles.primaryCallBtn}
                  onPress={() => handleCall(rescueUnit.tollFree || "1078")}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryCallText}>Call NDRF (1078)</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call Base Control Room"
                  style={styles.secondaryCallBtn}
                  onPress={() => handleCall(rescueUnit.contactPhone || "1070")}
                >
                  <Ionicons name="call-outline" size={15} color="#A1A1AA" />
                  <Text style={styles.secondaryCallText}>Base Control</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 22, 28, 0.92)",
    backdropFilter: "blur(20px)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(48, 209, 88, 0.35)",
    gap: 9,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(48, 209, 88, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillTextCol: {
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#30D158",
    fontFamily: Platform.select({ ios: "System", default: "sans-serif" }),
  },
  dot: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 9,
  },
  agencyBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "#38BDF8",
  },
  titleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 1,
  },
  chevronWrap: {
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#16181D",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 16,
    maxWidth: 580,
    alignSelf: "center",
    width: "100%",
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignSelf: "center",
    marginBottom: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  modalIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(48, 209, 88, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(48, 209, 88, 0.3)",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(48, 209, 88, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#30D158",
  },
  statusText: {
    color: "#30D158",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  agencyTag: {
    color: "#38BDF8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricsGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "space-between",
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.45)",
    letterSpacing: 0.6,
  },
  metricVal: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
    marginTop: 1,
  },
  infoBlock: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255, 255, 255, 0.45)",
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#E4E4E7",
  },
  equipmentTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  equipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  equipText: {
    color: "#BAE6FD",
    fontSize: 11,
    fontWeight: "500",
  },
  hotlineSection: {
    gap: 8,
    marginTop: 4,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  primaryCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 12,
  },
  primaryCallText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryCallText: {
    color: "#E4E4E7",
    fontSize: 14,
    fontWeight: "600",
  },
});
