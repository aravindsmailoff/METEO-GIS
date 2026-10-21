import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { AceternityCard } from "./AceternityCard";

export function CitizenReportPanel() {
  const [sosSent, setSosSent] = useState(false);
  const [reportType, setReportType] = useState<"water_rise" | "landslide" | "medical" | "trapped">("water_rise");
  const [waterDepth, setWaterDepth] = useState("waist");
  const [locationText, setLocationText] = useState("Singtam Bazaar, Lower Ward 3");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleTriggerSOS = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSosSent(true);
    }, 1100);
  };

  const handleCitizenSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReportSubmitted(true);
    }, 900);
  };

  const callNumber = (num: string) => {
    Linking.openURL(`tel:${num}`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* ── Apple-Style Emergency SOS Beacon Card ── */}
      <AceternityCard glowColor="rgba(239, 68, 68, 0.3)" style={{ padding: 14 }}>
        <View style={styles.beaconHeader}>
          <View style={styles.beaconTagGroup}>
            <View style={styles.redDot} />
            <Text style={styles.beaconTitle}>SATELLITE EMERGENCY BEACON</Text>
          </View>
          <Text style={styles.gpsLockText}>GPS Locked (±3m)</Text>
        </View>

        {!sosSent ? (
          <View style={styles.beaconBody}>
            {/* Sonic Pulse SOS Button */}
            <View style={styles.sosButtonContainer}>
              <View style={styles.sonarRing1} />
              <View style={styles.sonarRing2} />

              <Pressable
                onPress={handleTriggerSOS}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.sosLargeCircle,
                  pressed && { transform: [{ scale: 0.94 }] },
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
              Sends immediate high-priority distress ping to NDRF, SDRF, and Singtam District Control.
            </Text>

            <View style={styles.coordsRow}>
              <Ionicons name="location" size={13} color="#f87171" />
              <Text style={styles.coordsText}>
                27.2384° N, 88.5021° E (Singtam Basin)
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.sosSuccessBox}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={26} color="#34d399" />
            </View>
            <Text style={styles.successHeading}>
              Distress Beacon Broadcast Active
            </Text>
            <Text style={styles.successDesc}>
              SDRF Quick Response Boat Unit #3 acknowledged your coordinates. Estimated arrival: 14 minutes.
            </Text>
            <Pressable onPress={() => setSosSent(false)} style={{ marginTop: 6 }}>
              <Text style={styles.resetBeaconText}>Reset Beacon</Text>
            </Pressable>
          </View>
        )}
      </AceternityCard>

      {/* ── Direct Emergency Hotlines ── */}
      <View style={styles.hotlinesRow}>
        {/* 112 */}
        <Pressable
          onPress={() => callNumber("112")}
          style={({ pressed }) => [
            styles.hotlineCard,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.hotlineIcon, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
            <Ionicons name="call" size={15} color="#ef4444" />
          </View>
          <Text style={styles.hotlineNumber}>112</Text>
          <Text style={styles.hotlineLabel}>NATIONAL SOS</Text>
        </Pressable>

        {/* 1077 */}
        <Pressable
          onPress={() => callNumber("1077")}
          style={({ pressed }) => [
            styles.hotlineCard,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.hotlineIcon, { backgroundColor: "rgba(56, 189, 248, 0.2)" }]}>
            <Ionicons name="call" size={15} color="#38bdf8" />
          </View>
          <Text style={styles.hotlineNumber}>1077</Text>
          <Text style={styles.hotlineLabel}>DISASTER HQ</Text>
        </Pressable>

        {/* 108 */}
        <Pressable
          onPress={() => callNumber("108")}
          style={({ pressed }) => [
            styles.hotlineCard,
            pressed && { opacity: 0.8 },
          ]}
        >
          <View style={[styles.hotlineIcon, { backgroundColor: "rgba(34, 197, 94, 0.2)" }]}>
            <Ionicons name="call" size={15} color="#22c55e" />
          </View>
          <Text style={styles.hotlineNumber}>108</Text>
          <Text style={styles.hotlineLabel}>AMBULANCE</Text>
        </Pressable>
      </View>

      {/* ── Citizen Ground Flood Report Form ── */}
      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            Report Flood Condition at Your Location
          </Text>
          <Text style={styles.formBadge}>Real-Time Crowdsource</Text>
        </View>

        {!reportSubmitted ? (
          <View style={styles.formBody}>
            {/* Danger Type Pills */}
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

            {/* Inundation Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Water Inundation Level</Text>
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

            {/* Location Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Specific Landmark or Address</Text>
              <TextInput
                value={locationText}
                onChangeText={setLocationText}
                placeholder="e.g. Near Singtam Police Station, House #14"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                style={styles.textInput}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleCitizenSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="send" size={14} color="#ffffff" />
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? "Transmitting Alert..."
                  : "Broadcast Ground Report to Map"}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.formSuccessBox}>
            <Ionicons name="checkmark-circle" size={32} color="#34d399" />
            <Text style={styles.formSuccessTitle}>Ground Report Broadcasted</Text>
            <Text style={styles.formSuccessDesc}>
              Your report has been marked on the public emergency map for disaster response teams.
            </Text>
            <Pressable
              onPress={() => setReportSubmitted(false)}
              style={{ marginTop: 4 }}
            >
              <Text style={styles.submitAnotherText}>Submit Another Update</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  beaconHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  beaconTagGroup: {
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
  beaconTitle: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "#f87171",
    letterSpacing: 0.6,
  },
  gpsLockText: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.45)",
  },
  beaconBody: {
    alignItems: "center",
    paddingVertical: 4,
  },
  sosButtonContainer: {
    position: "relative",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  sonarRing1: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(239, 68, 68, 0.18)",
  },
  sonarRing2: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(239, 68, 68, 0.28)",
  },
  sosLargeCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  sosText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 1.5,
  },
  sosSubtext: {
    fontSize: 8,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginTop: 1,
  },
  sosHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 2,
  },
  sosDescription: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 3,
    maxWidth: 280,
    lineHeight: 15,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  coordsText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.45)",
  },
  sosSuccessBox: {
    paddingVertical: 12,
    alignItems: "center",
    gap: 6,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  successHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  successDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 16,
  },
  resetBeaconText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textDecorationLine: "underline",
  },
  hotlinesRow: {
    flexDirection: "row",
    gap: 8,
  },
  hotlineCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    gap: 3,
  },
  hotlineIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  hotlineNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  hotlineLabel: {
    fontSize: 8,
    fontFamily: "monospace",
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.45)",
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 20,
    padding: 14,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  formBadge: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "#38bdf8",
  },
  formBody: {
    gap: 12,
  },
  pillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dangerPill: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  dangerPillActive: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  dangerPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
  },
  dangerPillTextActive: {
    color: "#38bdf8",
    fontWeight: "800",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
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
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
  },
  depthBtnActive: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  depthBtnText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  depthBtnTextActive: {
    color: "#fcd34d",
    fontWeight: "800",
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 11,
    color: "#ffffff",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  formSuccessBox: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  formSuccessTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  formSuccessDesc: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 16,
  },
  submitAnotherText: {
    fontSize: 11,
    color: "#38bdf8",
    fontWeight: "600",
  },
});
