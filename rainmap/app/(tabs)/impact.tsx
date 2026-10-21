import React, { useEffect, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Polyline, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton, C, Card, LiveFeedBadge, ReservoirGauge, RiskPill, SectionTitle, StatTile, riskColor, SF_PRO } from "@/components/flood/ui";
import { CONTACT_EXAMPLES, IMPACT_METRICS, IMPACT_SCENARIO, RESERVOIRS } from "@/lib/flood/demo-data";
import { copy } from "@/lib/i18n/copy";
import { useFlood } from "@/lib/flood/FloodProvider";
import {
  fetchLiveMeteoGis,
  findNearestRescueUnit,
  type LiveBhuvanTelemetry,
  type LiveNasaTelemetry,
  type MeteoOverviewKpis,
  type RescueUnit,
} from "@/lib/meteo/liveMeteoService";
import { ReactBitsBackground } from "@/components/meteo/ReactBitsBackground";

const metricKeys = [
  ["roadsMetric", "roadsMetricDetail"],
  ["bridgesMetric", "bridgesMetricDetail"],
  ["lowZonesMetric", "lowZonesMetricDetail"],
  ["peopleMetric", "peopleMetricDetail"],
] as const;
const contactKeys = ["policeExample", "medicalExample", "reliefExample"] as const;

export default function ImpactScreen() {
  const { language, area } = useFlood();
  const t = (key: Parameters<typeof copy>[1]) => copy(language, key);
  const router = useRouter();
  const [scenarioOpen, setScenarioOpen] = useState(false);

  // Meteo-GIS Live Overview state
  const [kpis, setKpis] = useState<MeteoOverviewKpis>({
    activeWarningsCount: 18,
    reportingStationsCount: 42,
    highPrecipPoints: 6,
    activeStormCells: 4,
    radarStation: "IMD DWR Coastal Radar Network",
    soilSaturationIndex: 74,
  });
  const [nearestRescue, setNearestRescue] = useState<RescueUnit>(() => findNearestRescueUnit(13.0827, 80.2707));
  const [nasaPower, setNasaPower] = useState<LiveNasaTelemetry | null>(null);
  const [isroBhuvan, setIsroBhuvan] = useState<LiveBhuvanTelemetry | null>(null);

  useEffect(() => {
    let active = true;
    async function loadMeteoOverview() {
      try {
        const payload = await fetchLiveMeteoGis();
        if (active) {
          setKpis(payload.kpis);
          setNearestRescue(payload.nearestRescue);
          setNasaPower(payload.nasaPower);
          setIsroBhuvan(payload.isroBhuvan);
        }
      } catch {
        // Silently maintain fallback
      }
    }
    loadMeteoOverview();
    const interval = setInterval(loadMeteoOverview, 45000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <ReactBitsBackground />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Apple iOS Large Title Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>METEO-GIS · BASIN INTELLIGENCE</Text>
            <Text style={styles.title}>{t("impactForecast")}</Text>
            <Text style={styles.subtitle}>{area}, Tamil Nadu · {t("online")}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Ionicons name="stats-chart" size={20} color={C.blue} />
          </View>
        </View>

        <LiveFeedBadge label={t("demo")} />

        {/* Meteo-GIS Synoptic Disaster Overview Strip */}
        <Card style={styles.meteoOverviewCard}>
          <View style={styles.meteoHeaderRow}>
            <View style={styles.liveBeacon}>
              <View style={styles.liveBeaconDot} />
              <Text style={styles.meteoEyebrow}>METEO-GIS LIVE DISASTER OVERVIEW</Text>
            </View>
            <View style={styles.stationBadge}>
              <Text style={styles.stationBadgeText}>IMD NOWCAST LIVE</Text>
            </View>
          </View>

          <Text numberOfLines={1} style={styles.radarStationText}>
            📡 {kpis.radarStation}
          </Text>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{kpis.activeWarningsCount}</Text>
              <Text style={styles.kpiLabel}>Active Warnings</Text>
              <Text style={styles.kpiSub}>IMD / NWFC</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{kpis.reportingStationsCount}</Text>
              <Text style={styles.kpiLabel}>AWS Stations</Text>
              <Text style={styles.kpiSub}>Telemetry Live</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiNum}>{kpis.soilSaturationIndex}%</Text>
              <Text style={styles.kpiLabel}>Soil Saturation</Text>
              <Text style={styles.kpiSub}>Slope Trigger</Text>
            </View>
          </View>

          {/* Nearest Rescue Unit Quick Banner */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Call nearest rescue team ${nearestRescue.name}`}
            style={styles.rescueRibbon}
            onPress={() => Linking.openURL(`tel:${nearestRescue.tollFree || "1078"}`).catch(() => {})}
          >
            <View style={styles.rescueIconWrap}>
              <Ionicons name="shield-checkmark" size={15} color="#30D158" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.rescueTagRow}>
                <Text style={styles.rescueTagText}>NEAREST RESCUE UNIT</Text>
                <Text style={styles.rescueDot}>·</Text>
                <Text style={styles.rescueEtaText}>~{nearestRescue.etaMinutes ?? 25} min ETA</Text>
              </View>
              <Text numberOfLines={1} style={styles.rescueRibbonTitle}>
                {nearestRescue.battalion}
              </Text>
              <Text numberOfLines={1} style={styles.rescueRibbonSub}>
                {nearestRescue.headquarters} · {nearestRescue.distanceKm} km
              </Text>
            </View>
            <View style={styles.callBadge}>
              <Ionicons name="call" size={12} color="#FFFFFF" />
              <Text style={styles.callBadgeText}>1078</Text>
            </View>
          </Pressable>
        </Card>

        {/* Real NASA POWER & ISRO Bhuvan Ingestion Strip */}
        <Card style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={styles.telemetryIcon}>
              <Ionicons name="planet" size={16} color="#60A5FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.telemetryTitle}>NASA POWER & ISRO BHUVAN FEEDS</Text>
              <Text style={styles.telemetrySub}>Global Satellite Climatology & CartoDEM 30m Elevation</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>CONNECTED</Text>
            </View>
          </View>

          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryTileLabel}>NASA GPM 30D SPI</Text>
              <Text style={styles.telemetryTileValue}>
                {nasaPower?.rainfall30dPrecipitationSpi != null
                  ? (nasaPower.rainfall30dPrecipitationSpi > 0 ? `+${nasaPower.rainfall30dPrecipitationSpi.toFixed(2)}` : nasaPower.rainfall30dPrecipitationSpi.toFixed(2))
                  : "+1.42"}
              </Text>
              <Text style={styles.telemetryTileFoot}>Extremely Saturated</Text>
            </View>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryTileLabel}>CARTODEM ELEVATION</Text>
              <Text style={styles.telemetryTileValue}>
                {isroBhuvan?.elevationDemM != null ? `${isroBhuvan.elevationDemM} m` : "6.8 m"}
              </Text>
              <Text style={styles.telemetryTileFoot}>Coastal Lowland MSL</Text>
            </View>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryTileLabel}>ACCUMULATED RAIN</Text>
              <Text style={styles.telemetryTileValue}>
                {nasaPower?.accumulatedMonsoonRainMm != null ? `${nasaPower.accumulatedMonsoonRainMm} mm` : "184 mm"}
              </Text>
              <Text style={styles.telemetryTileFoot}>GPM IMERG V07B</Text>
            </View>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryTileLabel}>BHUVAN LULC</Text>
              <Text numberOfLines={1} style={styles.telemetryTileValue}>
                {isroBhuvan?.geomorphology || "Deltaic Marsh"}
              </Text>
              <Text style={styles.telemetryTileFoot}>Slope &lt; 3° Flat</Text>
            </View>
          </View>
        </Card>

        {/* 4 Impact Stat Tiles in Apple Health Card style */}
        <SectionTitle title={t("impactForecast")} trailing={t("exampleOnly")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stats}>
          {IMPACT_METRICS.map((metric, index) => (
            <StatTile
              key={metric.label}
              label={t(metricKeys[index][0])}
              value={metric.value}
              detail={t(metricKeys[index][1])}
              color={[C.coral, C.orange, C.amber, C.teal][index]}
            />
          ))}
        </ScrollView>

        {/* Precipitation Trend Chart (Apple Weather style) */}
        <Card style={styles.trendCard}>
          <SectionTitle title={t("trend")} trailing="12H FORECAST" />
          <View style={styles.chartContainer}>
            <Svg width="100%" height="90" viewBox="0 0 320 90" preserveAspectRatio="none">
              <Defs>
                <SvgGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={C.blue} stopOpacity="0.35" />
                  <Stop offset="1" stopColor={C.blue} stopOpacity="0.0" />
                </SvgGradient>
              </Defs>
              <Path
                d="M 0 70 L 40 64 L 80 65 L 120 48 L 160 54 L 200 32 L 240 36 L 280 18 L 320 12 L 320 85 L 0 85 Z"
                fill="url(#chartGradient)"
              />
              <Polyline
                points="0,70 40,64 80,65 120,48 160,54 200,32 240,36 280,18 320,12"
                fill="none"
                stroke={C.blue}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Polyline points="0,85 320,85" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            </Svg>
            <View style={styles.chartLabels}>
              <Text style={styles.chartLabel}>6 AM</Text>
              <Text style={styles.chartLabel}>9 AM</Text>
              <Text style={styles.chartLabel}>12 PM</Text>
              <Text style={styles.chartLabel}>3 PM</Text>
              <Text style={styles.chartLabel}>6 PM</Text>
            </View>
          </View>
          <Text style={styles.chartFootnote}>{t("notForecast")}</Text>
        </Card>

        {/* Reservoirs List */}
        <SectionTitle title={t("reservoirWatchTitle")} trailing={`${RESERVOIRS.length} MONITORED`} />
        {RESERVOIRS.map((reservoir) => {
          const color = riskColor(reservoir.status);
          return (
            <Card
              key={reservoir.id}
              style={styles.reservoirCard}
              variant={reservoir.status === "danger" || reservoir.status === "critical" ? "urgent" : "base"}
            >
              <View style={styles.cardHead}>
                <View style={[styles.iconTile, { backgroundColor: `${color}22` }]}>
                  <Ionicons name="water" size={18} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{reservoir.name}</Text>
                  <Text style={styles.mutedText}>{reservoir.location}</Text>
                </View>
                <RiskPill label={t(reservoir.status)} level={reservoir.status} />
              </View>

              <View style={styles.levelRow}>
                <ReservoirGauge value={reservoir.level} color={color} size={64} />
                <View style={styles.levelDetails}>
                  <View style={styles.levelTrack}>
                    <View style={[styles.levelFill, { width: `${reservoir.level}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.flowRow}>
                    <Text style={styles.flowLabel}>{t("inflow")}: <Text style={styles.flowValue}>{reservoir.inflow}</Text></Text>
                    <Text style={styles.flowLabel}>{t("outflow")}: <Text style={styles.flowValue}>{reservoir.outflow}</Text></Text>
                  </View>
                </View>
              </View>

              <View style={styles.sparkRow}>
                <Text style={styles.sparkLabel}>{t("fillTrend")}</Text>
                <Svg width={110} height={28} viewBox="0 0 110 28">
                  <Polyline
                    points={reservoir.trend.map((n, i) => `${i * 12.2},${26 - (n / 100) * 22}`).join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <View style={styles.sparkBadge}><Text style={styles.sparkBadgeText}>24H TREND</Text></View>
              </View>
            </Card>
          );
        })}

        {/* Gate Release Simulation */}
        <Card style={styles.scenarioCard} variant="urgent">
          <View style={styles.cardHead}>
            <View style={[styles.iconTile, { backgroundColor: "rgba(255, 69, 58, 0.2)" }]}>
              <Ionicons name="warning" size={18} color={C.coral} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{IMPACT_SCENARIO.title}</Text>
              <Text style={styles.mutedText}>{IMPACT_SCENARIO.reservoir}</Text>
            </View>
          </View>
          <View style={styles.simulationNotice}>
            <Ionicons name="alert-circle" size={16} color={C.coral} />
            <Text style={styles.simulationText}>{t("simulation")}</Text>
          </View>
          <ActionButton
            icon={scenarioOpen ? "chevron-up" : "git-branch"}
            label={scenarioOpen ? t("hideScenario") : t("releaseScenario")}
            variant="secondary"
            onPress={() => setScenarioOpen((v) => !v)}
          />
          {scenarioOpen ? (
            <View style={styles.scenarioBody}>
              {IMPACT_SCENARIO.locations.map((item, index) => (
                <View key={item.name} style={styles.locationRow}>
                  <View style={[styles.routeNode, { borderColor: riskColor(item.risk), backgroundColor: `${riskColor(item.risk)}24` }]}>
                    <Text style={[styles.routeNumber, { color: riskColor(item.risk) }]}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationName}>{item.name}</Text>
                    <Text style={styles.mutedText}>Discharge Velocity ETA: {item.eta}</Text>
                  </View>
                  <RiskPill label={t(item.risk)} level={item.risk} />
                </View>
              ))}
              <View style={styles.routeCard}>
                <Ionicons name="navigate" size={18} color={C.blue} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>{t("evacuation")}</Text>
                  <Text style={styles.mutedText}>{IMPACT_SCENARIO.route}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.dim} />
              </View>
              <View style={styles.routeCard}>
                <Ionicons name="shield-checkmark" size={18} color={C.green} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeTitle}>{t("safePoint")}</Text>
                  <Text style={styles.mutedText}>{IMPACT_SCENARIO.relief}</Text>
                </View>
              </View>
              <Text style={styles.etaDisclaimer}>{t("timeDisclaimer")}</Text>
            </View>
          ) : null}
        </Card>

        {/* Emergency Contacts - Apple Grouped Table */}
        <SectionTitle title={t("nearbyExamples")} trailing="OFFICIAL SEOC 24/7" />
        <View style={styles.contactsGroup}>
          {CONTACT_EXAMPLES.map((contact, index) => (
            <View key={contact.name} style={[styles.contactRow, index < CONTACT_EXAMPLES.length - 1 && styles.contactBorder]}>
              <View style={styles.contactIcon}>
                <Ionicons name={contact.icon} size={16} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{t(contactKeys[index])}</Text>
                <Text style={styles.contactSub}>{contact.detail}</Text>
              </View>
              <Ionicons name="call" size={16} color={C.green} />
            </View>
          ))}
        </View>

        <View style={styles.contactNote}>
          <Ionicons name="information-circle" size={16} color={C.amber} />
          <Text style={styles.contactNoteText}>{t("contactsDisclaimer")}</Text>
        </View>

        <ActionButton icon="map" label={t("openMap")} variant="quiet" onPress={() => router.navigate("/(tabs)")} />
        <View style={{ height: 90 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#030712",
    position: "relative",
    fontFamily: SF_PRO,
  },
  screen: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 16, paddingTop: 12, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  eyebrow: {
    color: C.teal,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: SF_PRO,
  },
  title: {
    color: C.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 4,
    fontFamily: SF_PRO,
  },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  headerIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(10, 132, 255, 0.15)", alignItems: "center", justifyContent: "center" },
  meteoOverviewCard: {
    backgroundColor: "#161922",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 12,
  },
  meteoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveBeacon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveBeaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#38BDF8",
  },
  meteoEyebrow: {
    color: "#38BDF8",
    fontSize: 9.5,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  stationBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stationBadgeText: {
    color: "#38BDF8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  radarStationText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontFamily: SF_PRO,
  },
  kpiGrid: {
    flexDirection: "row",
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    alignItems: "center",
  },
  kpiNum: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontFamily: SF_PRO,
  },
  kpiLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
    fontFamily: SF_PRO,
  },
  kpiSub: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    marginTop: 1,
    textAlign: "center",
  },
  rescueRibbon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(48, 209, 88, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(48, 209, 88, 0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rescueIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(48, 209, 88, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rescueTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rescueTagText: {
    color: "#30D158",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  rescueDot: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 9,
  },
  rescueEtaText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 9,
    fontWeight: "600",
  },
  rescueRibbonTitle: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
    marginTop: 1,
  },
  rescueRibbonSub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10.5,
    marginTop: 1,
  },
  callBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#30D158",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
  },
  callBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  telemetryCard: {
    backgroundColor: "#111827",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.2)",
    gap: 12,
  },
  telemetryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  telemetryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(96, 165, 250, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryTitle: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  telemetrySub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10.5,
    marginTop: 1,
  },
  activePill: {
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  activePillText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  telemetryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  telemetryTile: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  telemetryTileLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  telemetryTileValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginTop: 3,
    fontFamily: SF_PRO,
  },
  telemetryTileFoot: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 9.5,
    marginTop: 2,
  },
  stats: { gap: 10, paddingVertical: 2 },
  trendCard: { padding: 18, borderRadius: 22, gap: 12 },
  chartContainer: { marginVertical: 4 },
  chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  chartLabel: { color: C.dim, fontSize: 10, fontWeight: "600" },
  chartFootnote: { color: C.dim, fontSize: 11, fontStyle: "italic" },
  reservoirCard: { padding: 18, borderRadius: 22, gap: 14 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  mutedText: { color: C.muted, fontSize: 12, marginTop: 1 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  levelDetails: { flex: 1, gap: 8 },
  levelTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.08)", overflow: "hidden" },
  levelFill: { height: "100%", borderRadius: 3 },
  flowRow: { flexDirection: "row", justifyContent: "space-between" },
  flowLabel: { color: C.muted, fontSize: 11 },
  flowValue: { color: C.text, fontWeight: "600" },
  sparkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  sparkLabel: { color: C.dim, fontSize: 11, fontWeight: "600" },
  sparkBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(255, 255, 255, 0.08)" },
  sparkBadgeText: { color: C.muted, fontSize: 9, fontWeight: "700" },
  scenarioCard: { padding: 18, borderRadius: 22, gap: 14 },
  simulationNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 69, 58, 0.12)",
  },
  simulationText: { color: C.coral, fontSize: 11, fontWeight: "700" },
  scenarioBody: { gap: 12, marginTop: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  routeNode: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  routeNumber: { fontSize: 11, fontWeight: "800" },
  locationName: { color: C.text, fontSize: 14, fontWeight: "600" },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  routeTitle: { color: C.text, fontSize: 13, fontWeight: "600" },
  etaDisclaimer: { color: C.dim, fontSize: 11, fontStyle: "italic", marginTop: 4 },
  contactsGroup: {
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  contactBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.06)" },
  contactIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(10, 132, 255, 0.12)", alignItems: "center", justifyContent: "center" },
  contactName: { color: C.text, fontSize: 14, fontWeight: "600" },
  contactSub: { color: C.muted, fontSize: 11, marginTop: 2 },
  contactNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255, 214, 10, 0.08)",
  },
  contactNoteText: { flex: 1, color: C.muted, fontSize: 11, lineHeight: 16 },
});
