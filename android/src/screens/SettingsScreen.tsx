import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import {
  ADB_REVERSE_DEV_API_URL,
  APPROVED_DEV_CLEARTEXT_HOSTS,
  API_ROUTES,
  DEFAULT_ANDROID_DEV_API,
  getApiBase,
  getApiConfigError,
  IS_DEV_RUNTIME,
  LOCAL_DEV_API_URL,
  PRODUCTION_API_URL,
} from '../config/api';
import { QUICK_STATES } from '../data/indiaGeoCatalog';
import { useAppStore } from '../store/appStore';
import { clearAllFeedCache, listCacheMetadata } from '../utils/cache';
import { formatRelativeMinutes } from '../utils/formatters';
import { requestAndroidNotificationPermission } from '../utils/permissions';

export const SettingsScreen: React.FC = () => {
  const defaultTerritory = useAppStore((s) => s.defaultTerritory);
  const setDefaultTerritory = useAppStore((s) => s.setDefaultTerritory);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const customApiUrl = useAppStore((s) => s.customApiUrl);
  const updateCustomApiUrl = useAppStore((s) => s.updateCustomApiUrl);
  const simulateOfflineMode = useAppStore((s) => s.simulateOfflineMode);
  const setSimulateOfflineMode = useAppStore((s) => s.setSimulateOfflineMode);
  const useReferenceFallback = useAppStore((s) => s.useReferenceFallbackWhenUpstreamDown);
  const setUseReferenceFallback = useAppStore((s) => s.setUseReferenceFallbackWhenUpstreamDown);
  const triggerGlobalRefresh = useAppStore((s) => s.triggerGlobalRefresh);

  const [apiInput, setApiInput] = useState<string>(customApiUrl);
  const [gatewayHealthMsg, setGatewayHealthMsg] = useState<string | null>(null);
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);
  const [cacheEntries, setCacheEntries] = useState<
    Array<{ key: string; fetchedAt: number; expiresAt: number; source: string }>
  >([]);
  const [cacheClearedMsg, setCacheClearedMsg] = useState<string | null>(null);

  const refreshCacheInfo = useCallback(async () => {
    const items = await listCacheMetadata();
    setCacheEntries(items);
  }, []);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  const handleToggleAlerts = async () => {
    const target = !notificationsEnabled;
    if (target) {
      const granted = await requestAndroidNotificationPermission();
      if (!granted) {
        setNotifFeedback('Notification permission declined by user.');
        return;
      }
    }
    await setNotificationsEnabled(target);
    setNotifFeedback(
      target
        ? 'Severe RED/ORANGE alert notifications enabled.'
        : 'Alert notifications turned off.'
    );
  };

  const handlePingGateway = async () => {
    setGatewayHealthMsg('Testing gateway connection…');
    try {
      const res = await axios.get(API_ROUTES.systemStatus(), { timeout: 5000 });
      setGatewayHealthMsg(
        `✓ Connected (${res.status}) · Mode: ${res.data?.mode || 'LIVE'}`
      );
    } catch (err: any) {
      setGatewayHealthMsg(`✗ Unreachable (${err?.message || 'Network Error'})`);
    }
  };

  const handleClearCache = async () => {
    const count = await clearAllFeedCache();
    await refreshCacheInfo();
    setCacheClearedMsg(`Cleared ${count} cached feed entries from AsyncStorage.`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Settings & System Control</Text>
      <Text style={styles.pageSub}>
        Zero permissions requested on launch · All API credentials stay strictly server-side
      </Text>

      {/* 1. Default Territory Preference */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>DEFAULT TERRITORY AT LAUNCH</Text>
        <View style={styles.territoryGrid}>
          {QUICK_STATES.slice(0, 10).map((st) => {
            const active = st.name === defaultTerritory;
            return (
              <Pressable
                key={st.name}
                onPress={() => setDefaultTerritory(st.name)}
                style={[styles.territoryBtn, active && styles.territoryBtnActive]}
              >
                <Text style={[styles.territoryText, active && styles.territoryTextActive]}>
                  {st.icon} {st.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. Opt-In Severe Weather Notifications */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>ALERT NOTIFICATIONS (OPT-IN ONLY)</Text>
        <Pressable onPress={handleToggleAlerts} style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Enable RED Warning Alerts</Text>
            <Text style={styles.rowDesc}>
              Prompts permission only when switched ON. Never interrupts on app startup.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleAlerts}
            trackColor={{ false: '#334155', true: '#0284c7' }}
            thumbColor={notificationsEnabled ? '#ffffff' : '#94a3b8'}
          />
        </Pressable>
        {notifFeedback && <Text style={styles.infoNote}>{notifFeedback}</Text>}
      </View>

      {/* 3. Shared Production Vercel & Intentional Local Dev API Config */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>SHARED BACKEND GATEWAY CONFIG</Text>
        <Text style={styles.rowDesc}>
          Active Base URL:{' '}
          {getApiConfigError()
            ? `INVALID (${getApiConfigError()})`
            : getApiBase() || `(Web Proxy → ${PRODUCTION_API_URL})`}
          {'\n'}Production Default: {PRODUCTION_API_URL} · Local Dev Loopback Only:{' '}
          {APPROVED_DEV_CLEARTEXT_HOSTS.join(', ')}
        </Text>
        {IS_DEV_RUNTIME && (
          <View style={styles.btnRow}>
            <Pressable
              onPress={async () => {
                setApiInput(PRODUCTION_API_URL);
                await updateCustomApiUrl('');
                setGatewayHealthMsg(`✓ Using deployed Vercel gateway (${PRODUCTION_API_URL}).`);
              }}
              style={[styles.secondaryBtn, { flex: 1 }]}
            >
              <Text style={styles.btnText}>🌐 Vercel Prod</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setApiInput(LOCAL_DEV_API_URL);
                await updateCustomApiUrl(LOCAL_DEV_API_URL);
                setGatewayHealthMsg(`✓ Switched to Local Emulator Dev (${LOCAL_DEV_API_URL}).`);
              }}
              style={[styles.secondaryBtn, { flex: 1 }]}
            >
              <Text style={styles.btnText}>🛠 Emulator :3000</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setApiInput(ADB_REVERSE_DEV_API_URL);
                await updateCustomApiUrl(ADB_REVERSE_DEV_API_URL);
                setGatewayHealthMsg(`✓ Switched to ADB Reverse (${ADB_REVERSE_DEV_API_URL}).`);
              }}
              style={[styles.secondaryBtn, { flex: 1 }]}
            >
              <Text style={styles.btnText}>🔌 ADB :3000</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            value={apiInput}
            onChangeText={setApiInput}
            placeholder="HTTPS URL or adb reverse http://127.0.0.1:3000"
            placeholderTextColor="#64748b"
            style={styles.input}
          />
          <Pressable
            onPress={async () => {
              const res = await updateCustomApiUrl(apiInput);
              setGatewayHealthMsg(
                res.ok
                  ? '✓ Saved validated API gateway base URL.'
                  : `✗ Rejected: ${res.error || 'Unsafe URL'}`
              );
            }}
            style={styles.primaryBtn}
          >
            <Text style={styles.btnText}>Save</Text>
          </Pressable>
        </View>
        <Pressable onPress={handlePingGateway} style={styles.secondaryBtn}>
          <Text style={styles.btnText}>⚡ Verify /api/system/data-status</Text>
        </Pressable>
        {gatewayHealthMsg && <Text style={styles.infoNote}>{gatewayHealthMsg}</Text>}
      </View>

      {/* 4. Offline Cache & QA Resilience Controls */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>OFFLINE PERSISTENCE & QA DIAGNOSTICS</Text>

        <Pressable
          onPress={() => setSimulateOfflineMode(!simulateOfflineMode)}
          style={styles.switchRow}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Simulate Offline Network Outage</Text>
            <Text style={styles.rowDesc}>
              Test cached data playback, offline banners, and native SVG analytics fallback
            </Text>
          </View>
          <Switch
            value={simulateOfflineMode}
            onValueChange={setSimulateOfflineMode}
            trackColor={{ false: '#334155', true: '#ea580c' }}
            thumbColor={simulateOfflineMode ? '#ffffff' : '#94a3b8'}
          />
        </Pressable>

        {IS_DEV_RUNTIME && (
          <Pressable
            onPress={() => setUseReferenceFallback(!useReferenceFallback)}
            style={styles.switchRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                QA Sample Fixture Mode (DEV ONLY — NOT LIVE DATA)
              </Text>
              <Text style={styles.rowDesc}>
                Disabled by default (`false`). Shows purple SAMPLE / NOT LIVE banner and never overwrites cached official feeds. Locked OFF in release builds.
              </Text>
            </View>
            <Switch
              value={useReferenceFallback}
              onValueChange={setUseReferenceFallback}
              trackColor={{ false: '#334155', true: '#a21caf' }}
              thumbColor={useReferenceFallback ? '#ffffff' : '#94a3b8'}
            />
          </Pressable>
        )}

        <View style={styles.cacheBox}>
          <Text style={styles.rowTitle}>
            Cached AsyncStorage Feeds ({cacheEntries.length})
          </Text>
          {cacheEntries.map((item) => (
            <Text key={item.key} style={styles.cacheItem}>
              • {item.key} — updated {formatRelativeMinutes(item.fetchedAt)}
            </Text>
          ))}
        </View>

        <View style={styles.btnRow}>
          <Pressable onPress={handleClearCache} style={[styles.secondaryBtn, { flex: 1 }]}>
            <Text style={styles.btnText}>🗑 Clear Cache</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              triggerGlobalRefresh();
              refreshCacheInfo();
            }}
            style={[styles.primaryBtn, { flex: 1 }]}
          >
            <Text style={styles.btnText}>↻ Force Sync All</Text>
          </Pressable>
        </View>
        {cacheClearedMsg && <Text style={styles.infoNote}>{cacheClearedMsg}</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 14,
    gap: 12,
    paddingBottom: 32,
  },
  pageTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  pageSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  card: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardHeading: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  territoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  territoryBtn: {
    width: '48.2%',
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  territoryBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.22)',
    borderColor: '#38bdf8',
  },
  territoryText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  territoryTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    color: '#94a3b8',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#f8fafc',
    fontSize: 12.5,
  },
  primaryBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  infoNote: {
    color: '#6ee7b7',
    fontSize: 11.5,
    fontWeight: '600',
  },
  cacheBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  cacheItem: {
    color: '#94a3b8',
    fontSize: 11,
  },
});
