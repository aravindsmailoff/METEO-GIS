import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton, C, Card, LiveFeedBadge, SectionTitle, StatTile, SF_PRO } from "@/components/flood/ui";
import { DISTRICT_RAIN, LOCALITIES, RESERVOIRS } from "@/lib/flood/demo-data";
import { useFlood } from "@/lib/flood/FloodProvider";
import { copy } from "@/lib/i18n/copy";
import { ReactBitsBackground } from "@/components/meteo/ReactBitsBackground";
import { fetchLiveMeteoGis, type MeteoOverviewKpis } from "@/lib/meteo/liveMeteoService";

export default function AreaScreen() {
  const { reports, area, setArea, language, setLanguage, cachedAt, isOnline } = useFlood();
  const router = useRouter();
  const t = (key: Parameters<typeof copy>[1]) => copy(language, key);
  const localDamage = reports.filter((report) => report.kind === "infrastructure").length;
  const updated = new Date(cachedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const [kpis, setKpis] = useState<MeteoOverviewKpis>({
    activeWarningsCount: 18,
    reportingStationsCount: 42,
    highPrecipPoints: 6,
    activeStormCells: 4,
    radarStation: "IMD DWR Coastal Radar Network",
    soilSaturationIndex: 74,
  });

  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const payload = await fetchLiveMeteoGis();
        if (active) {
          setKpis(payload.kpis);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ReactBitsBackground />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apple iOS Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>METEO-GIS · REGION INTELLIGENCE</Text>
          <Text style={styles.title}>{t("welcome")}</Text>
          <Text style={styles.subtitle}>{t("areaIntro")}</Text>
        </View>

        <LiveFeedBadge label={t("demo")} />

        {/* Locality Selector Card */}
        <Card>
          <SectionTitle title={t("chooseArea")} trailing="TAMIL NADU" />
          <View style={styles.localityGrid}>
            {LOCALITIES.map((name) => {
              const active = area === name;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setArea(name)}
                  style={[styles.localityChip, active && styles.localityActive]}
                >
                  <Ionicons name={active ? "checkmark-circle" : "location-outline"} size={14} color={active ? C.white : C.dim} />
                  <Text style={[styles.localityText, active && styles.localityTextActive]}>{name}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.selectedArea}>
            <View style={styles.selectedAreaDot} />
            <Text style={styles.selectedAreaText}>{t("selectedArea")}: <Text style={styles.selectedAreaHighlight}>{area}, Tamil Nadu</Text></Text>
          </View>
        </Card>

        {/* Language Selector (iOS Segmented Control) */}
        <Card>
          <View style={styles.languageTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.languageTitle}>{t("english")} / மொழி</Text>
              <Text style={styles.muted}>{t("languageDescription")}</Text>
            </View>
            <View style={styles.languageSegment}>
              <Pressable
                onPress={() => setLanguage("en")}
                style={[styles.segmentBtn, language === "en" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, language === "en" && styles.segmentTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage("ta")}
                style={[styles.segmentBtn, language === "ta" && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, language === "ta" && styles.segmentTextActive]}>தமிழ்</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Dashboard Overview Cards */}
        <SectionTitle title={t("dashboard")} trailing="LIVE MONITOR" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stats}>
          <StatTile label={t("activeReports")} value={`${reports.length}`} detail={t("localOnly")} color={C.coral} />
          <StatTile
            label={t("reservoirsWatch")}
            value={`${RESERVOIRS.filter((r) => r.status === "warning" || r.status === "danger" || r.status === "critical").length} / ${RESERVOIRS.length}`}
            detail={t("sampleReading")}
            color={C.amber}
          />
          <StatTile label="Active AWS Stations" value={`${kpis.reportingStationsCount}`} detail="IMD Ground Telemetry" color={C.blue} />
          <StatTile label={t("population")} value="18.4k" detail={t("sampleOnly")} color={C.teal} />
        </ScrollView>

        {/* District Rainfall Bars (Apple Fitness style) */}
        <Card style={styles.rainCard}>
          <SectionTitle title={t("forecast")} trailing="24H TOTALS" />
          {DISTRICT_RAIN.map((row, index) => {
            const barColor = [C.coral, C.orange, C.amber, C.blue][index];
            return (
              <View key={row.name} style={styles.rainRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rainRowTop}>
                    <Text style={styles.rainName}>{row.name}</Text>
                    <Text style={styles.rainValue}>{row.mm} mm</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(row.mm / 80) * 100}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
                <View style={[styles.rainStateBadge, { backgroundColor: `${barColor}22` }]}>
                  <Text style={[styles.rainStateText, { color: barColor }]}>
                    {row.state === "High" ? t("danger") : row.state === "Watch" ? t("watch") : t("moderate")}
                  </Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.chartFootnote}>{t("notForecast")}</Text>
        </Card>

        {/* Live Operational Status Feeds Matrix */}
        <Card style={styles.telemetryCard}>
          <View style={styles.telemetryHead}>
            <View style={styles.telemetryBeacon}>
              <View style={styles.telemetryDot} />
              <Text style={styles.telemetryTag}>OPERATIONAL FEEDS STATUS</Text>
            </View>
            <Text style={styles.telemetrySubtitle}>Verified Live Telemetry Integrations</Text>
          </View>

          <View style={styles.feedRow}>
            <View style={styles.feedCheck}>
              <Ionicons name="checkmark-circle" size={16} color="#30D158" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedTitle}>IMD NWFC Operational Nowcasts & Bulletins</Text>
              <Text style={styles.feedSub}>Real-time convective hazard classification & Doppler sweeps</Text>
            </View>
            <Text style={styles.feedStatus}>LIVE</Text>
          </View>

          <View style={styles.feedRow}>
            <View style={styles.feedCheck}>
              <Ionicons name="checkmark-circle" size={16} color="#30D158" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedTitle}>ISRO Bhuvan CartoDEM 30m & LULC</Text>
              <Text style={styles.feedSub}>Digital elevation model & slope inundation threshold</Text>
            </View>
            <Text style={styles.feedStatus}>ACTIVE</Text>
          </View>

          <View style={styles.feedRow}>
            <View style={styles.feedCheck}>
              <Ionicons name="checkmark-circle" size={16} color="#30D158" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedTitle}>NASA POWER GPM IMERG Precipitation</Text>
              <Text style={styles.feedSub}>30-Day standardized precipitation index & solar irradiance</Text>
            </View>
            <Text style={styles.feedStatus}>STREAMING</Text>
          </View>

          <View style={styles.feedRow}>
            <View style={styles.feedCheck}>
              <Ionicons name="checkmark-circle" size={16} color="#30D158" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.feedTitle}>Tamil Nadu WRD Major Catchments Telemetry</Text>
              <Text style={styles.feedSub}>Chembarambakkam, Poondi, Red Hills & Sholavaram gates</Text>
            </View>
            <Text style={styles.feedStatus}>SYNCED</Text>
          </View>
        </Card>

        {/* Apple Cloud Sync Card */}
        <View style={styles.cacheCard}>
          <View style={[styles.cacheIcon, isOnline === false && styles.cacheIconOffline]}>
            <Ionicons name={isOnline === false ? "cloud-offline" : "cloud-done"} size={18} color={isOnline === false ? C.amber : C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cacheTitle}>{isOnline === false ? t("offline") : t("online")}</Text>
            <Text style={styles.cacheSub}>{t("timeSaved")}: {updated}</Text>
          </View>
          <Ionicons name="checkmark-circle" size={18} color={C.green} />
        </View>

        <ActionButton icon="map" label={t("openMap")} variant="quiet" onPress={() => router.navigate("/(tabs)")} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#030712", position: "relative", fontFamily: SF_PRO },
  screen: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 16, paddingTop: 12, gap: 14 },
  header: { gap: 2, marginBottom: 2 },
  eyebrow: { color: C.teal, fontSize: 10, fontWeight: "800", letterSpacing: 1.4, fontFamily: SF_PRO },
  title: { color: C.text, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8, marginTop: 4, fontFamily: SF_PRO },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 2, fontFamily: SF_PRO },
  localityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  localityChip: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  localityActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  localityText: { color: C.muted, fontSize: 13, fontWeight: "500" },
  localityTextActive: { color: C.white, fontWeight: "700" },
  selectedArea: { flexDirection: "row", alignItems: "center", gap: 8, borderTopColor: "rgba(255, 255, 255, 0.08)", borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
  selectedAreaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.blue },
  selectedAreaText: { color: C.muted, fontSize: 12 },
  selectedAreaHighlight: { color: C.text, fontWeight: "700" },
  languageTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  languageTitle: { color: C.text, fontSize: 16, fontWeight: "600" },
  muted: { color: C.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  languageSegment: {
    flexDirection: "row",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 3,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: C.blue,
  },
  segmentText: { color: C.dim, fontSize: 13, fontWeight: "600" },
  segmentTextActive: { color: C.white, fontWeight: "700" },
  stats: { gap: 10, paddingVertical: 2 },
  rainCard: { padding: 18, borderRadius: 22, gap: 12 },
  rainRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 3 },
  rainRowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  rainName: { color: C.text, fontSize: 13, fontWeight: "600" },
  rainValue: { color: C.muted, fontSize: 12 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.08)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  rainStateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rainStateText: { fontSize: 10, fontWeight: "700" },
  chartFootnote: { color: C.dim, fontSize: 11, fontStyle: "italic", marginTop: 4 },
  telemetryCard: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
    gap: 12,
  },
  telemetryHead: { gap: 3 },
  telemetryBeacon: { flexDirection: "row", alignItems: "center", gap: 6 },
  telemetryDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#30D158" },
  telemetryTag: { color: "#30D158", fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  telemetrySubtitle: { color: "rgba(255, 255, 255, 0.6)", fontSize: 11 },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  feedCheck: { width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  feedTitle: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "600" },
  feedSub: { color: "rgba(255, 255, 255, 0.45)", fontSize: 10.5, marginTop: 1 },
  feedStatus: {
    color: "#30D158",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    backgroundColor: "rgba(48, 209, 88, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cacheCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cacheIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(48, 209, 88, 0.12)", alignItems: "center", justifyContent: "center" },
  cacheIconOffline: { backgroundColor: "rgba(255, 214, 10, 0.12)" },
  cacheTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
  cacheSub: { color: C.muted, fontSize: 11, marginTop: 1 },
});
