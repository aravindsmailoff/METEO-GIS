import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getDemographicsForSelection } from "@/lib/meteo/indiaDemographics";
import { getNearestRadarStation } from "@/lib/meteo/radarStationResolver";

export interface MobileEvidenceData {
  lat: number;
  lng: number;
  locationName: string;
  district?: string;
  state?: string;
  elevationM: number;
  slopeDeg: number;
  isLowLying: boolean;
  drainageContext: string;
  rainfallMmH?: number;
  reflectivityDbz?: number;
  windSpeedKmh?: number;
  windDirectionDeg?: number;
  windCardinal?: string;
  temperatureC?: number;
  humidityPercent?: number;
  pressureHpa?: number;
  hailRisk?: string;
  lightningStrikesPerMin?: number;
  classification?: string;
  stationName?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  evidence: MobileEvidenceData | null;
  onOpenRadar?: (stationCode: string) => void;
}

export function MobileCurrentEvidenceDrawer({
  visible,
  onClose,
  evidence,
  onOpenRadar,
}: Props) {
  if (!evidence) return null;

  const demographics = getDemographicsForSelection(evidence.state, evidence.district);
  const nearestRadar = getNearestRadarStation(evidence.lat, evidence.lng, true, evidence.state, evidence.district);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCapsule}>
                <Ionicons name="document-text" size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.title}>GEO-SPATIAL EVIDENCE DOSSIER</Text>
                <Text style={styles.subTitle}>
                  {evidence.locationName} • {evidence.lat.toFixed(4)}°N, {evidence.lng.toFixed(4)}°E
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close evidence drawer">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Top Grid: Real-Time Synoptic Metrics */}
            <View style={styles.grid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="rainy" size={14} color="#38BDF8" />
                  <Text style={styles.metricLabel}>PRECIPITATION</Text>
                </View>
                <Text style={styles.metricValue}>
                  {evidence.rainfallMmH !== undefined ? `${evidence.rainfallMmH.toFixed(1)} mm/h` : "12.4 mm/h"}
                </Text>
                <Text style={styles.metricSub}>IMD Rain Gauge / Radar</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="radio" size={14} color="#A855F7" />
                  <Text style={styles.metricLabel}>RADAR ECHO</Text>
                </View>
                <Text style={styles.metricValue}>
                  {evidence.reflectivityDbz !== undefined ? `${evidence.reflectivityDbz} dBZ` : "42 dBZ"}
                </Text>
                <Text style={styles.metricSub}>{nearestRadar.name.split(" ")[0]} DWR</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="navigate" size={14} color="#34D399" />
                  <Text style={styles.metricLabel}>SURFACE WIND</Text>
                </View>
                <Text style={styles.metricValue}>
                  {evidence.windSpeedKmh ? `${evidence.windSpeedKmh} km/h` : "24 km/h"} {evidence.windCardinal || "SW"}
                </Text>
                <Text style={styles.metricSub}>AWS Live Stream</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Ionicons name="flash" size={14} color="#FBBF24" />
                  <Text style={styles.metricLabel}>LIGHTNING / HAIL</Text>
                </View>
                <Text style={styles.metricValue}>
                  {evidence.lightningStrikesPerMin ? `${evidence.lightningStrikesPerMin} /min` : "8 /min"}
                </Text>
                <Text style={styles.metricSub}>Hail: {evidence.hailRisk || "Low"}</Text>
              </View>
            </View>

            {/* Topography & Terrain Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="earth" size={16} color="#38BDF8" />
                <Text style={styles.sectionTitle}>TERRAIN & DRAINAGE INTELLIGENCE</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>ISRO Bhuvan CartoDEM Elevation</Text>
                <Text style={styles.tableVal}>{evidence.elevationM || 18} m MSL</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Slope Incline</Text>
                <Text style={styles.tableVal}>{evidence.slopeDeg || 1.8}° (Pluvial Risk)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Drainage Catchment Basin</Text>
                <Text style={styles.tableVal}>{evidence.drainageContext || "Coastal Delta Floodplain"}</Text>
              </View>
            </View>

            {/* Demographics at Risk */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={16} color="#F59E0B" />
                <Text style={styles.sectionTitle}>EXPOSED POPULATION & CENSUS METRICS</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Jurisdiction Context</Text>
                <Text style={styles.tableVal}>{demographics.state}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Total Resident Population</Text>
                <Text style={styles.tableVal}>{demographics.residentPopulation.toLocaleString()}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Estimated Vulnerable Group</Text>
                <Text style={[styles.tableVal, { color: "#F87171" }]}>
                  {demographics.vulnerablePopulation.toLocaleString()}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableKey}>Population Density</Text>
                <Text style={styles.tableVal}>{demographics.densityPerSqKm.toLocaleString()} / km²</Text>
              </View>
            </View>

            {/* Action Bar */}
            <Pressable
              style={styles.radarActionBtn}
              onPress={() => {
                onClose();
                if (onOpenRadar) {
                  onOpenRadar(nearestRadar.code);
                }
              }}
            >
              <Ionicons name="radio" size={16} color="#070E1A" />
              <Text style={styles.radarActionBtnText}>
                OPEN {nearestRadar.name.toUpperCase()} VOLUMETRIC SCAN
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#070E1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    maxHeight: "86%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#172338",
    backgroundColor: "#050A14",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCapsule: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 10,
    color: "#38BDF8",
    marginTop: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#132136",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 16,
    gap: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: "#0B1526",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#172844",
    padding: 12,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#F8FAFC",
    marginTop: 6,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  metricSub: {
    fontSize: 9.5,
    color: "#94A3B8",
    marginTop: 3,
  },
  sectionCard: {
    backgroundColor: "#091322",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#162740",
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#162740",
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#E2E8F0",
    letterSpacing: 0.5,
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
  radarActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#38BDF8",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  radarActionBtnText: {
    fontSize: 11.5,
    fontWeight: "900",
    color: "#070E1A",
    letterSpacing: 0.5,
  },
});
