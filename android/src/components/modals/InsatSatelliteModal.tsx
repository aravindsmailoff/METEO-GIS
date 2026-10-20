import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_ROUTES } from '../../config/api';
import { useAppStore } from '../../store/appStore';

const CHANNELS = [
  { id: 'ir1', label: 'TIR-1 (10.8 µm IR)', desc: 'Day & night convective cloud-top temperature scan' },
  { id: 'ctbt', label: 'CTBT (°C)', desc: 'Deep convection glaciation & storm anvil brightness' },
  { id: 'vis', label: 'VIS (0.65 µm)', desc: 'Daytime optical cloud morphology' },
] as const;

export const InsatSatelliteModal: React.FC = () => {
  const isOpen = useAppStore((s) => s.isSatelliteModalOpen);
  const closeSatelliteModal = useAppStore((s) => s.closeSatelliteModal);

  const [channel, setChannel] = useState<'ir1' | 'ctbt' | 'vis'>('ir1');
  const [nonce, setNonce] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setImgError(false);
      setNonce(Date.now());
    }
  }, [isOpen, channel]);

  if (!isOpen) return null;

  const activeInfo = CHANNELS.find((c) => c.id === channel) || CHANNELS[0];
  const imgUri = API_ROUTES.satelliteImagery(channel, nonce);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeSatelliteModal}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🛰️ INSAT-3DR Geostationary Feed</Text>
              <Text style={styles.sub}>ISRO MOSDAC / IMD Asia Sector Composite</Text>
            </View>
            <Pressable
              onPress={closeSatelliteModal}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close INSAT-3DR viewer"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.channelRow}>
            {CHANNELS.map((c) => {
              const selected = c.id === channel;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setChannel(c.id)}
                  style={[styles.channelBtn, selected && styles.channelBtnActive]}
                >
                  <Text style={[styles.channelText, selected && styles.channelTextActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.viewport}>
            {loading && !imgError && (
              <View style={styles.centerOverlay}>
                <ActivityIndicator size="small" color="#c084fc" />
                <Text style={styles.loadingText}>Streaming official INSAT-3DR payload…</Text>
              </View>
            )}

            {imgError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ INSAT-3DR Upstream Stream Unreachable</Text>
                <Text style={styles.errorSub}>
                  Scheduled satellite telemetry window or network firewall active. No synthetic satellite image is shown.
                </Text>
                <Pressable
                  onPress={() => {
                    setImgError(false);
                    setLoading(true);
                    setNonce(Date.now());
                  }}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>↻ Retry Ingestion</Text>
                </Pressable>
              </View>
            ) : (
              <Image
                source={{ uri: imgUri }}
                style={styles.satImage}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setImgError(true);
                }}
              />
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{activeInfo.desc}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    padding: 12,
  },
  card: {
    backgroundColor: '#090f1d',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#581c87',
    overflow: 'hidden',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  sub: {
    color: '#c084fc',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  channelRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  channelBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelBtnActive: {
    backgroundColor: 'rgba(147, 51, 234, 0.25)',
    borderColor: '#a855f7',
  },
  channelText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  channelTextActive: {
    color: '#f3e8ff',
  },
  viewport: {
    height: 300,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  centerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    gap: 8,
    zIndex: 5,
  },
  loadingText: {
    color: '#d8b4fe',
    fontSize: 12,
  },
  satImage: {
    width: '100%',
    height: '100%',
  },
  errorBox: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  errorTitle: {
    color: '#fbbf24',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  retryBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#581c87',
    borderWidth: 1,
    borderColor: '#a855f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});
