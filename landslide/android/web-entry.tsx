import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

type DevicePreset = 'pixel' | 'compact' | 'fullscreen';

const PRESET_SPECS: Record<DevicePreset, { label: string; width: number; height: number; sub: string }> = {
  pixel: { label: 'Pixel 8 Pro', width: 412, height: 892, sub: '412 × 892 dp' },
  compact: { label: 'Small Android', width: 360, height: 780, sub: '360 × 780 dp (<360 edge test)' },
  fullscreen: { label: 'Full Viewport', width: 0, height: 0, sub: 'Responsive Fill' },
};

function SimulatorHost() {
  const [preset, setPreset] = useState<DevicePreset>('pixel');
  const [fontScale150, setFontScale150] = useState(false);
  const [isNarrowBrowser, setIsNarrowBrowser] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 560 : false
  );

  useEffect(() => {
    const onResize = () => setIsNarrowBrowser(window.innerWidth <= 560);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (isNarrowBrowser || preset === 'fullscreen') {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#020617',
          fontSize: fontScale150 ? '150%' : '100%',
        }}
      >
        {!isNarrowBrowser && (
          <div
            style={{
              height: 36,
              background: '#090f1d',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 14px',
              color: '#cbd5e1',
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            <span>MeteoGIS Android — Full Viewport Mode</span>
            <button
              onClick={() => setPreset('pixel')}
              style={{
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Return to Android Device Frame
            </button>
          </div>
        )}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          <App />
        </div>
      </div>
    );
  }

  const spec = PRESET_SPECS[preset];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at top, #0f172a 0%, #020617 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 12,
      }}
    >
      {/* Top Emulator Harness Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.92)',
          border: '1px solid #1e293b',
          borderRadius: 999,
          padding: '5px 12px',
          color: '#cbd5e1',
          fontSize: 11,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontWeight: 700, color: '#38bdf8', letterSpacing: 0.4 }}>
          ANDROID STUDIO PREVIEW HARNESS
        </span>
        <span style={{ color: '#475569' }}>|</span>
        {(['pixel', 'compact', 'fullscreen'] as DevicePreset[]).map((key) => {
          const active = preset === key;
          return (
            <button
              key={key}
              onClick={() => setPreset(key)}
              style={{
                background: active ? '#0284c7' : '#1e293b',
                color: active ? '#ffffff' : '#94a3b8',
                border: active ? '1px solid #38bdf8' : '1px solid #334155',
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {PRESET_SPECS[key].label} ({PRESET_SPECS[key].sub})
            </button>
          );
        })}
        <button
          onClick={() => setFontScale150((v) => !v)}
          style={{
            background: fontScale150 ? '#b45309' : '#1e293b',
            color: fontScale150 ? '#fffbeb' : '#94a3b8',
            border: fontScale150 ? '1px solid #f59e0b' : '1px solid #334155',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          150% Font Test: {fontScale150 ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Android Bezel */}
      <div
        style={{
          width: spec.width + 20,
          height: 'min(calc(100vh - 64px), ' + (spec.height + 28) + 'px)',
          background: '#0b1120',
          borderRadius: 34,
          padding: '14px 10px',
          border: '2px solid #334155',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 189, 248, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Android Status Bar Simulation */}
        <div
          style={{
            height: 22,
            background: '#020617',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            color: '#94a3b8',
            fontSize: 10,
            fontWeight: 600,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            flexShrink: 0,
          }}
        >
          <span>IST LIVE</span>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#1e293b',
              border: '1px solid #334155',
            }}
          />
          <span>5G · 98%</span>
        </div>

        {/* App Root */}
        <div
          style={{
            flex: 1,
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            borderBottomLeftRadius: 22,
            borderBottomRightRadius: 22,
            zoom: fontScale150 ? 1.08 : 1,
          }}
        >
          <App />
        </div>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<SimulatorHost />);
}
