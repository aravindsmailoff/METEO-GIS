import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { API_ROUTES } from '../../../config/api';
import { getDemographicsSnapshot } from '../../../data/indiaGeoCatalog';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { useAppStore } from '../../../store/appStore';
import { HazardsPayload } from '../../../types/meteo';
import { formatCompactNumber, formatRelativeMinutes } from '../../../utils/formatters';
import { EmbeddedWebView } from '../../common/EmbeddedWebView';

interface AnalyticsTabProps {
  hazards: HazardsPayload;
  fetchedAt: number | null;
  height?: number;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  hazards,
  fetchedAt,
  height = 460,
}) => {
  const { isOnline } = useNetworkStatus();
  const selectedState = useAppStore((s) => s.selectedState);
  const selectedEvidence = useAppStore((s) => s.selectedEvidence);
  const openRadarModal = useAppStore((s) => s.openRadarModal);

  const [renderMode, setRenderMode] = useState<'webview' | 'native'>('webview');
  const [webLoaded, setWebLoaded] = useState<boolean>(false);
  const [webFailed, setWebFailed] = useState<boolean>(false);

  const analyticsUri = useMemo(
    () =>
      API_ROUTES.mobileAnalytics({
        state: selectedEvidence?.state || selectedState,
        district: selectedEvidence?.district,
        lat: selectedEvidence?.lat,
        lng: selectedEvidence?.lng,
      }),
    [selectedEvidence, selectedState]
  );

  // Spec Section 3: Fallback to Native SVG charts automatically if WebView fails or exceeds 3s timeout
  useEffect(() => {
    setWebLoaded(false);
    setWebFailed(false);
    if (!isOnline) {
      setWebFailed(true);
      return;
    }
    const timer = setTimeout(() => {
      setWebLoaded((loaded) => {
        if (!loaded) {
          setWebFailed(true);
        }
        return loaded;
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [analyticsUri, isOnline]);

  const showNativeCharts = !isOnline || webFailed || renderMode === 'native';
  const slices = useMemo(
    () => getDemographicsSnapshot(selectedEvidence?.state || selectedState),
    [selectedEvidence?.state, selectedState]
  );

  const hourlyBars = useMemo(() => {
    const base = selectedEvidence?.rainfall1hMm || hazards.events[0]?.rainfallRateMmH || 14;
    return Array.from({ length: 12 }, (_, idx) => {
      const hour = idx * 2;
      const factor = Math.max(0.2, 1 - Math.abs(hour - 14) / 14);
      return {
        label: `${String(hour).padStart(2, '0')}h`,
        mm: Number((base * factor + (idx % 2 === 0 ? 1.8 : 0.6)).toFixed(1)),
      };
    });
  }, [hazards.events, selectedEvidence?.rainfall1hMm]);

  const maxBar = Math.max(12, ...hourlyBars.map((b) => b.mm));
  const circumference = 2 * Math.PI * 38;
  let cumulativePct = 0;

  return (
    <View style={styles.container}>
      {/* Mode Switcher Bar */}
      <View style={styles.modeBar}>
        <Text style={styles.modeLabel}>
          {!isOnline
            ? `Analytics offline — last data: ${formatRelativeMinutes(fetchedAt)}`
            : 'TELEMETRY ANALYTICS ENGINE'}
        </Text>
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => {
              setWebFailed(false);
              setRenderMode('webview');
            }}
            style={[styles.modeBtn, !showNativeCharts && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, !showNativeCharts && styles.modeBtnTextActive]}>
              Live WebView
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRenderMode('native')}
            style={[styles.modeBtn, showNativeCharts && styles.modeBtnActive]}
          >
            <Text style={[styles.modeBtnText, showNativeCharts && styles.modeBtnTextActive]}>
              Native SVG
            </Text>
          </Pressable>
        </View>
      </View>

      {!showNativeCharts ? (
        <EmbeddedWebView
          uri={analyticsUri}
          height={height}
          onLoaded={() => setWebLoaded(true)}
          onFailed={() => setWebFailed(true)}
          onOpenRadarStation={(code) => openRadarModal(code)}
        />
      ) : (
        <View style={styles.nativeWrap}>
          {/* Cached KPI Cards */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiVal}>{hazards.counts.severeEventsCount}</Text>
              <Text style={styles.kpiSub}>Severe Warnings</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: '#38bdf8' }]}>
                {(selectedEvidence?.rainfall1hMm ?? hazards.events[0]?.rainfallRateMmH ?? 16.4).toFixed(1)} mm/h
              </Text>
              <Text style={styles.kpiSub}>Peak Rain Rate</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiVal, { color: '#fb923c' }]}>
                {selectedEvidence?.severity || hazards.events[0]?.severity || 'ORANGE'}
              </Text>
              <Text style={styles.kpiSub}>Active Severity</Text>
            </View>
          </View>

          {/* 24-Hour Rainfall SVG Bar Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>24-HOUR RAINFALL PROGRESSION (MM/H)</Text>
            <Svg width="100%" height={145} viewBox="0 0 320 135">
              {hourlyBars.map((b, idx) => {
                const barH = Math.max(6, (b.mm / maxBar) * 100);
                const x = 10 + idx * 25.5;
                const y = 115 - barH;
                return (
                  <Rect
                    key={b.label}
                    x={x}
                    y={y}
                    width={17}
                    height={barH}
                    rx={4}
                    fill={b.mm >= 30 ? '#f97316' : '#38bdf8'}
                  />
                );
              })}
            </Svg>
          </View>

          {/* Population Vulnerability SVG Donut Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              DEMOGRAPHIC EXPOSURE · {(selectedEvidence?.state || selectedState).toUpperCase()}
            </Text>
            <View style={styles.donutRow}>
              <Svg width={110} height={110} viewBox="0 0 100 100">
                <G rotation="-90" origin="50, 50">
                  {slices.map((s) => {
                    const strokeDasharray = `${(s.pct / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((cumulativePct / 100) * circumference);
                    cumulativePct += s.pct;
                    return (
                      <Circle
                        key={s.label}
                        cx="50"
                        cy="50"
                        r="38"
                        stroke={s.color}
                        strokeWidth="13"
                        fill="transparent"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </G>
              </Svg>
              <View style={styles.legendCol}>
                {slices.map((s) => (
                  <View key={s.label} style={styles.legendLine}>
                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                    <Text style={styles.legendName} numberOfLines={1}>
                      {s.label}
                    </Text>
                    <Text style={styles.legendCount}>{formatCompactNumber(s.count)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeLabel: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    flex: 1,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.22)',
    borderColor: '#38bdf8',
  },
  modeBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#ffffff',
  },
  nativeWrap: {
    gap: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  kpiVal: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '900',
  },
  kpiSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  chartCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  chartTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendCol: {
    flex: 1,
    gap: 5,
  },
  legendLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 11,
  },
  legendCount: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
  },
});
