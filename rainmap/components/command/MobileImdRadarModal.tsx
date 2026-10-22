import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { getMeteoBackendUrl } from "@/lib/meteo/meteoBackendClient";
import { OPERATIONAL_RADAR_STATIONS } from "@/lib/meteo/radarStationResolver";

interface Props {
  visible: boolean;
  onClose: () => void;
  initialStation?: string;
}

export function MobileImdRadarModal({ visible, onClose, initialStation = "delhi" }: Props) {
  const [station, setStation] = useState<string>(initialStation);
  const [product, setProduct] = useState<"maxz" | "ppz" | "sri" | "ppv" | "pac">("maxz");
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [nonce, setNonce] = useState(Date.now());
  const [lastCheckTime, setLastCheckTime] = useState("");

  const backendUrl = getMeteoBackendUrl();

  useEffect(() => {
    if (initialStation) {
      setStation(initialStation);
    }
  }, [initialStation]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setImageError(false);
      setNonce(Date.now());
      setLastCheckTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }) + " IST"
      );
    }
  }, [visible, station, product]);

  const currentStation = OPERATIONAL_RADAR_STATIONS.find((s) => s.code === station) || OPERATIONAL_RADAR_STATIONS[0];
  const isChennai = station === "cni";
  const imageUrl = `${backendUrl}/api/imd/imagery?type=radar&station=${station}&product=${product}&_t=${nonce}`;

  const products = [
    { id: "maxz", label: "MAXZ (dBZ Loop)", desc: "Maximum Volumetric Reflectivity" },
    { id: "ppz", label: "PPZ (Reflectivity)", desc: "Plan Position Indicator Reflectivity" },
    { id: "sri", label: "SRI (Rain Rate)", desc: "Surface Rainfall Intensity (mm/h)" },
    { id: "ppv", label: "PPV (Radial Wind)", desc: "Doppler Radial Velocity (m/s)" },
    { id: "pac", label: "PAC (Precip)", desc: "Precipitation Accumulation" },
  ] as const;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCapsule}>
                <Ionicons name="radio" size={18} color="#06B6D4" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>IMD DOPPLER WEATHER RADAR</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>LIVE PPI SCAN</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  {currentStation.name} • {currentStation.band}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close radar modal">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Chennai specific maintenance banner */}
          {isChennai && (
            <View style={styles.bannerWarn}>
              <Ionicons name="information-circle" size={14} color="#F59E0B" />
              <Text style={styles.bannerWarnText}>
                Chennai Port DWR in maintenance; showing live Karaikal S-Band South Coastal radar.
              </Text>
            </View>
          )}

          {/* Station Selector Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stationScroll}
          >
            {OPERATIONAL_RADAR_STATIONS.map((stn) => {
              const active = station === stn.code;
              return (
                <Pressable
                  key={stn.code}
                  onPress={() => setStation(stn.code)}
                  style={[styles.stationChip, active && styles.stationChipActive]}
                >
                  <Text style={[styles.stationChipText, active && styles.stationChipTextActive]}>
                    {stn.name.split(" ")[0]}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: stn.status === "ONLINE" ? "#10B981" : "#F59E0B" },
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Product Selector Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {products.map((p) => {
              const active = product === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setProduct(p.id)}
                  style={[styles.productChip, active && styles.productChipActive]}
                >
                  <Text style={[styles.productChipText, active && styles.productChipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Radar Image Viewport */}
          <ScrollView contentContainerStyle={styles.bodyScroll}>
            <View style={styles.imageContainer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#06B6D4" />
                  <Text style={styles.loadingText}>Acquiring raw volumetric sweep...</Text>
                </View>
              )}

              {imageError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="warning" size={36} color="#F59E0B" />
                  <Text style={styles.errorTitle}>Radar Stream Calibration</Text>
                  <Text style={styles.errorDesc}>
                    {currentStation.name} is in routine sweep cycle. Switch to a primary operational hub:
                  </Text>
                  <View style={styles.fallbackRow}>
                    <Pressable
                      style={styles.fallbackBtn}
                      onPress={() => setStation("delhi")}
                    >
                      <Text style={styles.fallbackBtnText}>Delhi DWR</Text>
                    </Pressable>
                    <Pressable
                      style={styles.fallbackBtn}
                      onPress={() => setStation("hyd")}
                    >
                      <Text style={styles.fallbackBtnText}>Hyderabad DWR</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={styles.radarImage}
                  contentFit="contain"
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </View>

            {/* Station Specs */}
            <View style={styles.specsCard}>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>SURVEILLANCE RADIUS</Text>
                <Text style={styles.specVal}>{currentStation.rangeKm} km (QPE: 100 km)</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>FREQUENCY BAND</Text>
                <Text style={styles.specVal}>{currentStation.band}</Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>OPERATIONAL STATUS</Text>
                <Text style={[styles.specVal, { color: currentStation.status === "ONLINE" ? "#34D399" : "#FBBF24" }]}>
                  {currentStation.status}
                </Text>
              </View>
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>SYNCHRONIZATION</Text>
                <Text style={styles.specVal}>{lastCheckTime}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#070E1A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.3)",
    maxHeight: "92%",
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
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(6, 182, 212, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10B981",
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#34D399",
  },
  subtitle: {
    fontSize: 10,
    color: "#06B6D4",
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
  bannerWarn: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bannerWarnText: {
    fontSize: 10,
    color: "#FDE68A",
    flex: 1,
    lineHeight: 14,
  },
  stationScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "#08111F",
    borderBottomWidth: 1,
    borderBottomColor: "#152236",
  },
  stationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#101D30",
    borderWidth: 1,
    borderColor: "#1E3352",
  },
  stationChipActive: {
    backgroundColor: "rgba(6, 182, 212, 0.2)",
    borderColor: "#06B6D4",
  },
  stationChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  stationChipTextActive: {
    color: "#06B6D4",
    fontWeight: "900",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  productScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    backgroundColor: "#050C17",
    borderBottomWidth: 1,
    borderBottomColor: "#152236",
  },
  productChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#0E1828",
    borderWidth: 1,
    borderColor: "#192A44",
  },
  productChipActive: {
    backgroundColor: "rgba(6, 182, 212, 0.25)",
    borderColor: "#06B6D4",
  },
  productChipText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  productChipTextActive: {
    color: "#E2E8F0",
  },
  bodyScroll: {
    padding: 16,
    gap: 12,
  },
  imageContainer: {
    height: 330,
    borderRadius: 14,
    backgroundColor: "#020408",
    borderWidth: 1,
    borderColor: "#15243A",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  radarImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 11,
    color: "#06B6D4",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorBox: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },
  errorDesc: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  fallbackRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  fallbackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(6, 182, 212, 0.15)",
    borderWidth: 1,
    borderColor: "#06B6D4",
    borderRadius: 6,
  },
  fallbackBtnText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#06B6D4",
  },
  specsCard: {
    backgroundColor: "#0B1526",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#172A46",
    padding: 12,
    gap: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  specVal: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#E2E8F0",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
