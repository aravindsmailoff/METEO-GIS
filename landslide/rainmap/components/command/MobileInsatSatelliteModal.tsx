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

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function MobileInsatSatelliteModal({ visible, onClose }: Props) {
  const [channel, setChannel] = useState<"ir1" | "ctbt" | "vis">("ir1");
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [nonce, setNonce] = useState(Date.now());
  const [lastCheckTime, setLastCheckTime] = useState("");

  const backendUrl = getMeteoBackendUrl();

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
  }, [visible, channel]);

  const channelInfo = {
    ir1: {
      title: "TIR-1 (Thermal Infrared 10.8 µm)",
      subtitle: "INSAT-3DS / 3DR Geostationary Payload L1C",
      desc: "Measures cloud-top thermal radiation day & night. Highlights convective updrafts & severe storm anvils.",
    },
    ctbt: {
      title: "CTBT (Cloud Top Temp °C)",
      subtitle: "INSAT-3DR Derived Product",
      desc: "Calibrated brightness temperature scale indicating cloud top heights and deep convection glaciation.",
    },
    vis: {
      title: "VIS (Visible Spectrum 0.65 µm)",
      subtitle: "INSAT-3DR Day-Only Optical Imagery",
      desc: "High-resolution daytime optical reflection showing low, middle, and high cloud morphology.",
    },
  };

  const current = channelInfo[channel];
  const imageUrl = `${backendUrl}/api/imd/imagery?type=satellite&channel=${channel}&_t=${nonce}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCapsule}>
                <Ionicons name="planet" size={18} color="#A855F7" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>INSAT-3DR GEOSTATIONARY SATELLITE</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveText}>LIVE STREAM</Text>
                  </View>
                </View>
                <Text style={styles.subtitle}>
                  ISRO MOSDAC / IMD • Updated {lastCheckTime}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close satellite modal">
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Channel Selector */}
          <View style={styles.selectorRow}>
            {(["ir1", "ctbt", "vis"] as const).map((ch) => {
              const active = channel === ch;
              return (
                <Pressable
                  key={ch}
                  onPress={() => setChannel(ch)}
                  style={[styles.channelBtn, active && styles.channelBtnActive]}
                >
                  <Text style={[styles.channelBtnText, active && styles.channelBtnTextActive]}>
                    {ch.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => {
                setLoading(true);
                setImageError(false);
                setNonce(Date.now());
              }}
              style={styles.refreshBtn}
            >
              <Ionicons name="refresh" size={15} color="#38BDF8" />
            </Pressable>
          </View>

          {/* Satellite Image Viewport */}
          <ScrollView contentContainerStyle={styles.bodyScroll}>
            <View style={styles.imageContainer}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#38BDF8" />
                  <Text style={styles.loadingText}>Streaming INSAT-3DR Geostationary Feed...</Text>
                </View>
              )}

              {imageError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="cloud-offline" size={36} color="#F59E0B" />
                  <Text style={styles.errorTitle}>Satellite Feed Buffering</Text>
                  <Text style={styles.errorDesc}>
                    ISRO MOSDAC downlink in 20-minute cycle. Connecting to regional ground station cache.
                  </Text>
                  <Pressable
                    style={styles.retryBtn}
                    onPress={() => {
                      setImageError(false);
                      setLoading(true);
                      setNonce(Date.now());
                    }}
                  >
                    <Text style={styles.retryBtnText}>Retry Connection</Text>
                  </Pressable>
                </View>
              ) : (
                <ExpoImage
                  source={{ uri: imageUrl }}
                  style={styles.satImage}
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

            {/* Telemetry info card */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>{current.title}</Text>
              <Text style={styles.infoSub}>{current.subtitle}</Text>
              <Text style={styles.infoDesc}>{current.desc}</Text>
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
    borderColor: "rgba(56, 189, 248, 0.3)",
    maxHeight: "88%",
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
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
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
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#091322",
    borderBottomWidth: 1,
    borderBottomColor: "#172338",
  },
  channelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#111C2E",
    borderWidth: 1,
    borderColor: "#1E304B",
    alignItems: "center",
  },
  channelBtnActive: {
    backgroundColor: "rgba(56, 189, 248, 0.2)",
    borderColor: "#38BDF8",
  },
  channelBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  channelBtnTextActive: {
    color: "#38BDF8",
    fontWeight: "900",
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#111C2E",
    borderWidth: 1,
    borderColor: "#1E304B",
  },
  bodyScroll: {
    padding: 16,
    gap: 14,
  },
  imageContainer: {
    height: 320,
    borderRadius: 14,
    backgroundColor: "#03060C",
    borderWidth: 1,
    borderColor: "#1A2B42",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  satImage: {
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
    color: "#94A3B8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorBox: {
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },
  errorDesc: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 16,
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderWidth: 1,
    borderColor: "#38BDF8",
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
  },
  infoCard: {
    backgroundColor: "#0B1526",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1A2E4C",
    padding: 14,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  infoSub: {
    fontSize: 10.5,
    color: "#38BDF8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginTop: 2,
  },
  infoDesc: {
    fontSize: 11,
    color: "#94A3B8",
    lineHeight: 16,
    marginTop: 6,
  },
});
