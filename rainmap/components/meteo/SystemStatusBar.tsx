import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";

export function SystemStatusBar() {
  const [syncTime, setSyncTime] = useState("");

  useEffect(() => {
    const update = () => {
      setSyncTime(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) + " IST"
      );
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Left: Operational Feeds Status */}
        <View style={styles.leftGroup}>
          <View style={styles.statusItem}>
            <View style={styles.dotEmerald} />
            <Text style={styles.statusLabel}>
              IMD: <Text style={styles.statusVal}>Live (5m)</Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.dotCyan} />
            <Text style={styles.statusLabel}>
              INSAT-3DR: <Text style={styles.statusVal}>Live</Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.dotBlue} />
            <Text style={styles.statusLabel}>
              DWR Radar: <Text style={styles.statusVal}>Live (34 stn)</Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.dotEmerald} />
            <Text style={styles.statusLabel}>
              Bhuvan: <Text style={styles.statusVal}>Connected</Text>
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.dotAmber} />
            <Text style={styles.statusLabel}>
              DEM: <Text style={styles.statusVal}>Available</Text>
            </Text>
          </View>
        </View>

        {/* Right: Official Feeds & Sync Time */}
        <View style={styles.rightGroup}>
          <View style={styles.feedBadge}>
            <Ionicons name="shield-checkmark" size={11} color="#38BDF8" />
            <Text style={styles.feedText}>Official Feeds (IMD · ISRO · NASA)</Text>
          </View>

          <View style={styles.syncRow}>
            <Ionicons name="refresh" size={10} color="rgba(255, 255, 255, 0.4)" />
            <Text style={styles.syncText}>
              Sync: 60s (Last: {syncTime || "13:41 IST"})
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    backgroundColor: "#05080E",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    zIndex: 50,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    minWidth: "100%",
    gap: 16,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dotEmerald: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10B981",
  },
  dotCyan: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#06B6D4",
  },
  dotBlue: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#38BDF8",
  },
  dotAmber: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#F59E0B",
  },
  statusLabel: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 9.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  statusVal: {
    color: "#E2E8F0",
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  feedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  feedText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 9.5,
    fontWeight: "600",
    fontFamily: SF_PRO,
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontFamily: SF_PRO,
    fontVariant: ["tabular-nums"],
  },
});
