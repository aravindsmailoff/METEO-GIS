import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { AceternityCard } from "./AceternityCard";
import { Apple3DWeatherSphere } from "./Apple3DWeatherSphere";

interface DistrictRain {
  name: string;
  rain: number;
  status: "EXTREME" | "VERY HEAVY" | "HEAVY" | "MODERATE";
  color: string;
  trend: string;
}

const DISTRICT_DATA: DistrictRain[] = [
  { name: "East Sikkim (Singtam)", rain: 92.4, status: "EXTREME", color: "#ef4444", trend: "+14% /hr" },
  { name: "Rangpo Basin", rain: 78.2, status: "VERY HEAVY", color: "#f97316", trend: "+8% /hr" },
  { name: "Gangtok Valley", rain: 64.0, status: "HEAVY", color: "#f97316", trend: "+4% /hr" },
  { name: "Namchi Sub-basin", rain: 48.5, status: "MODERATE", color: "#eab308", trend: "-2% /hr" },
  { name: "Mangan Heights", rain: 38.1, status: "MODERATE", color: "#38bdf8", trend: "-5% /hr" },
];

const FORECAST_HOURLY = [
  { time: "Now", rain: 92, label: "Torrential" },
  { time: "06:00", rain: 88, label: "Torrential" },
  { time: "07:00", rain: 74, label: "Heavy" },
  { time: "08:00", rain: 61, label: "Heavy" },
  { time: "09:00", rain: 45, label: "Moderate" },
  { time: "10:00", rain: 30, label: "Light" },
];

export function RainfallAlertPanel() {
  const [selectedRange, setSelectedRange] = useState<"live" | "forecast" | "stations">("live");
  const [animatedNumber, setAnimatedNumber] = useState(0);

  // Smooth number count-up on mount
  useEffect(() => {
    let start = 0;
    const end = 92.4;
    const duration = 1200;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Number((start + (end - start) * ease).toFixed(1));
      setAnimatedNumber(currentVal);

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, 24);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* ── 3D Atmospheric Hero Card ── */}
      <AceternityCard glowColor="rgba(56, 189, 248, 0.22)" style={{ padding: 14 }}>
        <View style={styles.heroHeader}>
          <View style={styles.liveTagRow}>
            <View style={styles.redDot} />
            <Text style={styles.liveTagTitle}>IMD DOPPLER LIVE</Text>
          </View>
          <Text style={styles.updatedText}>Updated 3 min ago</Text>
        </View>

        {/* 3D Weather Sphere */}
        <Apple3DWeatherSphere rainfallRate={92.4} stormSeverity="extreme" />

        {/* Hero Weather Stat */}
        <View style={styles.heroStatsRow}>
          <View>
            <View style={styles.heroNumberRow}>
              <Text style={styles.heroStatValue}>{animatedNumber}</Text>
              <Text style={styles.heroStatUnit}>mm/h</Text>
            </View>
            <Text style={styles.heroSubtext}>Singtam-Rangpo Cloudburst Inflow</Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>CAT-4 RED</Text>
            </View>
            <Text style={styles.runoffText}>Runoff Index: 98%</Text>
          </View>
        </View>
      </AceternityCard>

      {/* ── Segmented Control Pill ── */}
      <View style={styles.segmentedRow}>
        {(["live", "forecast", "stations"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setSelectedRange(tab)}
            style={[
              styles.segmentBtn,
              selectedRange === tab && styles.segmentBtnActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                selectedRange === tab && styles.segmentTextActive,
              ]}
            >
              {tab.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Bento Grid Condition Metrics ── */}
      {selectedRange === "live" && (
        <View style={styles.bentoGrid}>
          {/* Humidity */}
          <View style={styles.bentoItem}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Humidity</Text>
              <Ionicons name="water" size={14} color="#38bdf8" />
            </View>
            <Text style={styles.bentoVal}>96%</Text>
            <Text style={styles.bentoSub}>Dew point 17.8°C</Text>
          </View>

          {/* Wind Gusts */}
          <View style={styles.bentoItem}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Wind Gusts</Text>
              <Feather name="wind" size={14} color="#c084fc" />
            </View>
            <Text style={styles.bentoVal}>48 km/h</Text>
            <Text style={[styles.bentoSub, { color: "rgba(192, 132, 252, 0.85)" }]}>
              ESE gale force
            </Text>
          </View>

          {/* Pressure */}
          <View style={styles.bentoItem}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Pressure</Text>
              <Ionicons name="compass" size={14} color="#fbbf24" />
            </View>
            <Text style={styles.bentoVal}>994 hPa</Text>
            <Text style={[styles.bentoSub, { color: "rgba(251, 191, 36, 0.85)" }]}>
              Rapid low trough
            </Text>
          </View>

          {/* Soil Saturation */}
          <View style={styles.bentoItem}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>Soil Saturation</Text>
              <Ionicons name="alert-circle" size={14} color="#f87171" />
            </View>
            <Text style={[styles.bentoVal, { color: "#f87171" }]}>99.2%</Text>
            <Text style={[styles.bentoSub, { color: "rgba(248, 113, 113, 0.85)" }]}>
              Landslide threshold exceeded
            </Text>
          </View>
        </View>
      )}

      {/* ── Hourly Forecast Trajectory ── */}
      {selectedRange === "forecast" && (
        <View style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>6-Hour Rain Trajectory</Text>
            <Text style={styles.forecastSubtitle}>IMD ECMWF Model</Text>
          </View>

          <View style={styles.forecastBarsRow}>
            {FORECAST_HOURLY.map((f, idx) => (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barTime}>{f.time}</Text>
                <View style={styles.barSlot}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${(f.rain / 100) * 100}%`,
                        backgroundColor:
                          f.rain > 80 ? "#ef4444" : f.rain > 50 ? "#f97316" : "#38bdf8",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barRainVal}>{f.rain}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ── District Hotspot Ranked Bars ── */}
      <View style={styles.rankedCard}>
        <View style={styles.rankedHeader}>
          <Text style={styles.rankedTitle}>Active Sub-Basin Rain Totals</Text>
          <Text style={styles.rankedSubtitle}>Rain Rate mm/h</Text>
        </View>

        <View style={styles.rankedList}>
          {DISTRICT_DATA.map((dist) => (
            <View key={dist.name} style={styles.rankedItem}>
              <View style={styles.rankedItemTop}>
                <Text style={styles.distName}>{dist.name}</Text>
                <View style={styles.distBadgeGroup}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: `${dist.color}22`,
                        borderColor: `${dist.color}55`,
                      },
                    ]}
                  >
                    <Text style={[styles.statusPillText, { color: dist.color }]}>
                      {dist.status}
                    </Text>
                  </View>
                  <Text style={styles.distRainText}>{dist.rain} mm</Text>
                </View>
              </View>

              {/* Progress Track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(dist.rain / 100) * 100}%`,
                      backgroundColor: dist.color,
                    },
                  ]}
                />
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
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  liveTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  liveTagTitle: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#f87171",
    letterSpacing: 0.6,
  },
  updatedText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.45)",
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 12,
  },
  heroNumberRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  heroStatValue: {
    fontSize: 44,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  heroStatUnit: {
    fontSize: 18,
    fontWeight: "700",
    color: "#38bdf8",
  },
  heroSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    fontWeight: "500",
  },
  catBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fca5a5",
    fontFamily: "monospace",
  },
  runoffText: {
    fontSize: 10,
    color: "rgba(248, 113, 113, 0.9)",
    fontFamily: "monospace",
    marginTop: 4,
  },
  segmentedRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  segmentBtnActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  segmentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
    letterSpacing: 0.4,
  },
  segmentTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  bentoItem: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 12,
  },
  bentoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bentoLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
  bentoVal: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
  },
  bentoSub: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
    marginTop: 2,
  },
  forecastCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 14,
  },
  forecastHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  forecastTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  forecastSubtitle: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#38bdf8",
  },
  forecastBarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barCol: {
    alignItems: "center",
    flex: 1,
    gap: 6,
  },
  barTime: {
    fontSize: 9,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  barSlot: {
    width: 22,
    height: 70,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 11,
  },
  barRainVal: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  rankedCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 14,
  },
  rankedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rankedTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  rankedSubtitle: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
  },
  rankedList: {
    gap: 12,
  },
  rankedItem: {
    gap: 4,
  },
  rankedItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  distName: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  distBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
  },
  distRainText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
});
