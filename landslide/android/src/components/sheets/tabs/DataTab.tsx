import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { API_ROUTES } from '../../../config/api';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { DataState, TelemetryProvider } from '../../../types/meteo';
import { FEED_TTL, readCache, writeCache } from '../../../utils/cache';
import { ErrorRetry } from '../../common/ErrorRetry';
import { LoadingState } from '../../common/LoadingState';

export const DataTab: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [providers, setProviders] = useState<TelemetryProvider[]>([]);
  const [auditInfo, setAuditInfo] = useState<any | null>(null);
  const [state, setState] = useState<DataState>('loading');

  const fetchTelemetry = useCallback(async () => {
    const cached = await readCache<TelemetryProvider[]>('telemetry:providers');
    if (!isOnline) {
      if (cached) {
        setProviders(cached.data);
        setState('offline');
        return;
      }
      setState('offline');
      return;
    }

    if (!cached) setState('loading');

    try {
      const [telRes, auditRes] = await Promise.all([
        axios.get(API_ROUTES.telemetry(), { timeout: 6000 }),
        axios.get(API_ROUTES.audit(), { timeout: 6000 }).catch(() => ({ data: {} })),
      ]);
      const list: TelemetryProvider[] = telRes.data?.providers || [];
      if (auditRes.data?.audit) {
        setAuditInfo(auditRes.data.audit);
      }
      await writeCache('telemetry:providers', list, 'api/telemetry', FEED_TTL.telemetry);
      setProviders(list);
      setState(list.length === 0 ? 'empty' : 'success');
    } catch {
      if (cached) {
        setProviders(cached.data);
        setState('stale');
      } else {
        setState('error');
      }
    }
  }, [isOnline]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  if (state === 'loading' && providers.length === 0) {
    return <LoadingState message="Auditing upstream IMD, ISRO Bhuvan & NASA providers…" />;
  }
  if (state === 'error' && providers.length === 0) {
    return <ErrorRetry message="Could not reach /api/telemetry" onRetry={fetchTelemetry} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.heading}>
          UPSTREAM PROVIDER HEALTH ({providers.length} DATA FEEDS)
        </Text>
        <Pressable onPress={fetchTelemetry} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻ Force Audit</Text>
        </Pressable>
      </View>

      {auditInfo && (
        <View style={styles.auditBanner}>
          <Text style={styles.auditTitle}>
            Ingestion Audit: {auditInfo.apiStatus || 'CONNECTED'} · Cycle: 5m
          </Text>
          <Text style={styles.auditSub}>
            Last Sync: {auditInfo.lastSuccessfulFetch || 'Live'} · Credentials secured server-side
          </Text>
        </View>
      )}

      {providers.map((p) => (
        <View key={p.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.cat}>{p.category}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{p.status}</Text>
            </View>
          </View>
          <Text style={styles.desc}>{p.description}</Text>
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>⚡ {p.latency_ms} ms</Text>
            <Text style={styles.metric}>🕒 {p.last_sync}</Text>
            <Text style={styles.metric}>📦 {p.records_cached} cached</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
  },
  refreshBtn: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    color: '#38bdf8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  auditBanner: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    gap: 2,
  },
  auditTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800',
  },
  auditSub: {
    color: '#a7f3d0',
    fontSize: 11,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
  },
  cat: {
    color: '#64748b',
    fontSize: 11,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  statusText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
  },
  desc: {
    color: '#cbd5e1',
    fontSize: 11.5,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  metric: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
