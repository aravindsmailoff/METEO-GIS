import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import axios from 'axios';
import { API_ROUTES } from '../../../config/api';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import {
  fetchVerifiedEvacuationRoute,
} from '../../../safety/routeSafety';
import {
  cancelConfirmedSos,
  dialEmergencyNumber,
  EMERGENCY_HELPLINES,
  INITIAL_SOS_SNAPSHOT,
  loadPendingSosRecord,
  SosSnapshot,
  submitOrRetrySos,
} from '../../../safety/sosManager';
import { useAppStore } from '../../../store/appStore';
import { HazardsPayload } from '../../../types/meteo';
import { formatCompactNumber } from '../../../utils/formatters';

interface ImpactTabProps {
  hazards: HazardsPayload;
}

export const ImpactTab: React.FC<ImpactTabProps> = ({ hazards }) => {
  const selectedEvidence = useAppStore((s) => s.selectedEvidence);
  const selectedPluvialZone = useAppStore((s) => s.selectedPluvialZone);
  const selectedHotspot = useAppStore((s) => s.selectedHotspot);
  const activeRouteOverlay = useAppStore((s) => s.activeRouteOverlay);
  const setActiveRouteOverlay = useAppStore((s) => s.setActiveRouteOverlay);
  const { isOnline } = useNetworkStatus();

  const [routingMode, setRoutingMode] = useState<'safe' | 'emergency' | null>(null);
  const [lastRequestedMode, setLastRequestedMode] = useState<'safe' | 'emergency'>('safe');
  const [routeUnavailable, setRouteUnavailable] = useState<{
    title: string;
    detail: string;
  } | null>(null);

  const [isolationSummary, setIsolationSummary] = useState<{
    available: boolean;
    count: number;
    source: string;
  } | null>(null);

  const [sosState, setSosState] = useState<SosSnapshot>(INITIAL_SOS_SNAPSHOT);
  const [sosBusy, setSosBusy] = useState<boolean>(false);
  const [dialNotice, setDialNotice] = useState<string | null>(null);

  const [incidentNote, setIncidentNote] = useState<string>('');
  const [incidentBusy, setIncidentBusy] = useState<boolean>(false);
  const [incidentFeedback, setIncidentFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Hydrate genuinely persisted unsent SOS from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    loadPendingSosRecord().then((pending) => {
      if (!mounted || !pending) return;
      setSosState({
        status: 'queued_not_delivered',
        reportId: null,
        alertId: null,
        persisted: false,
        clientRequestId: pending.clientRequestId,
        message: `NOT DELIVERED — Saved locally from ${pending.triggeredAtDevice} (${pending.attemptCount} failed attempt${pending.attemptCount === 1 ? '' : 's'}).`,
        cancelError: null,
        pendingOfflineRecord: pending,
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Automatically retry queued local SOS with idempotent `clientRequestId` when network restores
  useEffect(() => {
    if (!isOnline || sosState.status !== 'queued_not_delivered' || !sosState.pendingOfflineRecord) {
      return;
    }
    const rec = sosState.pendingOfflineRecord;
    setSosBusy(true);
    submitOrRetrySos({
      latitude: rec.latitude,
      longitude: rec.longitude,
      accuracyM: rec.accuracyM,
      existingRecord: rec,
    })
      .then((next) => setSosState(next))
      .finally(() => setSosBusy(false));
  }, [isOnline, sosState.pendingOfflineRecord, sosState.status]);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(API_ROUTES.isolation(), { timeout: 6000 })
      .then((res) => {
        if (cancelled) return;
        const d = res.data;
        const list = d?.isolated_villages || d?.villages || d?.corridors;
        const count = Array.isArray(list)
          ? list.length
          : typeof d?.isolated_count === 'number'
            ? d.isolated_count
            : null;
        if (count === null) {
          setIsolationSummary({
            available: false,
            count: 0,
            source: 'Isolation feed returned no corridor list',
          });
          return;
        }
        const srcLabel =
          d?.source === 'static_fallback'
            ? 'Static Reference Dataset — FastAPI PostGIS Unreachable'
            : d?.source || 'Valhalla Connectivity Service';
        setIsolationSummary({
          available: d?.source !== 'static_fallback',
          count,
          source: srcLabel,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setIsolationSummary({
            available: false,
            count: 0,
            source: 'Isolation telemetry currently unreachable',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const seg = hazards.userSegmentation;

  const computeEvacuationRoute = useCallback(
    async (mode: 'safe' | 'emergency') => {
      setRoutingMode(mode);
      setLastRequestedMode(mode);
      setRouteUnavailable(null);

      if (!selectedEvidence || !Number.isFinite(selectedEvidence.lat) || !Number.isFinite(selectedEvidence.lng)) {
        setActiveRouteOverlay(null);
        setRouteUnavailable({
          title: 'Verified Safe Route Unavailable',
          detail:
            'Select a district, warning polygon, or station on the map first so routing starts from verified coordinates.',
        });
        setRoutingMode(null);
        return;
      }

      const origin = { lat: selectedEvidence.lat, lon: selectedEvidence.lng };
      const destination = {
        lat: Number((selectedEvidence.lat + 0.14).toFixed(6)),
        lon: Number((selectedEvidence.lng - 0.12).toFixed(6)),
      };

      try {
        const validated = await fetchVerifiedEvacuationRoute({
          mode,
          origin,
          destination,
          hazards,
        });

        if (!validated.ok) {
          setActiveRouteOverlay(null);
          setRouteUnavailable({
            title: validated.title,
            detail: validated.detail,
          });
          return;
        }

        setRouteUnavailable(null);
        setActiveRouteOverlay(validated.overlay);
      } finally {
        setRoutingMode(null);
      }
    },
    [hazards, selectedEvidence, setActiveRouteOverlay]
  );

  const handleTriggerOrRetrySos = async () => {
    const lat = sosState.pendingOfflineRecord?.latitude ?? selectedEvidence?.lat;
    const lng = sosState.pendingOfflineRecord?.longitude ?? selectedEvidence?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      setSosState({
        ...INITIAL_SOS_SNAPSHOT,
        status: 'failed',
        message:
          'Select your location/sector on the map first so emergency responders receive accurate coordinates, or call 112 / 1077 below.',
      });
      return;
    }

    setSosBusy(true);
    try {
      const next = await submitOrRetrySos({
        latitude: lat,
        longitude: lng,
        existingRecord: sosState.pendingOfflineRecord,
      });
      setSosState(next);
    } finally {
      setSosBusy(false);
    }
  };

  const handleCancelSos = async () => {
    setSosBusy(true);
    try {
      const next = await cancelConfirmedSos({ current: sosState });
      setSosState(next);
    } finally {
      setSosBusy(false);
    }
  };

  const handleDialHelpline = async (number: '112' | '1077') => {
    const opened = await dialEmergencyNumber(number);
    setDialNotice(
      opened
        ? `Opened phone dialer for ${number}. Confirm call in your dialer to connect.`
        : `Dialer unavailable on this device — dial ${number} directly on a phone.`
    );
  };

  const handleSubmitFieldReport = async () => {
    const cleanNote = incidentNote.trim();
    if (!cleanNote) return;

    if (
      !selectedEvidence ||
      typeof selectedEvidence.lat !== 'number' ||
      typeof selectedEvidence.lng !== 'number'
    ) {
      setIncidentFeedback({
        ok: false,
        text: 'Select a valid map location first so field reports include verified GPS coordinates.',
      });
      return;
    }

    setIncidentBusy(true);
    try {
      const res = await axios.post(
        API_ROUTES.citizenReport(),
        {
          incident_type: 'WATERLOGGING_OR_SLOPE_HAZARD',
          severity: 'HIGH',
          description: cleanNote,
          latitude: selectedEvidence.lat,
          longitude: selectedEvidence.lng,
          road_blocked: true,
        },
        { timeout: 6000 }
      );

      if (res.data?.report_id && res.data?.persisted === true) {
        setIncidentFeedback({
          ok: true,
          text: `Confirmed (${res.data.report_id}): persisted to emergency database for NDRF triage.`,
        });
        setIncidentNote('');
      } else if (res.data?.report_id) {
        setIncidentFeedback({
          ok: false,
          text: `Gateway Receipt (${res.data.report_id}) — NOT persisted to PostGIS database (stateless Next.js endpoint). Call 1077 / 112 for urgent dispatch.`,
        });
        setIncidentNote('');
      } else {
        setIncidentFeedback({
          ok: false,
          text:
            res.data?.error ||
            'Report could not be confirmed as persisted by emergency backend. Please retry.',
        });
      }
    } catch (err: any) {
      setIncidentFeedback({
        ok: false,
        text:
          err?.response?.data?.error ||
          'Report NOT sent — emergency backend unreachable. Keep note and retry when online.',
      });
    } finally {
      setIncidentBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Population Exposure Breakdown */}
      <Text style={styles.heading}>EXPOSED POPULATION & RESPONSE SEGMENTATION</Text>
      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCompactNumber(seg.totalPersonsAtRisk)}</Text>
          <Text style={styles.statLabel}>Total Persons in Alert Zones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#38bdf8' }]}>
            {formatCompactNumber(seg.fieldOfficersInRedZones)}
          </Text>
          <Text style={styles.statLabel}>Field Officers Deployed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#fb923c' }]}>
            {formatCompactNumber(seg.citizensInRedZones)}
          </Text>
          <Text style={styles.statLabel}>Citizens in Red Zones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#c084fc' }]}>
            {formatCompactNumber(seg.touristsInRedZones)}
          </Text>
          <Text style={styles.statLabel}>Transit & Tourists</Text>
        </View>
      </View>

      {/* Selected Pluvial Flood Zone / Micro Hotspot Directive */}
      {selectedPluvialZone && (
        <View style={styles.hotspotCard}>
          <Text style={styles.hotspotTitle}>
            🌊 {selectedPluvialZone.zoneName} ({selectedPluvialZone.pluvialFloodRisk})
          </Text>
          <Text style={styles.hotspotSub}>
            Structures at Risk: {selectedPluvialZone.estimatedHousesAtRisk.toLocaleString()} ·
            Depression: {selectedPluvialZone.relativeDepressionM}m · DEM: {selectedPluvialZone.demElevationM}m
          </Text>
          {selectedHotspot && (
            <Text style={styles.hotspotAction}>Action: {selectedHotspot.recommendation}</Text>
          )}
        </View>
      )}

      {/* Evacuation & Emergency Valhalla Routing */}
      <View style={styles.card}>
        <Text style={styles.heading}>FLOOD-SAFE & NDRF ROUTING (/api/routing/*)</Text>
        <View style={styles.btnRow}>
          <Pressable
            onPress={() => computeEvacuationRoute('safe')}
            disabled={routingMode !== null}
            style={[styles.routeBtn, { backgroundColor: '#059669' }]}
          >
            {routingMode === 'safe' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.routeBtnText}>🛣 Safe Route</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => computeEvacuationRoute('emergency')}
            disabled={routingMode !== null}
            style={[styles.routeBtn, { backgroundColor: '#0284c7' }]}
          >
            {routingMode === 'emergency' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.routeBtnText}>🚑 Emergency Route</Text>
            )}
          </Pressable>
        </View>

        {routeUnavailable && (
          <View style={styles.routeErrorBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.routeErrorTitle}>⚠ {routeUnavailable.title}</Text>
              <Text style={styles.routeErrorSub}>{routeUnavailable.detail}</Text>
            </View>
            <Pressable
              onPress={() => computeEvacuationRoute(lastRequestedMode)}
              style={styles.clearRouteBtn}
            >
              <Text style={styles.clearRouteText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {activeRouteOverlay && (
          <View
            style={
              activeRouteOverlay.closureVerification === 'closure_unverified'
                ? styles.routeUnverifiedResult
                : styles.routeResult
            }
          >
            <View style={{ flex: 1 }}>
              <Text
                style={
                  activeRouteOverlay.closureVerification === 'closure_unverified'
                    ? styles.routeUnverifiedTitle
                    : styles.routeTitle
                }
              >
                {activeRouteOverlay.closureVerification === 'closure_unverified'
                  ? `⚠ ${activeRouteOverlay.summary}`
                  : `✓ ${activeRouteOverlay.summary}`}
              </Text>
              <Text style={styles.routeMeta}>
                Distance: {activeRouteOverlay.distanceKm.toFixed(1)} km · Est. Time:{' '}
                {Math.round(activeRouteOverlay.durationMin)} min · Vertices:{' '}
                {activeRouteOverlay.coordinates.length}
              </Text>
              {activeRouteOverlay.closureWarning && (
                <Text style={styles.routeUnverifiedWarning}>
                  {activeRouteOverlay.closureWarning}
                </Text>
              )}
            </View>
            <Pressable onPress={() => setActiveRouteOverlay(null)} style={styles.clearRouteBtn}>
              <Text style={styles.clearRouteText}>Clear</Text>
            </Pressable>
          </View>
        )}

        {isolationSummary && (
          <Text style={styles.isolationNote}>
            {isolationSummary.available
              ? `🏘 Village Isolation Monitor: ${isolationSummary.count} vulnerable corridors tracked (${isolationSummary.source})`
              : `⚠ Village Isolation Monitor: ${isolationSummary.source}`}
          </Text>
        )}
      </View>

      {/* Citizen SOS & Geotagged Field Incident Triage */}
      <View style={styles.card}>
        <Text style={styles.heading}>EMERGENCY SOS & FIELD REPORT (/api/sos · /api/citizen/report)</Text>

        {sosState.status === 'confirmed_persisted' && sosState.reportId ? (
          <View style={styles.sosConfirmedBox}>
            <Text style={styles.sosConfirmedTitle}>
              🚨 Confirmed Active SOS Beacon: {sosState.reportId}
            </Text>
            <Text style={styles.sosConfirmedSub}>{sosState.message}</Text>
            {sosState.cancelError && (
              <Text style={styles.sosErrorText}>{sosState.cancelError}</Text>
            )}
            <Pressable onPress={handleCancelSos} disabled={sosBusy} style={styles.safeBtn}>
              <Text style={styles.routeBtnText}>
                {sosBusy ? 'Confirming All-Clear…' : '✓ I Am Safe (Request Server Cancel)'}
              </Text>
            </Pressable>
          </View>
        ) : sosState.status === 'received_unpersisted' && sosState.reportId ? (
          <View style={styles.sosUnpersistedBox}>
            <Text style={styles.sosUnpersistedTitle}>
              ⚠ Server Received ({sosState.reportId}) — NOT SAVED TO DB (persisted: false)
            </Text>
            <Text style={styles.sosUnpersistedSub}>{sosState.message}</Text>
            {sosState.cancelError && (
              <Text style={styles.sosErrorText}>{sosState.cancelError}</Text>
            )}
            <View style={styles.btnRow}>
              <Pressable
                onPress={handleTriggerOrRetrySos}
                disabled={sosBusy}
                style={[styles.routeBtn, { backgroundColor: '#b45309' }]}
              >
                <Text style={styles.routeBtnText}>↻ Retry DB Save</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelSos}
                disabled={sosBusy}
                style={[styles.routeBtn, { backgroundColor: '#059669' }]}
              >
                <Text style={styles.routeBtnText}>✓ Cancel Beacon</Text>
              </Pressable>
            </View>
          </View>
        ) : sosState.status === 'queued_not_delivered' ? (
          <View style={styles.sosOfflineBox}>
            <Text style={styles.sosOfflineTitle}>
              ✗ SOS NOT DELIVERED — Saved Locally Offline (0 Responders Notified)
            </Text>
            <Text style={styles.sosOfflineSub}>{sosState.message}</Text>
            <View style={styles.btnRow}>
              <Pressable
                onPress={handleTriggerOrRetrySos}
                disabled={sosBusy}
                style={[styles.routeBtn, { backgroundColor: '#dc2626' }]}
              >
                <Text style={styles.routeBtnText}>
                  {sosBusy ? 'Retrying…' : '↻ Retry SOS Now'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCancelSos}
                disabled={sosBusy}
                style={[styles.routeBtn, { backgroundColor: '#334155' }]}
              >
                <Text style={styles.routeBtnText}>Discard Local Draft</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {sosState.status === 'failed' && sosState.message && (
              <Text style={styles.sosErrorText}>{sosState.message}</Text>
            )}
            <Pressable
              onPress={handleTriggerOrRetrySos}
              disabled={sosBusy}
              style={styles.sosBtn}
            >
              <Text style={styles.routeBtnText}>
                {sosBusy ? 'Transmitting SOS…' : '🆘 Dispatch Emergency SOS Beacon'}
              </Text>
            </Pressable>
            {sosState.message && sosState.status === 'idle' && (
              <Text style={styles.savedMsg}>{sosState.message}</Text>
            )}
          </View>
        )}

        {/* Explicit Voice Helpline Dialer Controls (Never claims call happened automatically) */}
        <View style={styles.helplineBox}>
          <Text style={styles.helplineDisclaimer}>
            Voice Call Notice: Sending an SOS data beacon does NOT place a phone call. No call is placed unless you tap a helpline below and confirm in your phone dialer:
          </Text>
          <View style={styles.btnRow}>
            {EMERGENCY_HELPLINES.map((hl) => (
              <Pressable
                key={hl.number}
                onPress={() => handleDialHelpline(hl.number)}
                style={styles.helplineBtn}
              >
                <Text style={styles.helplineBtnText}>📞 Call {hl.number}</Text>
              </Pressable>
            ))}
          </View>
          {dialNotice && <Text style={styles.isolationNote}>{dialNotice}</Text>}
        </View>

        <View style={styles.reportRow}>
          <TextInput
            value={incidentNote}
            onChangeText={setIncidentNote}
            placeholder="Report road blockage, flood depth, fallen powerline…"
            placeholderTextColor="#64748b"
            style={styles.reportInput}
          />
          <Pressable
            onPress={handleSubmitFieldReport}
            disabled={incidentBusy}
            style={styles.sendBtn}
          >
            <Text style={styles.routeBtnText}>{incidentBusy ? '…' : 'Send'}</Text>
          </Pressable>
        </View>
        {incidentFeedback && (
          <Text style={incidentFeedback.ok ? styles.savedMsg : styles.sosErrorText}>
            {incidentFeedback.text}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  heading: {
    color: '#94a3b8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    width: '48.4%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 3,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  hotspotCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 45, 18, 0.28)',
    borderWidth: 1,
    borderColor: '#fb923c',
    gap: 4,
  },
  hotspotTitle: {
    color: '#ffedd5',
    fontSize: 13,
    fontWeight: '800',
  },
  hotspotSub: {
    color: '#fed7aa',
    fontSize: 11.5,
  },
  hotspotAction: {
    color: '#fde68a',
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  routeBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  routeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  routeErrorBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    borderWidth: 1,
    borderColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeErrorTitle: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
  },
  routeErrorSub: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 2,
  },
  routeResult: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeUnverifiedResult: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 53, 15, 0.38)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeTitle: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '800',
  },
  routeUnverifiedTitle: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
  },
  routeUnverifiedWarning: {
    color: '#fed7aa',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  routeMeta: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  clearRouteBtn: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearRouteText: {
    color: '#f8fafc',
    fontSize: 11.5,
    fontWeight: '700',
  },
  isolationNote: {
    color: '#94a3b8',
    fontSize: 11,
  },
  sosBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosConfirmedBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 78, 59, 0.35)',
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 8,
  },
  sosConfirmedTitle: {
    color: '#6ee7b7',
    fontSize: 12.5,
    fontWeight: '800',
  },
  sosConfirmedSub: {
    color: '#d1fae5',
    fontSize: 11,
  },
  sosUnpersistedBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 53, 15, 0.42)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
  },
  sosUnpersistedTitle: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '800',
  },
  sosUnpersistedSub: {
    color: '#fef3c7',
    fontSize: 11,
  },
  sosOfflineBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(127, 29, 29, 0.45)',
    borderWidth: 1,
    borderColor: '#ef4444',
    gap: 8,
  },
  sosOfflineTitle: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
  },
  sosOfflineSub: {
    color: '#fca5a5',
    fontSize: 11,
  },
  sosErrorText: {
    color: '#fca5a5',
    fontSize: 11.5,
    fontWeight: '700',
  },
  safeBtn: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineBox: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  helplineDisclaimer: {
    color: '#94a3b8',
    fontSize: 10.5,
    lineHeight: 15,
  },
  helplineBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineBtnText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  reportInput: {
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
  sendBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedMsg: {
    color: '#6ee7b7',
    fontSize: 11.5,
    fontWeight: '600',
  },
});
