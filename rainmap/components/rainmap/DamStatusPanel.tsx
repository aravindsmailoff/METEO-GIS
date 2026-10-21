import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { AceternityCard } from "./AceternityCard";

interface DamItem {
  id: string;
  name: string;
  river: string;
  fillPct: number;
  inflow: number; // m3/s
  outflow: number; // m3/s
  capacityMax: number; // MCM
  currentStorage: number;
  gatesTotal: number;
  gatesOpen: number;
  status: "DANGER" | "WARNING" | "WATCH";
  statusColor: string;
  downstreamAlert: boolean;
  timeline: { area: string; time: string; distance: string; status: string }[];
}

const DAMS: DamItem[] = [
  {
    id: "teesta5",
    name: "Teesta-V Dam",
    river: "Teesta River (NHPC)",
    fillPct: 91.4,
    inflow: 3842,
    outflow: 2100,
    capacityMax: 50.25,
    currentStorage: 45.92,
    gatesTotal: 4,
    gatesOpen: 3,
    status: "DANGER",
    statusColor: "#ef4444",
    downstreamAlert: true,
    timeline: [
      { area: "Singtam Bazaar", time: "1.5 hrs", distance: "18 km", status: "Inundation Imminent" },
      { area: "Rangpo Bridge", time: "3.0 hrs", distance: "34 km", status: "High Water Surge" },
      { area: "Melli Bazaar", time: "5.5 hrs", distance: "56 km", status: "Level 2 Evacuation" },
      { area: "Jorethang Confluence", time: "8.0 hrs", distance: "78 km", status: "Precautionary Watch" },
    ],
  },
  {
    id: "rathong",
    name: "Rathong-Chu HEP",
    river: "Rathong-Chu River",
    fillPct: 74.0,
    inflow: 1240,
    outflow: 850,
    capacityMax: 22.1,
    currentStorage: 16.35,
    gatesTotal: 3,
    gatesOpen: 1,
    status: "WARNING",
    statusColor: "#f97316",
    downstreamAlert: false,
    timeline: [
      { area: "Yuksom Lowlands", time: "2.0 hrs", distance: "12 km", status: "Riverbank Warning" },
      { area: "Tashiding Confluence", time: "4.5 hrs", distance: "28 km", status: "Monitoring Inflow" },
    ],
  },
  {
    id: "dikchu",
    name: "Dikchu Hydro Dam",
    river: "Dikchu River Basin",
    fillPct: 58.2,
    inflow: 980,
    outflow: 720,
    capacityMax: 18.0,
    currentStorage: 10.48,
    gatesTotal: 2,
    gatesOpen: 0,
    status: "WATCH",
    statusColor: "#eab308",
    downstreamAlert: false,
    timeline: [
      { area: "Dikchu Settlement", time: "1.0 hrs", distance: "8 km", status: "Normal Regulated" },
      { area: "Singtam Confluence", time: "2.5 hrs", distance: "22 km", status: "Clear Flow" },
    ],
  },
];

export function DamStatusPanel() {
  const [selectedDamId, setSelectedDamId] = useState("teesta5");
  const currentDam = DAMS.find((d) => d.id === selectedDamId) || DAMS[0];

  return (
    <View style={styles.container}>
      {/* ── Dam Tabs ── */}
      <View style={styles.damTabsRow}>
        {DAMS.map((dam) => {
          const isSelected = selectedDamId === dam.id;
          return (
            <Pressable
              key={dam.id}
              onPress={() => setSelectedDamId(dam.id)}
              style={[
                styles.damTabBtn,
                isSelected && styles.damTabBtnActive,
              ]}
            >
              <Text style={styles.damTabName} numberOfLines={1}>
                {dam.name}
              </Text>
              <Text
                style={[
                  styles.damTabFill,
                  { color: dam.statusColor },
                ]}
              >
                {dam.fillPct}% FULL
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Main Dam 3D Glass Card ── */}
      <AceternityCard
        glowColor={`${currentDam.statusColor}33`}
        style={{ padding: 14 }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.damTitle}>{currentDam.name}</Text>
            <Text style={styles.damRiver}>{currentDam.river}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${currentDam.statusColor}22`,
                borderColor: `${currentDam.statusColor}55`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: currentDam.statusColor },
              ]}
            >
              {currentDam.status}
            </Text>
          </View>
        </View>

        {/* Animated Liquid Reservoir Meter */}
        <View style={styles.liquidMeterBox}>
          {/* Liquid Fill Level */}
          <View
            style={[
              styles.liquidFill,
              {
                height: `${currentDam.fillPct}%`,
                backgroundColor: `${currentDam.statusColor}44`,
              },
            ]}
          />

          <View style={styles.liquidTopRow}>
            <Text style={styles.liquidLabel}>Reservoir Storage</Text>
            <Text style={styles.liquidMcm}>
              {currentDam.currentStorage} / {currentDam.capacityMax} MCM
            </Text>
          </View>

          <View style={styles.liquidBottomRow}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={styles.liquidPct}>{currentDam.fillPct}%</Text>
              <Text style={styles.liquidCapLabel}>Capacity</Text>
            </View>

            <Text style={styles.gatesOpenText}>
              {currentDam.gatesOpen} of {currentDam.gatesTotal} Gates Open
            </Text>
          </View>
        </View>

        {/* Inflow vs Outflow Bento */}
        <View style={styles.flowBentoRow}>
          {/* Inflow */}
          <View style={styles.flowBentoCard}>
            <Text style={styles.flowLabel}>LIVE INFLOW</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={styles.flowVal}>
                {currentDam.inflow.toLocaleString()}
              </Text>
              <Text style={styles.flowUnit}>m³/s</Text>
            </View>
            <Text style={styles.inflowAlertSub}>Critical high surge</Text>
          </View>

          {/* Outflow */}
          <View style={styles.flowBentoCard}>
            <Text style={styles.flowLabel}>CONTROLLED SPILLWAY</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
              <Text style={[styles.flowVal, { color: "#38bdf8" }]}>
                {currentDam.outflow.toLocaleString()}
              </Text>
              <Text style={styles.flowUnit}>m³/s</Text>
            </View>
            <Text style={styles.outflowSub}>Radial discharge active</Text>
          </View>
        </View>
      </AceternityCard>

      {/* ── Downstream Inundation Impact Timeline ── */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="time" size={15} color="#fbbf24" />
            <Text style={styles.timelineTitle}>
              Discharge Flood Arrival Timeline
            </Text>
          </View>
          <Text style={styles.timelineSubtitle}>Distance / ETA</Text>
        </View>

        <View style={styles.timelineList}>
          {currentDam.timeline.map((step, idx) => (
            <View key={step.area} style={styles.timelineItem}>
              <View style={styles.timelineItemLeft}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <View>
                  <Text style={styles.stepArea}>{step.area}</Text>
                  <Text style={styles.stepStatus}>{step.status}</Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.stepTime}>{step.time}</Text>
                <Text style={styles.stepDistance}>{step.distance}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  damTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 3,
    gap: 4,
  },
  damTabBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  damTabBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  damTabName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  damTabFill: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  damTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  damRiver: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.55)",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  liquidMeterBox: {
    position: "relative",
    height: 94,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
    marginBottom: 12,
  },
  liquidFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  liquidTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liquidLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  liquidMcm: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#ffffff",
  },
  liquidBottomRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  liquidPct: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.8,
  },
  liquidCapLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },
  gatesOpenText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#fcd34d",
  },
  flowBentoRow: {
    flexDirection: "row",
    gap: 10,
  },
  flowBentoCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 10,
  },
  flowLabel: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
    marginBottom: 3,
  },
  flowVal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  flowUnit: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
  inflowAlertSub: {
    fontSize: 10,
    color: "#f87171",
    fontWeight: "600",
    marginTop: 2,
  },
  outflowSub: {
    fontSize: 10,
    color: "rgba(56, 189, 248, 0.85)",
    fontWeight: "600",
    marginTop: 2,
  },
  timelineCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 14,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  timelineSubtitle: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.4)",
  },
  timelineList: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 10,
  },
  timelineItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#ffffff",
  },
  stepArea: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepStatus: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 1,
  },
  stepTime: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#fcd34d",
  },
  stepDistance: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
  },
});
