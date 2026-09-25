'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  PhoneCall, 
  Camera, 
  Upload, 
  Navigation, 
  CheckCircle2, 
  AlertOctagon, 
  Radio, 
  HeartHandshake, 
  Send,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { ReliefShelter, CitizenReport } from '../types';

interface CitizenPortalProps {
  reliefShelters: ReliefShelter[];
  onNewCitizenReport?: (report: CitizenReport) => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  reliefShelters,
  onNewCitizenReport,
}) => {
  // SOS State Machine: idle → locating → sending → active
  const [sosState, setSosState] = useState<'idle' | 'locating' | 'sending' | 'active'>('idle');
  const [sosReportId, setSosReportId] = useState<string | null>(null);
  const [sosAlertId, setSosAlertId] = useState<string | null>(null);
  const [sosPersisted, setSosPersisted] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [cancelPending, setCancelPending] = useState(false);
  const [sosElapsedSec, setSosElapsedSec] = useState(0);
  const beaconStartedAt = useRef<number | null>(null);

  const sosActive = sosState === 'active';
  const sosPinging = sosState === 'locating' || sosState === 'sending';

  // Live elapsed timer while the beacon is active
  useEffect(() => {
    if (!sosActive) {
      beaconStartedAt.current = null;
      return;
    }
    beaconStartedAt.current = Date.now();
    setSosElapsedSec(0);
    const t = setInterval(() => {
      if (beaconStartedAt.current) {
        setSosElapsedSec(Math.floor((Date.now() - beaconStartedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [sosActive]);

  // Silently refresh device GPS on mount for the report form + faster SOS fixes
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsAccuracy(pos.coords.accuracy);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  const obtainFix = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('This device has no GPS/geolocation capability.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      });
    });

  const transmitSos = async (fix: { lat: number; lng: number; accuracy?: number }) => {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: fix.lat,
        longitude: fix.lng,
        accuracy_m: fix.accuracy,
        triggered_at_device: new Date().toISOString(),
      }),
    });
    return res.json();
  };

  const handleSosTrigger = async () => {
    setSosError(null);
    setSosState('locating');

    // 1. Acquire a real device GPS fix (falls back to last-known location)
    let fix: { lat: number; lng: number; accuracy?: number };
    try {
      const pos = await obtainFix();
      fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
      setUserLocation({ lat: fix.lat, lng: fix.lng });
      setGpsAccuracy(fix.accuracy ?? null);
    } catch {
      fix = { lat: userLocation.lat, lng: userLocation.lng };
      setGpsAccuracy(null);
    }

    // 2. Transmit to the emergency backend
    setSosState('sending');
    try {
      const data = await transmitSos(fix);
      if (data.delivered) {
        setSosReportId(data.report_id ?? null);
        setSosAlertId(data.alert_id ?? null);
        setSosPersisted(Boolean(data.persisted));
        setSosState('active');
        if (!data.persisted) {
          setSosError('Beacon transmitted, but the emergency database is unreachable — it is queued for operator review.');
        }
      } else {
        throw new Error(data.error || 'Transmission failed');
      }
    } catch (err: any) {
      setSosState('idle');
      setSosError(
        (err?.message || 'Beacon could not be delivered.') +
          ' Check your connection and press SEND SOS again — or call 1077 now.'
      );
    }
  };

  const handleCancelSos = async () => {
    if (!sosReportId) {
      setSosState('idle');
      return;
    }
    setCancelPending(true);
    try {
      const res = await fetch('/api/sos/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: sosReportId }),
      });
      const data = await res.json();
      if (data.cancelled) {
        setSosState('idle');
        setSosReportId(null);
        setSosAlertId(null);
        setSosError(null);
      } else {
        setSosError('Server could not confirm the cancellation — beacon remains active. Call 1077 to report all-clear.');
      }
    } catch {
      setSosError('Network error: cancellation not confirmed. Beacon remains active. Call 1077 to report all-clear.');
    } finally {
      setCancelPending(false);
    }
  };

  // Crowdsourced Report State
  const [reportType, setReportType] = useState('Landslide debris blocking road');
  const [reportSeverity, setReportSeverity] = useState<'Critical' | 'High' | 'Moderate'>('High');
  const [reportDesc, setReportDesc] = useState('');
  const [reportRoadBlocked, setReportRoadBlocked] = useState(true);
  const [reportPhotoPreview, setReportPhotoPreview] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 27.238, lng: 88.502 });

  // Navigation Target
  const [navigatingShelter, setNavigatingShelter] = useState<ReliefShelter | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(true);

    const newReport: CitizenReport = {
      id: `REP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      incident_type: reportType,
      severity: reportSeverity,
      description: reportDesc || 'Slope debris reported on road shoulder by local resident.',
      lat: userLocation.lat,
      lng: userLocation.lng,
      location_name: 'Current Citizen GPS Point (NH-10 near Singtam)',
      road_blocked: reportRoadBlocked,
      casualties_reported: 0,
      timestamp: 'Just now',
      status: 'PENDING_VERIFICATION',
    };

    if (onNewCitizenReport) {
      onNewCitizenReport(newReport);
    }

    setTimeout(() => {
      setReportSuccess(false);
      setReportDesc('');
      setReportPhotoPreview(null);
    }, 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 py-2 animate-fadeIn">
      {/* 1. Location Hazard Status Banner */}
      <div className="tactical-card tactical-card-danger p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500 border border-red-500/40">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
                LOCAL HAZARD LEVEL: SEVERE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-300 text-[10px] font-bold border border-red-700">
                IMD RED WARNING
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white mt-0.5">
              Singtam–Rangpo Sector, East Sikkim
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Active landslide threat on NH-10. Rainfall intensity 42.5 mm/h. Avoid valley roads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <a
            href="tel:1077"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(255,42,85,0.4)] transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Disaster Helpline (1077)</span>
          </a>
        </div>
      </div>

      {/* 2. One-Click Emergency SOS Distress Beacon */}
      <div className="tactical-card p-5 lg:p-6 bg-gradient-to-br from-[#0F1928] to-[#080E18] text-center flex flex-col items-center">
        <div className="max-w-md">
          <h3 className="text-base font-extrabold text-white mb-1 flex items-center justify-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            1-Click SOS Emergency Distress Beacon
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Instantly transmits your precise GPS coordinates to the State Emergency Operations Center (SEOC) & NDRF Quick Response units.
          </p>

          {sosActive ? (
            <div className="bg-red-950/40 border border-red-500/60 p-4 rounded-2xl flex flex-col items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_25px_rgba(255,42,85,0.8)]">
                SOS
              </div>
              <div>
                <strong className="text-sm text-white block">
                  {sosPersisted ? 'BEACON REGISTERED — CAP ALERT BROADCAST' : 'BEACON TRANSMITTED — QUEUED FOR OPERATOR REVIEW'}
                </strong>
                <span className="text-xs text-red-300 font-mono">
                  {userLocation.lat.toFixed(5)}°N, {userLocation.lng.toFixed(5)}°E
                  {gpsAccuracy != null ? ` (±${gpsAccuracy.toFixed(0)} m)` : ' (coarse fix — no GPS lock)'}
                </span>
                {sosReportId && (
                  <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                    Beacon ID: {sosReportId} • Active for {sosElapsedSec}s
                    {sosAlertId ? ` • CAP: ${sosAlertId}` : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                Rescue coordination sees your live position. Stay in a safe, elevated location away from mudflow channels.
              </p>
              <button
                onClick={handleCancelSos}
                disabled={cancelPending}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 disabled:opacity-50"
              >
                {cancelPending ? 'CONFIRMING...' : 'Cancel Beacon (I am Safe)'}
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleSosTrigger}
                disabled={sosPinging}
                className={`w-36 h-36 mx-auto rounded-full flex flex-col items-center justify-center font-black text-lg text-white shadow-2xl transition-all duration-300 ${
                  sosPinging
                    ? 'bg-amber-600 scale-95 animate-pulse'
                    : 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,42,85,0.7)] active:scale-95'
                }`}
              >
                <Zap className="w-8 h-8 mb-1" />
                <span>
                  {sosState === 'locating'
                    ? 'ACQUIRING GPS...'
                    : sosState === 'sending'
                    ? 'TRANSMITTING...'
                    : 'SEND SOS'}
                </span>
                <span className="text-[10px] font-normal tracking-wide opacity-80">
                  {sosPinging ? 'PLEASE WAIT' : 'TAP TO TRANSMIT'}
                </span>
              </button>
              {sosError && (
                <div className="mt-3 w-full max-w-md text-left bg-amber-950/40 border border-amber-500/50 rounded-xl p-3">
                  <strong className="text-xs text-amber-300 block">⚠ Transmission Problem</strong>
                  <p className="text-[11px] text-amber-200 mt-1">{sosError}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 3. Crowdsourced Landslide Reporting Form */}
        <div className="tactical-card p-4 lg:p-5">
          <div className="flex items-center gap-2 border-b border-[#18283E] pb-3 mb-4">
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-[#00F0FF] border border-[#00F0FF]/30">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Crowdsourced Incident Reporter</h3>
              <span className="text-[11px] text-slate-400">Report active slope slips, rockfalls & road blocks</span>
            </div>
          </div>

          {reportSuccess ? (
            <div className="p-6 bg-emerald-950/40 border border-emerald-500/60 rounded-xl text-center flex flex-col items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <strong className="text-sm text-white">Report Submitted Successfully!</strong>
              <p className="text-xs text-emerald-200">
                Your report has been geotagged and queued for NDRF triage and district administration clearance.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Incident Classification</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="Landslide debris blocking road">Landslide debris blocking road</option>
                  <option value="Rockfall from mountain cliff">Rockfall from mountain cliff</option>
                  <option value="Road asphalt tension cracks / Subsidence">Road asphalt tension cracks / Subsidence</option>
                  <option value="Residential structure damage / Mudflow">Residential structure damage / Mudflow</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Severity</label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value as any)}
                    className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">🔴 Critical (Total Blockage)</option>
                    <option value="High">🟠 High (Partial Blockage)</option>
                    <option value="Moderate">🟡 Moderate (Shoulder Debris)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={reportRoadBlocked}
                      onChange={(e) => setReportRoadBlocked(e.target.checked)}
                      className="accent-[#00F0FF] rounded"
                    />
                    <span>Road Impassable</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Location / Landmark Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. NH-10 near Singtam bridge bend, approx 200m before petrol pump..."
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Photo Upload Simulation */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Incident Photo Evidence</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#102235] text-cyan-400 border border-cyan-500/40 hover:bg-[#162D47] cursor-pointer font-medium">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {reportPhotoPreview && (
                    <span className="text-[11px] text-emerald-400 font-mono">✓ Photo Attached</span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md transition-all mt-1"
              >
                <Send className="w-4 h-4" />
                <span>Submit Geotagged Incident Report</span>
              </button>
            </form>
          )}
        </div>

        {/* 4. Nearest Open Relief Shelters Navigator */}
        <div className="tactical-card p-4 lg:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#18283E] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nearest Open Relief Shelters</h3>
                  <span className="text-[11px] text-slate-400">Turn-by-turn bypass navigation & capacity</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {reliefShelters.map((shl) => {
                const occupancyPct = Math.round((shl.occupancy / shl.capacity) * 100);
                const isNav = navigatingShelter?.id === shl.id;

                return (
                  <div
                    key={shl.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isNav ? 'bg-emerald-950/40 border-emerald-500' : 'bg-[#080E18] border-[#142336] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {shl.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {shl.district} • {shl.distanceKm || 3.5} km away
                        </span>
                      </div>

                      <button
                        onClick={() => setNavigatingShelter(shl)}
                        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded font-bold border transition-all ${
                          isNav
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-[#102235] text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20'
                        }`}
                      >
                        <Navigation className="w-3 h-3" />
                        <span>{isNav ? 'Navigating' : 'Directions'}</span>
                      </button>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Occupancy: {shl.occupancy} / {shl.capacity}</span>
                      <span className={occupancyPct > 80 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                        {occupancyPct}% Full
                      </span>
                    </div>
                    <div className="w-full bg-[#121F30] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${occupancyPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {navigatingShelter && (
            <div className="mt-4 p-3 rounded-lg bg-[#064E3B]/30 border border-emerald-500/50 text-xs">
              <span className="font-bold text-emerald-300 block mb-1">
                📍 Active Safe Bypass Route to {navigatingShelter.name}
              </span>
              <p className="text-slate-300 text-[11px]">
                Proceed via Sirwani Bypass &rarr; Take Left at Namchi Junction &rarr; Avoid NH-10 River Road. Est. Time: 14 mins.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
