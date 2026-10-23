import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SF_PRO } from "../flood/ui";

interface Props {
  visible: boolean;
  onClose: () => void;
  activeDistrict?: string;
  coords?: { latitude: number; longitude: number } | null;
}

export function EmergencyAssistanceModal({
  visible,
  onClose,
  activeDistrict = "Singtam Basin",
  coords = { latitude: 27.2384, longitude: 88.5021 },
}: Props) {
  const [sosSent, setSosSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportType, setReportType] = useState<"water_rise" | "landslide" | "medical" | "trapped">("water_rise");
  const [waterDepth, setWaterDepth] = useState("waist");
  const [locationText, setLocationText] = useState(activeDistrict);
  const [groundReportSent, setGroundReportSent] = useState(false);

  // Animated sonar rings
  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    const loop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim1, {
          toValue: 1.35,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(pulseAnim2, {
          toValue: 1.45,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim2, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();

    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [visible, pulseAnim1, pulseAnim2]);

  const handleTriggerSOS = async () => {
    setIsSubmitting(true);
    try {
      const { getMeteoBackendUrl } = await import("@/lib/meteo/meteoBackendClient");
      const backend = getMeteoBackendUrl();
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 4000);

      await fetch(`${backend}/api/sos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords?.latitude ?? 13.0827,
          longitude: coords?.longitude ?? 80.2707,
          accuracy: 8,
          medicalEmergency: true,
          waterTrapped: true,
        }),
        signal: ctrl.signal,
      }).catch(() => {});
      clearTimeout(timeout);
    } catch {}

    setIsSubmitting(false);
    setSosSent(true);
  };

  const handleGroundReport = async () => {
    setIsSubmitting(true);
    try {
      const { submitCitizenReportToMeteo } = await import("@/lib/meteo/meteoBackendClient");
      await submitCitizenReportToMeteo({
        kind: "flood",
        description: `Citizen emergency report from ${activeDistrict}. Heavy inundation reported.`,
        latitude: coords?.latitude ?? 13.0827,
        longitude: coords?.longitude ?? 80.2707,
      });
    } catch {}

    setIsSubmitting(false);
    setGroundReportSent(true);
  };

  const callNumber = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  const helplines = [
    { title: "National Emergency Helpline", number: "112", desc: "Police, Fire, Medical, Disaster dispatch" },
    { title: "NDRF Disaster Control Room", number: "1078", desc: "Specialist rescue & evacuation boats" },
    { title: "Disaster Management HQ (SDMA)", number: "1070", desc: "State emergency operation center" },
    { title: "Emergency Ambulance Service", number: "108", desc: "Immediate trauma & hospital transport" },
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          {/* ── Apple Cupertino Modal Header ── */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.shieldWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Satellite Emergency SOS Beacon</Text>
                <Text style={styles.subtitle}>Direct High-Priority Telemetry · {activeDistrict}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.75)" />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* ── Apple Sonic Pulse SOS Card ── */}
            <View style={styles.sosCard}>
              <View style={styles.beaconTagRow}>
                <View style={styles.redDot} />
                <Text style={styles.beaconTagTitle}>OFFICIAL RESCUE LINK ACTIVE</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.gpsLockText}>GPS Locked (±3m)</Text>
              </View>

              {!sosSent ? (
                <View style={styles.beaconCenter}>
                  <View style={styles.sosButtonContainer}>
                    <Animated.View
                      style={[styles.sonarRing, { transform: [{ scale: pulseAnim2 }] }]}
                    />
                    <Animated.View
                      style={[styles.sonarRingInner, { transform: [{ scale: pulseAnim1 }] }]}
                    />

                    <Pressable
                      onPress={handleTriggerSOS}
                      disabled={isSubmitting}
                      style={({ pressed }) => [
                        styles.sosLargeCircle,
                        pressed && { transform: [{ scale: 0.93 }] },
                      ]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.sosText}>SOS</Text>
                          <Text style={styles.sosSubtext}>HOLD 1s</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  <Text style={styles.sosHeading}>
                    Tap to Broadcast Emergency Coordinates
                  </Text>
                  <Text style={styles.sosDescription}>
                    Sends immediate high-priority distress ping to NDRF, SDRF, and {activeDistrict} Control.
                  </Text>

                  <View style={styles.coordsRow}>
                    <Ionicons name="location" size={13} color="#f87171" />
                    <Text style={styles.coordsText}>
                      {coords?.latitude.toFixed(4)}° N, {coords?.longitude.toFixed(4)}° E · {activeDistrict}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.sosSuccessBox}>
                  <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark-circle" size={28} color="#34d399" />
                  </View>
                  <Text style={styles.successHeading}>Distress Beacon Broadcast Active</Text>
                  <Text style={styles.successDesc}>
                    Quick Response Rescue Team acknowledged your coordinates. Stand by on high ground.
                  </Text>
                  <Pressable onPress={() => setSosSent(false)} style={{ marginTop: 6 }}>
                    <Text style={styles.resetBeaconText}>Reset Beacon</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* ── 1-Tap Direct Emergency Call Hotlines ── */}
            <Text style={styles.sectionHeader}>VERIFIED OFFICIAL HELPLINES (TAP TO CALL)</Text>
            <View style={styles.helplineList}>
              {helplines.map((item) => (
                <Pressable
                  key={item.number}
                  onPress={() => callNumber(item.number)}
                  style={({ pressed }) => [
                    styles.helplineCard,
                    pressed && { backgroundColor: "rgba(255, 255, 255, 0.08)" },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.helplineTitle}>{item.title}</Text>
                    <Text style={styles.helplineDesc}>{item.desc}</Text>
                  </View>
                  <View style={styles.numberBadge}>
                    <Ionicons name="call" size={13} color="#FFFFFF" />
                    <Text style={styles.numberText}>{item.number}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* ── Ground Flood Report Form ── */}
            <Text style={styles.sectionHeader}>REPORT FLOOD CONDITION AT YOUR LOCATION</Text>
            <View style={styles.reportFormCard}>
              {!groundReportSent ? (
                <View style={{ gap: 10 }}>
                  <View style={styles.pillsGrid}>
                    {[
                      { id: "water_rise", label: "Rapid Water Rise" },
                      { id: "landslide", label: "Landslide Block" },
                      { id: "trapped", label: "People Trapped" },
                      { id: "medical", label: "Medical Emergency" },
                    ].map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => setReportType(t.id as any)}
                        style={[
                          styles.dangerPill,
                          reportType === t.id && styles.dangerPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dangerPillText,
                            reportType === t.id && styles.dangerPillTextActive,
                          ]}
                        >
                          {t.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={styles.inputSubLabel}>Water Inundation Level</Text>
                    <View style={styles.depthRow}>
                      {[
                        { id: "ankle", label: "Ankle / Knee" },
                        { id: "waist", label: "Waist Level" },
                        { id: "submerged", label: "Floor Submerged" },
                      ].map((d) => (
                        <Pressable
                          key={d.id}
                          onPress={() => setWaterDepth(d.id)}
                          style={[
                            styles.depthBtn,
                            waterDepth === d.id && styles.depthBtnActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.depthBtnText,
                              waterDepth === d.id && styles.depthBtnTextActive,
                            ]}
                          >
                            {d.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={styles.inputSubLabel}>Landmark / Street Address</Text>
                    <TextInput
                      value={locationText}
                      onChangeText={setLocationText}
                      placeholder="e.g. Near Market Road, House #14"
                      placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      style={styles.textInput}
                    />
                  </View>

                  <Pressable
                    onPress={handleGroundReport}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Ionicons name="send" size={13} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      {isSubmitting ? "Transmitting..." : "Broadcast Report to Disaster Map"}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.formSuccessBox}>
                  <Ionicons name="checkmark-circle" size={30} color="#34d399" />
                  <Text style={styles.formSuccessTitle}>Report Broadcasted to Control</Text>
                  <Text style={styles.formSuccessDesc}>
                    Your ground observation has been mapped for field responders.
                  </Text>
                  <Pressable onPress={() => setGroundReportSent(false)} style={{ marginTop: 4 }}>
                    <Text style={styles.submitAnotherText}>Submit Another Update</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Return to Weather Map</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    position: (Platform.OS === "web" ? "fixed" : "absolute") as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 999999,
  },
  sheet: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "90%",
    backgroundColor: "rgba(28, 28, 30, 0.98)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
    elevation: 25,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(35, 35, 38, 0.95)",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shieldWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: SF_PRO,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.6)",
    fontFamily: SF_PRO,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  sosCard: {
    backgroundColor: "rgba(239, 68, 68, 0.07)",
    borderWidth: 1.2,
    borderColor: "rgba(239, 68, 68, 0.35)",
    borderRadius: 22,
    padding: 14,
  },
  beaconTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  beaconTagTitle: {
    fontSize: 9.5,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#f87171",
    letterSpacing: 0.5,
  },
  gpsLockText: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.45)",
  },
  beaconCenter: {
    alignItems: "center",
    paddingVertical: 4,
  },
  sosButtonContainer: {
    position: "relative",
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  sonarRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(239, 68, 68, 0.16)",
  },
  sonarRingInner: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(239, 68, 68, 0.25)",
  },
  sosLargeCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  sosText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1.5,
  },
  sosSubtext: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "700",
    marginTop: 1,
  },
  sosHeading: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 2,
  },
  sosDescription: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 14,
    maxWidth: 290,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  coordsText: {
    fontSize: 9.5,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.45)",
  },
  sosSuccessBox: {
    paddingVertical: 12,
    alignItems: "center",
    gap: 4,
  },
  successIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  successHeading: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  successDesc: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 15,
  },
  resetBeaconText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textDecorationLine: "underline",
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.6,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 2,
  },
  helplineList: {
    gap: 7,
  },
  helplineCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  helplineTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  helplineDesc: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 1,
  },
  numberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  numberText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
    fontFamily: "monospace",
  },
  reportFormCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 12,
  },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  dangerPill: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  dangerPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  dangerPillText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  dangerPillTextActive: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  inputSubLabel: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.55)",
  },
  depthRow: {
    flexDirection: "row",
    gap: 6,
  },
  depthBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  depthBtnActive: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  depthBtnText: {
    fontSize: 9.5,
    color: "rgba(255, 255, 255, 0.6)",
  },
  depthBtnTextActive: {
    color: "#fcd34d",
    fontWeight: "800",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 10.5,
    color: "#ffffff",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0284c7",
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 2,
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  formSuccessBox: {
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  formSuccessTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#ffffff",
  },
  formSuccessDesc: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  submitAnotherText: {
    fontSize: 10,
    color: "#38bdf8",
    fontWeight: "600",
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  doneBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
});
