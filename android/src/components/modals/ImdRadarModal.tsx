import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { API_ROUTES } from '../../config/api';
import { MONITORED_DWR_NETWORK } from '../../data/indiaGeoCatalog';
import { useAppStore } from '../../store/appStore';

const PRODUCTS = [
  { id: 'maxz', label: 'MAXZ (dBZ)' },
  { id: 'ppz', label: 'PPZ (Refl)' },
  { id: 'sri', label: 'SRI (Rain)' },
  { id: 'ppv', label: 'PPV (Wind)' },
  { id: 'pac', label: 'PAC (Accum)' },
] as const;

export const ImdRadarModal: React.FC = () => {
  const isOpen = useAppStore((s) => s.isRadarModalOpen);
  const closeRadarModal = useAppStore((s) => s.closeRadarModal);
  const activeStation = useAppStore((s) => s.activeRadarStationCode);
  const openRadarModal = useAppStore((s) => s.openRadarModal);

  const [product, setProduct] = useState<'maxz' | 'ppz' | 'sri' | 'ppv' | 'pac'>('maxz');
  const [nonce, setNonce] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(true);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setImgError(false);
      setNonce(Date.now());
    }
  }, [isOpen, activeStation, product]);

  if (!isOpen) return null;

  const stnObj =
    MONITORED_DWR_NETWORK.find((s) => s.code === activeStation) || MONITORED_DWR_NETWORK[0];
  const imgUri = API_ROUTES.radarImagery(stnObj.code, product, nonce);

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={closeRadarModal}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>📡 IMD Doppler Weather Radar</Text>
              <Text style={styles.sub}>
                {stnObj.name} ({stnObj.band}) · {stnObj.code.toUpperCase()}
              </Text>
            </View>
            <Pressable
              onPress={closeRadarModal}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close Doppler Radar modal"
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {stnObj.code === 'cni' && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                ℹ️ Chennai Port DWR calibration active · Streaming South Coast S-Band composite.
              </Text>
            </View>
          )}

          {/* Horizontal Radar Station Picker */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
          >
            {MONITORED_DWR_NETWORK.map((item) => {
              const selected = item.code === stnObj.code;
              return (
                <Pressable
                  key={item.code}
                  onPress={() => openRadarModal(item.code)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {item.code.toUpperCase()} · {item.name.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Product Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
          >
            {PRODUCTS.map((p) => {
              const selected = product === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setProduct(p.id)}
                  style={[styles.prodChip, selected && styles.prodChipActive]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Viewport */}
          <View style={styles.viewport}>
            {loading && !imgError && (
              <View style={styles.centerOverlay}>
                <ActivityIndicator size="small" color="#22d3ee" />
                <Text style={styles.loadingText}>
                  Streaming volumetric scan from {stnObj.name}…
                </Text>
              </View>
            )}

            {imgError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>
                  ⚠️ Live Radar Sweep Offline ({stnObj.name})
                </Text>
                <Text style={styles.errorSub}>
                  Upstream IMD Mausam radar sweep is in calibration or unreachable. Strict truth-in-data policy prevents synthetic radar images.
                </Text>
                <View style={styles.fallbackRow}>
                  <Pressable
                    onPress={() => {
                      openRadarModal('delhi');
                      setNonce(Date.now());
                    }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionText}>Delhi DWR</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setImgError(false);
                      setLoading(true);
                      setNonce(Date.now());
                    }}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionText}>↻ Retry Scan</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Image
                source={{ uri: imgUri }}
                style={styles.radarImage}
                resizeMode="contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setImgError(true);
                }}
              />
            )}
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
    backgroundColor: '#080e18',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#164e63',
    overflow: 'hidden',
    maxHeight: '92%',
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
    color: '#22d3ee',
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
  notice: {
    backgroundColor: 'rgba(120, 53, 15, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  noticeText: {
    color: '#fde68a',
    fontSize: 11,
  },
  strip: {
    maxHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  stripContent: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#22d3ee',
  },
  prodChip: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  prodChipActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.24)',
    borderColor: '#38bdf8',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ecfeff',
  },
  viewport: {
    height: 310,
    backgroundColor: '#030712',
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
    color: '#67e8f9',
    fontSize: 12,
  },
  radarImage: {
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
  fallbackRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#164e63',
    borderWidth: 1,
    borderColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '800',
  },
});
