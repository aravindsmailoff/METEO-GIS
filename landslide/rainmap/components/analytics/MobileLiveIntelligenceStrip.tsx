import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  activeWarningsCount: number;
  awsStationsCount: number;
  rainfallObsCount: number;
  nowcastAlertsCount: number;
  activeHazardsCount: number;
  lastSyncTime: string;
  onFilterClick?: (filter: string) => void;
  activeFilter?: string;
}

export function MobileLiveIntelligenceStrip({
  activeWarningsCount,
  awsStationsCount,
  rainfallObsCount,
  nowcastAlertsCount,
  activeHazardsCount,
  lastSyncTime,
  onFilterClick,
  activeFilter,
}: Props) {
  const items = [
    {
      id: "warnings",
      label: "Active Warnings",
      value: activeWarningsCount,
      sub: "IMD Red/Orange",
      color: activeWarningsCount > 0 ? "#F87171" : "#94A3B8",
      icon: "alert-circle",
      freshness: "Live",
    },
    {
      id: "aws",
      label: "AWS Stations",
      value: awsStationsCount ? awsStationsCount.toLocaleString() : "2,071",
      sub: "Real-time feeds",
      color: "#34D399",
      icon: "navigate",
      freshness: "15m cycle",
    },
    {
      id: "rainfall",
      label: "Rainfall Obs",
      value: rainfallObsCount,
      sub: "24h IMD gauges",
      color: "#FBBF24",
      icon: "rainy",
      freshness: "1h sync",
    },
    {
      id: "nowcast",
      label: "Nowcast Alerts",
      value: nowcastAlertsCount,
      sub: "3-hour horizon",
      color: "#38BDF8",
      icon: "speedometer",
      freshness: "Active",
    },
    {
      id: "hazards",
      label: "Live Hazards",
      value: activeHazardsCount,
      sub: "Active multi-state",
      color: "#A855F7",
      icon: "flash",
      freshness: "Syncing",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((it) => {
          const isSelected = activeFilter === it.id;
          return (
            <Pressable
              key={it.id}
              onPress={() => onFilterClick && onFilterClick(it.id)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <View style={styles.chipHeader}>
                <Ionicons name={it.icon as any} size={11} color={it.color} />
                <Text style={styles.chipLabel}>{it.label}</Text>
                <View style={[styles.dot, { backgroundColor: it.color }]} />
              </View>
              <Text style={[styles.chipValue, { color: it.color }]}>{it.value}</Text>
              <Text style={styles.chipSub}>{it.sub}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#070E1A",
    borderBottomWidth: 1,
    borderBottomColor: "#152236",
    paddingVertical: 4,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: "#0B1526",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#172844",
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 108,
  },
  chipSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)",
  },
  chipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    flex: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  chipSub: {
    fontSize: 8.5,
    color: "#94A3B8",
    marginTop: 1,
  },
});
