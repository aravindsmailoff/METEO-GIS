import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  executeRiskPrediction,
  VerifiedRiskPrediction,
} from '../../../safety/riskPrediction';
import { MONITORED_DWR_NETWORK } from '../../../data/indiaGeoCatalog';
import { useAppStore } from '../../../store/appStore';
import {
  DataState,
  RainfallObservationPoint,
  ValidatedStationObservation,
} from '../../../types/meteo';
import { EmptyState } from '../../common/EmptyState';
import { ErrorRetry } from '../../common/ErrorRetry';
import { LoadingState } from '../../common/LoadingState';

interface ObsTabProps {
  stations: ValidatedStationObservation[];
  rainfallPoints: RainfallObservationPoint[];
  dataState: DataState;
  errorMessage: string | null;
  onRetry: () => void;
  onSelectStation: (stn: ValidatedStationObservation) => void;
}

export const ObsTab: React.FC<ObsTabProps> = ({
  stations,
  rainfallPoints,
  dataState,
  errorMessage,
  onRetry,
  onSelectStation,
}) => {
  const selectedEvidence = useAppStore((s) => s.selectedEvidence);
  const activeRadarCode = useAppStore((s) => s.activeRadarStationCode);
  const openRadarModal = useAppStore((s) => s.openRadarModal);

  const [predicting, setPredicting] = useState(false);
  const [mlResult, setMlResult] = useState<VerifiedRiskPrediction | null>(null);
  const [mlError, setMlError] = useState<string | null>(null);

  const runMlRiskInference = async () => {
    setPredicting(true);
    setMlError(null);
    try {
      const outcome = await executeRiskPrediction({
        evidence: selectedEvidence,
        stations,
        timeoutMs: 6000,
      });
      if (!outcome.ok) {
        setMlResult(null);
        setMlError(outcome.error);
        return;
      }
      setMlResult(outcome.data);
    } finally {
      setPredicting(false);
    }
  };

  if (dataState === 'loading' && stations.length === 0) {
    return <LoadingState message="Reading live IMD AWS & rain gauge telemetry…" />;
  }
  if (dataState === 'error' && stations.length === 0) {
    return <ErrorRetry message={errorMessage || undefined} onRetry={onRetry} />;
  }

  return (
    <View style={styles.container}>
      {/* Doppler Radar Quick Station Picker */}
      <View style={styles.card}>
        <Text style={styles.heading}>DOPPLER WEATHER RADAR (DWR) PICKER</Text>
        <View style={styles.radarChips}>
          {MONITORED_DWR_NETWORK.slice(0, 8).map((r) => {
            const active = r.code === activeRadarCode;
            return (
              <Pressable
                key={r.code}
                onPress={() => openRadarModal(r.code)}
                style={[styles.radarChip, active && styles.radarChipActive]}
              >
                <Text style={[styles.radarChipText, active && styles.radarChipTextActive]}>
                  📡 {r.code.toUpperCase()} · {r.name.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Live ML Risk Inference (/api/risk/predict) */}
      <View style={styles.card}>
        <Text style={styles.heading}>AI / ML MULTI-HAZARD RISK INFERENCE (/api/risk/predict)</Text>
        <Pressable
          onPress={runMlRiskInference}
          disabled={predicting}
          style={styles.mlBtn}
        >
          {predicting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.mlBtnText}>
              🧠 Run ML Risk Prediction for {selectedEvidence?.district || 'Active Sector'}
            </Text>
          )}
        </Pressable>

        {mlError && <ErrorRetry message={mlError} onRetry={runMlRiskInference} />}

        {mlResult && (
          <View style={styles.mlResultBox}>
            <Text style={styles.mlResultTitle}>
              Risk Tier: {mlResult.riskLevel} · Landslide Probability:{' '}
              {mlResult.probabilityPercent.toFixed(1)}%
            </Text>
            <Text style={styles.mlResultMeta}>
              Primary Trigger: {mlResult.topTrigger} · Evaluated Rain (1h / 24h):{' '}
              {mlResult.featuresEvaluated.rainfall_1h ?? '—'} mm /{' '}
              {mlResult.featuresEvaluated.rainfall_24h ?? '—'} mm
            </Text>
            <Text style={styles.mlResultSub}>{mlResult.recommendedAction}</Text>
          </View>
        )}
      </View>

      {/* AWS Surface Stations */}
      <Text style={styles.heading}>
        IMD SURFACE AWS & RAIN GAUGE STATIONS ({stations.length || rainfallPoints.length})
      </Text>
      {stations.length === 0 ? (
        <EmptyState title="No AWS observations reported in this state filter." />
      ) : (
        stations.map((stn) => (
          <Pressable
            key={stn.id}
            onPress={() => onSelectStation(stn)}
            style={styles.stnCard}
          >
            <View style={styles.stnTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stnName}>{stn.stationName}</Text>
                <Text style={styles.stnMeta}>
                  {stn.district}, {stn.state} · {stn.observationTimestampIST}
                </Text>
              </View>
              <Text style={styles.stnStatus}>{stn.status}</Text>
            </View>
            <View style={styles.stnMetrics}>
              <Text style={styles.stnMetricItem}>🌡 {stn.temperatureC ?? '—'}°C</Text>
              <Text style={styles.stnMetricItem}>💧 {stn.humidityPercent ?? '—'}%</Text>
              <Text style={styles.stnMetricItem}>🌧 1h: {stn.rainfall1hMm ?? 0} mm</Text>
              <Text style={styles.stnMetricItem}>📊 24h: {stn.rainfall24hMm ?? 0} mm</Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  radarChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  radarChip: {
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarChipActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.22)',
    borderColor: '#38bdf8',
  },
  radarChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  radarChipTextActive: {
    color: '#f8fafc',
  },
  mlBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  mlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  mlResultBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    gap: 4,
  },
  mlResultTitle: {
    color: '#ddd6fe',
    fontSize: 12.5,
    fontWeight: '800',
  },
  mlResultMeta: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
  },
  mlResultSub: {
    color: '#cbd5e1',
    fontSize: 11.5,
    lineHeight: 16,
  },
  stnCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  stnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stnName: {
    color: '#f8fafc',
    fontSize: 13.5,
    fontWeight: '800',
  },
  stnMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  stnStatus: {
    color: '#6ee7b7',
    fontSize: 10.5,
    fontWeight: '800',
  },
  stnMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stnMetricItem: {
    color: '#cbd5e1',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
