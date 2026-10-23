import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ReportComposer } from "@/components/flood/ReportComposer";
import { ActionButton, C, Card, LiveFeedBadge, SectionTitle, SF_PRO } from "@/components/flood/ui";
import { CHENNAI_CENTER } from "@/lib/flood/demo-data";
import { useFlood } from "@/lib/flood/FloodProvider";
import { copy } from "@/lib/i18n/copy";
import type { ReportKind } from "@/lib/flood/types";
import { ReactBitsBackground } from "@/components/meteo/ReactBitsBackground";

import { EmergencyAssistanceModal } from "@/components/meteo/EmergencyAssistanceModal";

const reportIcon: Record<ReportKind, keyof typeof Ionicons.glyphMap> = {
  flood: "water",
  stuck: "warning",
  medical: "medkit",
  infrastructure: "construct",
};
const reportLabel: Record<ReportKind, "typeFlood" | "typeStuck" | "typeMedical" | "typeInfrastructure"> = {
  flood: "typeFlood",
  stuck: "typeStuck",
  medical: "typeMedical",
  infrastructure: "typeInfrastructure",
};

export default function ReportsScreen() {
  const { language, reports, addReport, requestMapPin } = useFlood();
  const router = useRouter();
  const t = (key: Parameters<typeof copy>[1]) => copy(language, key);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<ReportKind>("flood");
  const [composerSession, setComposerSession] = useState(0);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const openComposer = (kind: ReportKind) => {
    setComposerKind(kind);
    setComposerSession((current) => current + 1);
    setComposerOpen(true);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ReactBitsBackground />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>METEO-GIS · CITIZEN INCIDENT DESK</Text>
          <Text style={styles.title}>{t("reports")}</Text>
          <Text style={styles.subtitle}>{t("reportsIntro")}</Text>
        </View>

        <LiveFeedBadge label={t("demo")} />

        {/* ── Apple-Style Emergency SOS Beacon Hero Card ── */}
        <Card style={styles.helpCard} variant="urgent">
          <View style={styles.sosBeaconHeader}>
            <View style={styles.beaconPill}>
              <View style={styles.liveRedDot} />
              <Text style={styles.beaconPillText}>SATELLITE EMERGENCY BEACON</Text>
            </View>
            <Text style={styles.beaconGpsText}>GPS LOCKED (±3m)</Text>
          </View>

          <View style={styles.helpHeader}>
            <View style={styles.helpIconWrap}>
              <Ionicons name="radio" size={24} color="#FF453A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpTitle}>Emergency SOS Broadcast</Text>
              <Text style={styles.helpCopy}>
                One-tap priority distress ping to NDRF, SDRF, and Emergency Operations.
              </Text>
            </View>
          </View>

          {/* Large Apple SOS Trigger Action */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trigger Emergency SOS Beacon"
            onPress={() => setEmergencyModalOpen(true)}
            style={({ pressed }) => [
              styles.sosTriggerBtn,
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
            ]}
          >
            <View style={styles.sosPulseRing} />
            <Ionicons name="warning" size={18} color="#FFFFFF" />
            <Text style={styles.sosTriggerBtnText}>OPEN EMERGENCY SOS BEACON</Text>
          </Pressable>

          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark" color="#FFD60A" size={15} />
            <Text style={styles.safetyText}>
              Includes 1-tap verified calls to 112 (National Disaster) & 1078 (NDRF Control).
            </Text>
          </View>
        </Card>

        {/* Infrastructure Damage Action Tile */}
        <Pressable
          onPress={() => openComposer("infrastructure")}
          style={({ pressed }) => [styles.damageCard, pressed && styles.pressed]}
        >
          <View style={styles.damageIcon}>
            <Ionicons name="construct" size={18} color={C.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.damageTitle}>{t("damageTitle")}</Text>
            <Text style={styles.damageSub}>{t("damageSubtitle")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.dim} />
        </Pressable>

        {/* Active Local Reports Feed */}
        <SectionTitle title={t("activeReports")} trailing={`${reports.length} SAVED`} />
        {reports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={28} color={C.dim} />
            </View>
            <Text style={styles.emptyTitle}>{t("reportsEmpty")}</Text>
            <Text style={styles.emptyCopy}>{t("localOnly")}</Text>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} style={styles.reportCard}>
              <View style={styles.reportTop}>
                <View style={styles.reportIcon}>
                  <Ionicons name={reportIcon[report.kind]} size={16} color={C.coral} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reportKind}>{t(reportLabel[report.kind])}</Text>
                  <Text style={styles.reportTime}>{new Date(report.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {new Date(report.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.localPill}>
                  <View style={styles.localDot} />
                  <Text style={styles.localPillText}>{t("localSaved")}</Text>
                </View>
              </View>

              <Text style={styles.description}>{report.description}</Text>

              <View style={styles.locationRow}>
                <Ionicons name="location" size={13} color={C.blue} />
                <Text style={styles.locationText}>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</Text>
                <Text style={styles.sampleHint}>· VERIFIED GPS PIN</Text>
              </View>

              {report.photoUri ? (
                <Image source={{ uri: report.photoUri }} style={styles.thumbnail} />
              ) : null}

              <View style={styles.statusLine}>
                <Ionicons name="phone-portrait-outline" size={13} color={C.dim} />
                <Text style={styles.statusText}>{t("reportStatus")}: {report.status}. {t("noDispatch")}</Text>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      <ReportComposer
        key={composerSession}
        initialDraft={{ kind: composerKind, description: "" }}
        visible={composerOpen}
        location={CHENNAI_CENTER}
        onClose={() => setComposerOpen(false)}
        onPickLocation={(draft) => {
          setComposerOpen(false);
          requestMapPin(draft);
          router.navigate("/(tabs)");
        }}
        onSave={(value) => {
          addReport(value);
          setComposerOpen(false);
        }}
      />

      <EmergencyAssistanceModal
        visible={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000000", position: "relative", fontFamily: SF_PRO },
  screen: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 16, paddingTop: 12, gap: 14 },
  header: { gap: 2, marginBottom: 2 },
  eyebrow: { color: "#0A84FF", fontSize: 10, fontWeight: "700", letterSpacing: 1.2, fontFamily: SF_PRO },
  title: { color: C.text, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8, marginTop: 4, fontFamily: SF_PRO },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 2, fontFamily: SF_PRO },
  helpCard: { gap: 12, borderColor: "rgba(255, 69, 58, 0.32)", backgroundColor: "rgba(28, 28, 30, 0.92)", borderRadius: 20 },
  sosBeaconHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  beaconPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255, 69, 58, 0.16)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  liveRedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FF453A" },
  beaconPillText: { color: "#FF453A", fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5, fontFamily: SF_PRO },
  beaconGpsText: { color: "rgba(255, 255, 255, 0.5)", fontSize: 9.5, fontWeight: "600", fontFamily: SF_PRO },
  helpHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  helpIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255, 69, 58, 0.18)" },
  helpTitle: { color: C.text, fontSize: 18, lineHeight: 23, fontWeight: "700", letterSpacing: -0.4, fontFamily: SF_PRO },
  helpCopy: { color: C.muted, fontSize: 12, lineHeight: 16, marginTop: 2, fontFamily: SF_PRO },
  sosTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF453A",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    boxShadow: "0 4px 18px rgba(255, 69, 58, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.35)",
  },
  sosPulseRing: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" },
  sosTriggerBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 0.5, fontFamily: SF_PRO },
  safetyNote: { flexDirection: "row", gap: 8, alignItems: "center", padding: 10, borderRadius: 12, backgroundColor: "rgba(255, 214, 10, 0.1)", borderWidth: 1, borderColor: "rgba(255, 214, 10, 0.25)" },
  safetyText: { color: C.amber, fontSize: 11, lineHeight: 15, flex: 1, fontWeight: "500" },
  damageCard: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  damageIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255, 159, 10, 0.16)", alignItems: "center", justifyContent: "center" },
  damageTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  damageSub: { color: C.muted, fontSize: 11, lineHeight: 15, marginTop: 2 },
  emptyCard: { alignItems: "center", gap: 8, paddingVertical: 28 },
  emptyIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255, 255, 255, 0.06)", alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: C.text, fontWeight: "600", fontSize: 15 },
  emptyCopy: { color: C.muted, fontSize: 12, textAlign: "center" },
  reportCard: { gap: 10 },
  reportTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  reportIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(255, 69, 58, 0.18)", alignItems: "center", justifyContent: "center" },
  reportKind: { color: C.text, fontWeight: "700", fontSize: 14 },
  reportTime: { color: C.dim, fontSize: 11, marginTop: 1 },
  localPill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, backgroundColor: "rgba(48, 209, 88, 0.16)", borderWidth: 1, borderColor: "rgba(48, 209, 88, 0.3)", paddingHorizontal: 8, paddingVertical: 4 },
  localDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.green },
  localPillText: { color: C.green, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  description: { color: C.text, fontSize: 14, lineHeight: 19 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationText: { color: C.muted, fontSize: 11, fontWeight: "500" },
  sampleHint: { color: "#30D158", fontSize: 9.5, fontWeight: "700" },
  thumbnail: { width: 80, height: 80, borderRadius: 12, marginTop: 4 },
  statusLine: { flexDirection: "row", alignItems: "center", gap: 6, borderTopColor: "rgba(255, 255, 255, 0.08)", borderTopWidth: 1, paddingTop: 8 },
  statusText: { color: C.dim, flex: 1, fontSize: 11, lineHeight: 15 },
});
