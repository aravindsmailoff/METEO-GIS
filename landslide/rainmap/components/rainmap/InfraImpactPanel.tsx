import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AceternityCard } from "./AceternityCard";

interface InfraItem {
  id: string;
  category: "bridge" | "highway" | "shelter" | "utility";
  name: string;
  location: string;
  status: "BLOCKED" | "CRITICAL" | "OPERATIONAL" | "PRECAUTION";
  statusColor: string;
  detail: string;
  affectedPop: string;
}

const INFRA_DATA: InfraItem[] = [
  {
    id: "1",
    category: "highway",
    name: "NH-10 Gangtok-Siliguri Highway",
    location: "Mile 29 near Singtam",
    status: "BLOCKED",
    statusColor: "#ef4444",
    detail: "Debris flow & river overflow. Heavy machinery deployed. No vehicular traffic permitted.",
    affectedPop: "Main Arterial Corridor",
  },
  {
    id: "2",
    category: "bridge",
    name: "Indrani Suspension Bridge",
    location: "Singtam River Confluence",
    status: "CRITICAL",
    statusColor: "#ef4444",
    detail: "Water level touching deck girder. Structural survey underway. Foot and vehicle access shut.",
    affectedPop: "Singtam-Bermiok Link",
  },
  {
    id: "3",
    category: "highway",
    name: "NH-717A Alternate Corridor",
    location: "Ranipool – Pakyong",
    status: "PRECAUTION",
    statusColor: "#f97316",
    detail: "Light vehicles permitted with caution. Single-lane bottleneck near Pakyong.",
    affectedPop: "Airport Bypass Route",
  },
  {
    id: "4",
    category: "shelter",
    name: "Singtam Govt. Sr. Secondary Camp",
    location: "Higher Ridge Road, Singtam",
    status: "OPERATIONAL",
    statusColor: "#22c55e",
    detail: "340 of 500 beds occupied. Dry rations, clean water, medical doctor on site.",
    affectedPop: "Capacity: 500 persons",
  },
  {
    id: "5",
    category: "shelter",
    name: "Rangpo Community Relief Center",
    location: "Sub-Divisional Ground, Rangpo",
    status: "OPERATIONAL",
    statusColor: "#22c55e",
    detail: "190 of 300 beds occupied. Standby ambulance and generator active.",
    affectedPop: "Capacity: 300 persons",
  },
  {
    id: "6",
    category: "utility",
    name: "Dikchu 66kV Substation Grid",
    location: "Dikchu Lower Bank",
    status: "CRITICAL",
    statusColor: "#f97316",
    detail: "Preventative load shedding in low-lying zones to prevent electrocution hazards.",
    affectedPop: "8,400 households",
  },
];

export function InfraImpactPanel() {
  const [filter, setFilter] = useState<"all" | "highway" | "bridge" | "shelter">("all");

  const filteredItems =
    filter === "all"
      ? INFRA_DATA
      : INFRA_DATA.filter((item) => item.category === filter);

  return (
    <View style={styles.container}>
      {/* ── Civil Infrastructure Status Hero ── */}
      <AceternityCard glowColor="rgba(249, 115, 22, 0.22)" style={{ padding: 14 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.headerTag}>CIVIL INFRASTRUCTURE STATUS</Text>
          <Text style={styles.headerAgency}>State Disaster Management</Text>
        </View>

        {/* 3 Metric Bento Cards */}
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: "#f87171" }]}>2</Text>
            <Text style={styles.metricLabel}>Roads Cut</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: "#fbbf24" }]}>1</Text>
            <Text style={styles.metricLabel}>Bridge Shut</Text>
          </View>

          <View style={styles.metricBox}>
            <Text style={[styles.metricVal, { color: "#34d399" }]}>530</Text>
            <Text style={styles.metricLabel}>Sheltered</Text>
          </View>
        </View>

        <Text style={styles.advisoryText}>
          Highways along Teesta valley are restricted to emergency disaster relief convoys. Civilians are advised to avoid riverside transit roads.
        </Text>
      </AceternityCard>

      {/* ── Category Filter Pills ── */}
      <View style={styles.categoryRow}>
        {(["all", "highway", "bridge", "shelter"] as const).map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setFilter(cat)}
            style={[
              styles.catBtn,
              filter === cat && styles.catBtnActive,
            ]}
          >
            <Text
              style={[
                styles.catBtnText,
                filter === cat && styles.catBtnTextActive,
              ]}
            >
              {cat.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── List of Infrastructure Impact Cards ── */}
      <View style={styles.itemsList}>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.infraCard}>
            <View style={styles.infraCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infraName}>{item.name}</Text>
                <Text style={styles.infraLoc}>{item.location}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: `${item.statusColor}22`,
                    borderColor: `${item.statusColor}55`,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: item.statusColor }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <Text style={styles.infraDetail}>{item.detail}</Text>

            <View style={styles.infraCardBottom}>
              <Text style={styles.infraPopText}>{item.affectedPop}</Text>
              <Text style={styles.infraMapLink}>View on Map →</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerTag: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#fbbf24",
    letterSpacing: 0.6,
  },
  headerAgency: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
  },
  metricRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  metricVal: {
    fontSize: 22,
    fontWeight: "900",
  },
  metricLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
    fontWeight: "600",
  },
  advisoryText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 16,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 3,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  catBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  catBtnText: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.4,
  },
  catBtnTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  itemsList: {
    gap: 10,
  },
  infraCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 13,
    gap: 8,
  },
  infraCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  infraName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  infraLoc: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  infraDetail: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 16,
  },
  infraCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  infraPopText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
  },
  infraMapLink: {
    fontSize: 10,
    fontWeight: "600",
    color: "#38bdf8",
  },
});
