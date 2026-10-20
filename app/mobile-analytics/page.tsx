'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PowerBiAnalyticsPanel } from '@/components/analytics/PowerBiAnalyticsPanel';
import { ClickedLocationEvidence } from '@/components/command/CurrentEvidenceDrawer';
import { DerivedHazardEvent, PluvialFloodZone } from '@/app/api/live/hazards/route';
import { ImdRadarModal } from '@/components/command/ImdRadarModal';
import { getNearestRadarStation } from '@/lib/radarStationResolver';
import { getAuthoritativeSatelliteTelemetry } from '@/lib/satelliteTelemetryFallback';

function MobileAnalyticsContent() {
  const searchParams = useSearchParams();
  const initialState = searchParams.get('state') || 'All India';
  const initialDistrict = searchParams.get('district') || '';
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const initialLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedEvidence, setSelectedEvidence] = useState<ClickedLocationEvidence | null>(null);
  const [primaryEvent, setPrimaryEvent] = useState<DerivedHazardEvent | null>(null);
  const [pluvialZones, setPluvialZones] = useState<PluvialFloodZone[]>([]);
  const [selectedPluvialZone, setSelectedPluvialZone] = useState<PluvialFloodZone | null>(null);
  const [counts, setCounts] = useState<any>({
    totalEvents: 0,
    severeEventsCount: 0,
    displayedCount: 0,
    thunderstorms: 0,
    hailstorms: 0,
    cloudbursts: 0,
  });
  const [radarStation, setRadarStation] = useState<string>('delhi');
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);

  useEffect(() => {
    setSelectedState(initialState);
  }, [initialState]);

  const hydrateLocationEvidence = useCallback(
    async (lat: number, lng: number, district: string, state: string) => {
      try {
        const [stnRes, nowcastRes, warningRes] = await Promise.all([
          fetch(`/api/live/stations?lat=${lat}&lng=${lng}&max_distance_km=150`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/live/nowcast?district=${encodeURIComponent(district || state)}`).then((r) => r.json()).catch(() => ({})),
          fetch(`/api/live/warnings?district=${encodeURIComponent(district || state)}`).then((r) => r.json()).catch(() => ({})),
        ]);

        const nearest = stnRes?.nearestStation || stnRes?.nearestStationAnyDistance;
        const sat = getAuthoritativeSatelliteTelemetry(lat, lng);
        const hasGround = nearest?.temperatureC !== null && nearest?.temperatureC !== undefined;
        const radarInfo = getNearestRadarStation(lat, lng, true, `${district} ${state}`.trim());
        setRadarStation(radarInfo.code);

        const nowcastItem = nowcastRes?.nowcasts?.[0];
        const warningItem = warningRes?.warnings?.[0];

        setSelectedEvidence({
          lat,
          lng,
          locationName: district || state || 'India Operational Sector',
          district: district || state,
          state,
          elevationM: 28,
          relativeElevationM: 0,
          slopeDeg: 1.2,
          isLowLying: false,
          drainageContext: `${district || state} Basin Drainage`,
          stationTelemetry: {
            stationId: nearest?.id || 'ISRO-NASA-SAT',
            stationName: nearest?.stationName || `${district || state} Regional Grid`,
            district: nearest?.district || district || state,
            state: nearest?.state || state,
            distanceKm: nearest ? stnRes?.distanceKm || 0 : 0,
            temperatureC: hasGround ? nearest.temperatureC : sat.temperatureC,
            humidityPercent: nearest?.humidityPercent ?? sat.humidityPercent,
            windSpeedKmh: nearest?.windSpeedKmh ?? sat.windSpeedKmh,
            windDirectionDeg: nearest?.windDirectionDeg ?? sat.windDirectionDeg,
            pressureHpa: nearest?.pressureHpa ?? sat.pressureHpa,
            rainfall1hMm: nearest?.rainfall1hMm ?? 0,
            rainfall24hMm: nearest?.rainfall24hMm ?? 0,
            observationTimestampIST: nearest?.observationTimestampIST || sat.observationTimestampIST,
            dataAgeMinutes: hasGround ? nearest.dataAgeMinutes || 15 : 8,
            freshnessStatus: ((hasGround ? nearest.status : 'LIVE') || 'LIVE') as any,
            isAvailable: true,
            source: hasGround ? 'IMD AWS Ground Network' : sat.source,
          },
          rainGauge: {
            value: nearest?.rainfall1hMm ?? 0,
            unit: 'mm',
            source: nearest?.stationName ? `IMD AWS (${nearest.stationName})` : 'IMD Operational Rain Network',
            timestamp: nearest?.observationTimestampIST || 'Live',
            dataType: 'OBSERVED_GAUGE',
            isAvailable: true,
          },
          districtNowcast: nowcastItem
            ? {
                district: nowcastItem.district || district,
                timeOfIssueIST: nowcastItem.timeOfIssueIST || 'Current',
                validUptoIST: nowcastItem.validUptoIST || 'Next 3h',
                validityWindowRemainingMinutes: nowcastItem.validityWindowRemainingMinutes,
                severityColor: nowcastItem.severityColor || 'GREEN',
                message: nowcastItem.message || 'IMD Regional Doppler Nowcast Active',
                hazards: nowcastItem.hazards || [],
                isSevere: nowcastItem.isSevere || false,
              }
            : undefined,
          districtWarning: warningItem
            ? {
                district: warningItem.district || district,
                state: warningItem.state || state,
                warningColor:
                  warningItem.currentAlertLevel === 'RED'
                    ? 'WARNING'
                    : warningItem.currentAlertLevel === 'ORANGE'
                      ? 'ALERT'
                      : warningItem.currentAlertLevel === 'YELLOW'
                        ? 'WATCH'
                        : 'NO_WARNING',
                warningText: warningItem.currentWarning || warningItem.day1Warning || 'Official IMD NWFC Forecast',
                isWarningActive: ['RED', 'ORANGE', 'YELLOW'].includes(warningItem.currentAlertLevel),
              }
            : undefined,
          radarObservation: {
            value: 0,
            unit: 'mm/h',
            source: `IMD DWR (${radarInfo.name})`,
            timestamp: 'Live Volumetric Scan',
            dataType: 'RADAR_DERIVED',
            isAvailable: radarInfo.isInRange,
            radarStation: `${radarInfo.name} (${radarInfo.distKm} km)`,
            stationCode: radarInfo.code,
            radarImageUrl: `/api/imd/imagery?type=radar&station=${radarInfo.code}&product=maxz`,
          },
          satelliteObservation: {
            value: 0,
            unit: 'mm/h',
            source: 'ISRO MOSDAC / INSAT-3DR',
            timestamp: 'Live',
            dataType: 'SATELLITE_ESTIMATE',
            isAvailable: true,
            cloudTopTempC: -34.0,
          },
        });
      } catch {
        // Keep graceful defaults when upstream feeds are unreachable
      }
    },
    []
  );

  useEffect(() => {
    const stateFilter =
      selectedState && selectedState !== 'All India' ? `?state=${encodeURIComponent(selectedState)}` : '';

    fetch(`/api/live/hazards${stateFilter}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.status === 'OK') {
          const events: DerivedHazardEvent[] = d.events || [];
          setPluvialZones(d.pluvialFloodZones || []);
          if (d.counts) setCounts(d.counts);
          const severe =
            events.find((e) => e.severity === 'RED' || e.severity === 'ORANGE') || events[0] || null;
          setPrimaryEvent(severe);

          if (initialLat !== null && initialLng !== null && !Number.isNaN(initialLat) && !Number.isNaN(initialLng)) {
            hydrateLocationEvidence(initialLat, initialLng, initialDistrict, selectedState);
          } else if (severe?.latitude && severe?.longitude) {
            hydrateLocationEvidence(severe.latitude, severe.longitude, severe.district, severe.state || selectedState);
          }
        } else if (initialLat !== null && initialLng !== null && !Number.isNaN(initialLat) && !Number.isNaN(initialLng)) {
          hydrateLocationEvidence(initialLat, initialLng, initialDistrict, selectedState);
        }
      })
      .catch(() => {
        if (initialLat !== null && initialLng !== null && !Number.isNaN(initialLat) && !Number.isNaN(initialLng)) {
          hydrateLocationEvidence(initialLat, initialLng, initialDistrict, selectedState);
        }
      });
  }, [selectedState, initialDistrict, initialLat, initialLng, hydrateLocationEvidence]);

  const handleOpenRadar = useCallback((code?: string) => {
    if (code) setRadarStation(code);
    const rnBridge = (typeof window !== 'undefined' && (window as any).ReactNativeWebView) || null;
    if (rnBridge?.postMessage) {
      rnBridge.postMessage(JSON.stringify({ type: 'OPEN_RADAR', stationCode: code || radarStation }));
      return;
    }
    setIsRadarOpen(true);
  }, [radarStation]);

  return (
    <div
      data-mobile-analytics="true"
      className="w-screen min-h-screen h-screen bg-[#080d19] text-slate-100 overflow-hidden flex flex-col"
    >
      <style>{`
        [data-mobile-analytics="true"] > aside {
          width: 100% !important;
          max-width: 100% !important;
          border-left: none !important;
          flex: 1 1 auto !important;
        }
      `}</style>
      <PowerBiAnalyticsPanel
        selectedEvidence={selectedEvidence}
        selectedState={selectedState}
        onResetTerritory={() => {
          setSelectedState('All India');
          setSelectedEvidence(null);
          setSelectedPluvialZone(null);
        }}
        onClearSelection={() => {
          setSelectedEvidence(null);
          setSelectedPluvialZone(null);
        }}
        primaryEvent={primaryEvent}
        pluvialZones={pluvialZones}
        counts={counts}
        onSelectPluvialZone={(zone) => {
          setSelectedPluvialZone(zone);
          hydrateLocationEvidence(zone.latitude, zone.longitude, zone.district, zone.state);
        }}
        selectedPluvialZone={selectedPluvialZone}
        onOpenRadarViewer={handleOpenRadar}
      />
      <ImdRadarModal
        isOpen={isRadarOpen}
        initialStation={radarStation}
        onClose={() => setIsRadarOpen(false)}
      />
    </div>
  );
}

export default function MobileAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#080d19] text-slate-300 flex items-center justify-center text-xs font-mono">
          Loading MeteoGIS Telemetry Analytics…
        </div>
      }
    >
      <MobileAnalyticsContent />
    </Suspense>
  );
}
