import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDemographicsForSelection } from "@/lib/meteo/indiaDemographics";
import { getNearestRadarStation } from "@/lib/meteo/radarStationResolver";

interface Props {
  selectedState?: string;
  selectedDistrict?: string;
  onOpenRadar?: (stationCode: string) => void;
  onOpenSatellite?: () => void;
}

export function MobilePowerBiAnalyticsPanel({
  selectedState = "All India",
  selectedDistrict,
  onOpenRadar,
  onOpenSatellite,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "rainfall" | "population" | "wind" | "warnings"
  >("overview");

  const demographics = getDemographicsForSelection(selectedState, selectedDistrict);
  const nearestRadar = getNearestRadarStation(
    selectedState === "Tamil Nadu" ? 13.0827 : 21.2514,
    selectedState === "Tamil Nadu" ? 80.2707 : 81.6296,
    true,
    selectedState,
    selectedDistrict
  );

  const tabs = [
    { id: "overview", label: "OVERVIEW", icon: "stats-chart" },
    { id: "rainfall", label: "RAINFALL", icon: "rainy" },
    { id: "population", label: "POPULATION", icon: "people" },
    { id: "wind", label: "WIND & RADAR", icon: "radio" },
    { id: "warnings", label: "WARNINGS", icon: "warning" },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Top Territory Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="analytics" size={18} color="#38BDF8" />
          <View>
            <Text style={styles.deckTitle}>METEO-GIS POWERBI INTELLIGENCE DECK</Text>
            <Text style={styles.deckSub}>
              Territory: {selectedDistrict ? `${selectedDistrict}, ` : ""}{selectedState}
            </Text>
          </View>
        </View>
        <Pressable
          style={styles.radarQuickBtn}
          onPress={() => onOpenRadar && onOpenRadar(nearestRadar.code)}
        >
          <Ionicons name="radio" size={13} color="#06B6D4" />
          <Text style={styles.radarQuickBtnText}>DWR Scan</Text>
        </Pressable>
      </View>

      {/* Subview Segmented Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map((t) => {
          const active = activeTab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setActiveTab(t.id)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
            >
              <Ionicons
                name={t.icon as any}
                size={12}
                color={active ? "#38BDF8" : "#64748B"}
              />
              <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Main Tab Content */}
      <ScrollView contentContainerStyle={styles.contentScroll}>
        {activeTab === "overview" && (
          <View style={styles.sectionGap}>
            {/* KPI Cards Row */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>ACTIVE WARNINGS</Text>
                <Text style={[styles.kpiValue, { color: "#F87171" }]}>14</Text>
                <Text style={styles.kpiSub}>IMD Red & Orange</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>AWS STATIONS</Text>
                <Text style={[styles.kpiValue, { color: "#34D399" }]}>2,071</Text>
                <Text style={styles.kpiSub}>15-minute telemetry</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>RADAR NETWORK</Text>
                <Text style={[styles.kpiValue, { color: "#38BDF8" }]}>34 / 34</Text>
                <Text style={styles.kpiSub}>Live volumetric scan</Text>
              </View>

              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>SOIL SATURATION</Text>
                <Text style={[styles.kpiValue, { color: "#FBBF24" }]}>78%</Text>
                <Text style={styles.kpiSub}>Runoff threshold alert</Text>
              </View>
            </View>

            {/* Ingestion & Surveillance Status */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse" size={15} color="#38BDF8" />
                <Text style={styles.cardTitle}>NATIONAL SURVEILLANCE FEED STATUS</Text>
              </View>
              <View style={styles.feedRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.feedLabel}>IMD Doppler Radar Network (34 Stations)</Text>
                <Text style={styles.feedStatus}>STREAMING (5m)</Text>
              </View>
              <View style={styles.feedRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.feedLabel}>INSAT-3DR Geostationary Sounder (MOSDAC)</Text>
                <Text style={styles.feedStatus}>LIVE (20m)</Text>
              </View>
              <View style={styles.feedRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.feedLabel}>IMD Automated Weather Stations (2,071 AWS)</Text>
                <Text style={styles.feedStatus}>SYNCED (15m)</Text>
              </View>
              <View style={styles.feedRow}>
                <View style={styles.dotGreen} />
                <Text style={styles.feedLabel}>ISRO Bhuvan CartoDEM 30m Digital Elevation</Text>
                <Text style={styles.feedStatus}>ONLINE</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "rainfall" && (
          <View style={styles.sectionGap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="rainy" size={15} color="#38BDF8" />
                <Text style={styles.cardTitle}>24-HOUR HYDROMETEOROLOGICAL SUMMARY</Text>
              </View>
              <View style={styles.rainStatRow}>
                <View style={styles.rainStatCol}>
                  <Text style={styles.rainBigVal}>142.6 mm</Text>
                  <Text style={styles.rainSubLabel}>Maximum Catchment Peak</Text>
                </View>
                <View style={styles.rainStatDivider} />
                <View style={styles.rainStatCol}>
                  <Text style={styles.rainBigVal}>68.4 mm</Text>
                  <Text style={styles.rainSubLabel}>District Area-Weighted Mean</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="speedometer" size={15} color="#FBBF24" />
                <Text style={styles.cardTitle}>CLOUDBURST RISK PROBABILITY</Text>
              </View>
              <View style={styles.probBarContainer}>
                <View style={[styles.probBarFill, { width: "68%" }]} />
              </View>
              <View style={styles.probFooter}>
                <Text style={styles.probFooterText}>Rainfall Rate ≥ 100 mm/h threshold</Text>
                <Text style={styles.probFooterVal}>68% Severe Risk</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "population" && (
          <View style={styles.sectionGap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={15} color="#F59E0B" />
                <Text style={styles.cardTitle}>CENSUS DEMOGRAPHICS & POPULATION AT RISK</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Jurisdiction Scope</Text>
                <Text style={styles.tableVal}>{demographics.state}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Total Resident Population</Text>
                <Text style={styles.tableVal}>{demographics.residentPopulation.toLocaleString()}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Annual Tourist & Transit Inflow</Text>
                <Text style={styles.tableVal}>{demographics.annualTourists.toLocaleString()}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Vulnerable Group (Elderly / Children)</Text>
                <Text style={[styles.tableVal, { color: "#F87171" }]}>
                  {demographics.vulnerablePopulation.toLocaleString()}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Population Density</Text>
                <Text style={styles.tableVal}>{demographics.densityPerSqKm.toLocaleString()} / km²</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "wind" && (
          <View style={styles.sectionGap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="radio" size={15} color="#06B6D4" />
                <Text style={styles.cardTitle}>ASSIGNED DOPPLER WEATHER RADAR</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Operational Station</Text>
                <Text style={styles.tableVal}>{nearestRadar.name}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Frequency Band</Text>
                <Text style={styles.tableVal}>{nearestRadar.band}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Surveillance Coverage</Text>
                <Text style={styles.tableVal}>{nearestRadar.rangeKm} km</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Operational Status</Text>
                <Text style={[styles.tableVal, { color: "#34D399" }]}>ONLINE (STREAMING)</Text>
              </View>
              <Pressable
                style={styles.openRadarBtn}
                onPress={() => onOpenRadar && onOpenRadar(nearestRadar.code)}
              >
                <Ionicons name="eye" size={14} color="#070E1A" />
                <Text style={styles.openRadarBtnText}>OPEN LIVE PPI RADAR VIEWER</Text>
              </Pressable>
            </View>
          </View>
        )}

        {activeTab === "warnings" && (
          <View style={styles.sectionGap}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="warning" size={15} color="#EF4444" />
                <Text style={styles.cardTitle}>ACTIVE IMD WEATHER WARNINGS</Text>
              </View>
              <View style={styles.warningItem}>
                <View style={styles.badgeRed}>
                  <Text style={styles.badgeRedText}>RED ALERT</Text>
                </View>
                <Text style={styles.warningTitle}>Extremely Heavy Rainfall & Pluvial Inundation</Text>
                <Text style={styles.warningDesc}>
                  Localized convective cell with precipitation rate exceeding 80 mm/h. High runoff risk in low-lying corridors.
                </Text>
              </View>
              <View style={styles.warningItem}>
                <View style={styles.badgeOrange}>
                  <Text style={styles.badgeOrangeText}>ORANGE ALERT</Text>
                </View>
                <Text style={styles.warningTitle}>Severe Squall & Lightning Activity</Text>
                <Text style={styles.warningDesc}>
                  Surface gusts up to 55 km/h. Advised to stay indoors and keep emergency kits accessible.
                </Text>
              </View>
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
    backgroundColor: "#050A14",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#08101E",
    borderBottomWidth: 1,
    borderBottomColor: "#152236",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deckTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  deckSub: {
    fontSize: 9.5,
    color: "#38BDF8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 1,
  },
  radarQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "#06B6D4",
  },
  radarQuickBtnText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#06B6D4",
  },
  tabsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "#070E1A",
    borderBottomWidth: 1,
    borderBottomColor: "#132135",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#0D1828",
    borderWidth: 1,
    borderColor: "#182A44",
  },
  tabBtnActive: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38BDF8",
  },
  tabBtnText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  tabBtnTextActive: {
    color: "#38BDF8",
  },
  contentScroll: {
    padding: 16,
  },
  sectionGap: {
    gap: 14,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: "#0B1526",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#162740",
    padding: 12,
  },
  kpiLabel: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  kpiSub: {
    fontSize: 9.5,
    color: "#94A3B8",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#091322",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#16263E",
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#15243B",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#F1F5F9",
    letterSpacing: 0.5,
  },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  dotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  feedLabel: {
    fontSize: 10,
    color: "#94A3B8",
    flex: 1,
  },
  feedStatus: {
    fontSize: 9,
    fontWeight: "800",
    color: "#34D399",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  rainStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  rainStatCol: {
    alignItems: "center",
  },
  rainStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#1C2E4A",
  },
  rainBigVal: {
    fontSize: 20,
    fontWeight: "900",
    color: "#38BDF8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  rainSubLabel: {
    fontSize: 9.5,
    color: "#64748B",
    marginTop: 2,
  },
  probBarContainer: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#132136",
    overflow: "hidden",
  },
  probBarFill: {
    height: "100%",
    backgroundColor: "#FBBF24",
  },
  probFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  probFooterText: {
    fontSize: 10,
    color: "#94A3B8",
  },
  probFooterVal: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FBBF24",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableKey: {
    fontSize: 11,
    color: "#94A3B8",
  },
  tableVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F1F5F9",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  openRadarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#06B6D4",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  openRadarBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#070E1A",
    letterSpacing: 0.5,
  },
  warningItem: {
    backgroundColor: "#0E182A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#182A45",
    padding: 10,
    gap: 4,
  },
  badgeRed: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeRedText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#F87171",
  },
  badgeOrange: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOrangeText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "#FBBF24",
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  warningDesc: {
    fontSize: 10.5,
    color: "#94A3B8",
    lineHeight: 15,
  },
});
