'use client';

import React, { useState } from 'react';
import { formatNumber } from '@/lib/utils';
import { 
  AlertTriangle, 
  Send, 
  Radio, 
  CheckCircle2, 
  FileCode, 
  Copy, 
  Layers, 
  MapPin, 
  X,
  ShieldAlert,
  Volume2,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CapAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIncidents?: any[];
  activeStormCells?: any[];
}

export const CapAlertModal: React.FC<CapAlertModalProps> = ({ isOpen, onClose }) => {
  const [headline, setHeadline] = useState('CRITICAL LANDSLIDE RED ALERT — NH-06 SEVERED');
  const [description, setDescription] = useState('Extreme pluvial saturation (>52 mm/h) and InSAR slope creep have triggered massive slope failure along NH-06 (Umiam–Umsning corridor). Over 16,000 m³ shale debris blocking all lanes.');
  const [instruction, setInstruction] = useState('Immediate evacuation of unstable gorge slopes. NH-06 is closed to heavy vehicular traffic. Divert via Umsning bypass. Report trapped vehicles via Citizen SOS.');
  const [severity, setSeverity] = useState('Extreme');
  const [urgency, setUrgency] = useState('Immediate');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['East Khasi Hills', 'Ri-Bhoi', 'South West Khasi Hills']);
  const [channels, setChannels] = useState<string[]>(['SMS_CELL_BROADCAST', 'CAP_XML_FEED', 'COMMUNITY_SIRENS', 'CITIZEN_APP_PUSH']);

  const [activeTab, setActiveTab] = useState<'compose' | 'xml' | 'preview'>('compose');
  const [isDispatched, setIsDispatched] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const toggleDistrict = (district: string) => {
    if (selectedDistricts.includes(district)) {
      setSelectedDistricts(selectedDistricts.filter((d) => d !== district));
    } else {
      setSelectedDistricts([...selectedDistricts, district]);
    }
  };

  const toggleChannel = (channel: string) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter((c) => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const handleDispatch = () => {
    setIsDispatched(true);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setIsDispatched(false);
      onClose();
    }, 2800);
  };

  const capXml = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>NER-CAP-${Date.now().toString(36).toUpperCase()}</identifier>
  <sender>ner-early-warning@ndma.gov.in</sender>
  <sent>${new Date().toISOString()}</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <category>Geo</category>
    <event>Landslide & Slope Failure Red Alert</event>
    <urgency>${urgency}</urgency>
    <severity>${severity}</severity>
    <certainty>Observed</certainty>
    <headline>${headline}</headline>
    <description>${description}</description>
    <instruction>${instruction}</instruction>
    <area>
      <areaDesc>${selectedDistricts.join(', ')}</areaDesc>
    </area>
  </info>
</alert>`;

  const copyXml = () => {
    navigator.clipboard.writeText(capXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="tactical-card tactical-card-danger w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-[#0A111C] border border-[#FF2A55]/40 shadow-[0_0_50px_rgba(255,42,85,0.25)] rounded-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#182B42] bg-[#070D16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-500 border border-red-500/40">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Multi-tier Alert Broadcast & OASIS CAP 1.2 Dispatcher
              </h3>
              <span className="text-xs text-slate-400">
                Authorized National Disaster Management Authority (NDMA) Gateway
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#122238] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#182B42] bg-[#09121E] text-xs">
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'compose' ? 'bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Compose Broadcast
          </button>
          <button
            onClick={() => setActiveTab('xml')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'xml' ? 'bg-cyan-500/20 text-[#00F0FF] border border-[#00F0FF]/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            CAP 1.2 XML Feed
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 lg:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {activeTab === 'compose' ? (
            <>
              {/* Severity & Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Alert Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2 text-white font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="Extreme">🔴 Extreme (Threat to life & property)</option>
                    <option value="Severe">🟠 Severe (Significant action required)</option>
                    <option value="Moderate">🟡 Moderate (Possible threat)</option>
                    <option value="Minor">🟢 Minor (Minimal threat)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Urgency Category</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2 text-white font-medium focus:outline-none focus:border-red-500"
                  >
                    <option value="Immediate">Immediate (Take action now)</option>
                    <option value="Expected">Expected (Action in next 1-2 hours)</option>
                    <option value="Future">Future (Action in next 6-12 hours)</option>
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Alert Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Description & Instruction */}
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Description & Threat Assessment</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Civil Action Instruction</label>
                <textarea
                  rows={2}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full bg-[#0E1B2C] border border-[#1E3758] rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* District Target Selector */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">Target Districts</label>
                <div className="flex flex-wrap gap-2">
                  {['East Khasi Hills', 'Ri-Bhoi', 'South West Khasi Hills', 'West Garo Hills', 'East Jaintia Hills', 'East Sikkim', 'Aizawl', 'Dima Hasao'].map((dist) => {
                    const isSel = selectedDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => toggleDistrict(dist)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          isSel ? 'bg-red-500/20 text-red-300 border-red-500' : 'bg-[#0E1B2C] text-slate-400 border-[#1E3758]'
                        }`}
                      >
                        {isSel ? '✓ ' : '+ '} {dist}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dispatch Channels */}
              <div>
                <label className="text-slate-400 block mb-1.5 font-semibold">Dispatch Broadcast Channels</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SMS_CELL_BROADCAST', label: '📱 SMS Cell Broadcast' },
                    { id: 'CAP_XML_FEED', label: '📡 OASIS CAP Feed' },
                    { id: 'COMMUNITY_SIRENS', label: '🚨 Physical Sirens' },
                    { id: 'CITIZEN_APP_PUSH', label: '🔔 Citizen App Push' },
                  ].map((ch) => {
                    const isSel = channels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChannel(ch.id)}
                        className={`p-2 rounded-lg text-left text-xs font-semibold border transition-all ${
                          isSel ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500' : 'bg-[#0E1B2C] text-slate-400 border-[#1E3758]'
                        }`}
                      >
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 font-mono text-[11px]">OASIS CAP 1.2 XML Stream Output</span>
                <button
                  onClick={copyXml}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#102235] text-cyan-400 border border-cyan-500/40 text-xs font-mono"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy XML'}
                </button>
              </div>
              <pre className="bg-[#050A12] border border-[#142336] p-3 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-[340px]">
                {capXml}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#182B42] bg-[#070D16] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Est. Reach: <strong className="text-white">{formatNumber(selectedDistricts.length * 28500)} citizens</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#0E1B2C] text-slate-300 hover:text-white border border-[#1E3758] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatch}
              disabled={isDispatched}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs shadow-lg transition-all ${
                isDispatched
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(255,42,85,0.4)]'
              }`}
            >
              {isDispatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> DISPATCHED TO NDMA & TELCOS
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> TRANSMIT RED ALERT BROADCAST
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
