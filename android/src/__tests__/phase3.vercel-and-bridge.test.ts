import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import vm from 'vm';
import { describe, expect, it } from 'vitest';
import {
  API_ROUTES,
  LOCAL_DEV_API_URL,
  PRODUCTION_API_URL,
  resolveApiBase,
  setCustomApiBase,
} from '../config/api';
import { validateAnalyticsBridgeMessage } from '../safety/webviewBridge';

function collectSourceFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') {
        results.push(...collectSourceFiles(full));
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

describe('Phase 3 Vercel Production Configuration, Shared Caller Audit & WebView Security Suite', () => {
  it('configures shared production URL to `https://meteo-gis.vercel.app` by default across Android while keeping `http://10.0.2.2:3000` strictly opt-in for local dev', () => {
    setCustomApiBase(null);
    expect(PRODUCTION_API_URL).toBe('https://meteo-gis.vercel.app');
    expect(LOCAL_DEV_API_URL).toBe('http://10.0.2.2:3000');

    // Default native Android (both debug and release) connects directly to deployed Vercel HTTPS API
    expect(resolveApiBase({ isDev: true, platformOs: 'android', useLocalDevApi: false })).toBe(
      'https://meteo-gis.vercel.app'
    );
    expect(resolveApiBase({ isDev: false, platformOs: 'android', useLocalDevApi: false })).toBe(
      'https://meteo-gis.vercel.app'
    );

    // Local emulator URL used ONLY when explicitly requested in intentional dev mode
    expect(resolveApiBase({ isDev: true, platformOs: 'android', useLocalDevApi: true })).toBe(
      'http://10.0.2.2:3000'
    );
    // Even if `useLocalDevApi: true` were left set accidentally, release mode (`isDev: false`) still enforces HTTPS prod!
    expect(resolveApiBase({ isDev: false, platformOs: 'android', useLocalDevApi: true })).toBe(
      'https://meteo-gis.vercel.app'
    );
  });

  it('verifies every single route in `API_ROUTES` has >= 1 caller in `android/src` and no file hardcodes rogue `localhost` or `10.0.2.2` URLs outside `config/api.ts`', () => {
    const srcRoot = path.resolve(__dirname, '..');
    const files = collectSourceFiles(srcRoot);
    const combinedExceptConfig = files
      .filter((f) => !f.endsWith(path.join('config', 'api.ts')))
      .map((f) => fs.readFileSync(f, 'utf-8'))
      .join('\n');

    // Zero hardcoded localhost/emulator calls outside `config/api.ts` (except UI display labels in SettingsScreen)
    for (const file of files) {
      if (
        file.endsWith(path.join('config', 'api.ts')) ||
        file.endsWith('SettingsScreen.tsx')
      ) {
        continue;
      }
      const text = fs.readFileSync(file, 'utf-8');
      expect(text).not.toContain('10.0.2.2');
      expect(text).not.toContain('http://localhost');
    }

    // Every single exported route builder in `API_ROUTES` is actively called in `android/src`
    for (const routeKey of Object.keys(API_ROUTES)) {
      expect(combinedExceptConfig).toContain(`API_ROUTES.${routeKey}`);
    }
  });

  it('validates WebView `postMessage` bridge origins and whitelisted IMD radar stations strictly', () => {
    const targetUri =
      'https://meteo-gis.vercel.app/mobile-analytics?state=Tamil+Nadu&district=Chennai';

    // Valid Vercel origin + valid DWR station
    const okMsg = validateAnalyticsBridgeMessage({
      rawData: JSON.stringify({ type: 'OPEN_RADAR', stationCode: 'KKL' }),
      messageOrigin: 'https://meteo-gis.vercel.app',
      targetUri,
    });
    expect(okMsg).toEqual({ valid: true, type: 'OPEN_RADAR', stationCode: 'kkl' });

    // Cross-origin attacker rejected
    const badOrigin = validateAnalyticsBridgeMessage({
      rawData: JSON.stringify({ type: 'OPEN_RADAR', stationCode: 'kkl' }),
      messageOrigin: 'https://attacker.evil.org',
      targetUri,
    });
    expect(badOrigin.valid).toBe(false);

    // Unapproved station code rejected
    const badStation = validateAnalyticsBridgeMessage({
      rawData: JSON.stringify({ type: 'OPEN_RADAR', stationCode: '../../etc/passwd' }),
      messageOrigin: 'https://meteo-gis.vercel.app',
      targetUri,
    });
    expect(badStation.valid).toBe(false);

    // Unsupported message type rejected
    const badType = validateAnalyticsBridgeMessage({
      rawData: JSON.stringify({ type: 'EXEC_CMD', stationCode: 'kkl' }),
      messageOrigin: 'https://meteo-gis.vercel.app',
      targetUri,
    });
    expect(badType.valid).toBe(false);
  });

  it('compiles a minified Android production JS bundle containing ZERO local development URLs (`10.0.2.2`, `127.0.0.1`, `http://localhost:3000`, `METEOGIS_PROD_API_URL`)', () => {
    const androidProjectRoot = path.resolve(__dirname, '../..');
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'meteogis-prod-bundle-'));
    const bundlePath = path.join(tmpDir, 'index.android.bundle');

    try {
      execFileSync(
        'npx',
        [
          'react-native',
          'bundle',
          '--platform',
          'android',
          '--dev',
          'false',
          '--minify',
          'true',
          '--entry-file',
          'index.js',
          '--bundle-output',
          bundlePath,
        ],
        { cwd: androidProjectRoot, stdio: 'pipe', timeout: 40000 }
      );

      const bundleText = fs.readFileSync(bundlePath, 'utf-8');
      expect(bundleText).toContain('https://meteo-gis.vercel.app');
      expect(bundleText).not.toContain('http://10.0.2.2:3000');
      expect(bundleText).not.toContain('http://127.0.0.1:3000');
      expect(bundleText).not.toContain('http://localhost:3000');
      expect(bundleText).not.toContain('10.0.2.2');
      expect(bundleText).not.toContain('127.0.0.1');
      expect(bundleText).not.toContain('METEOGIS_PROD_API_URL');

      // Execute the compiled release bundle inside a strict React Native Hermes environment
      // WITHOUT Node's WHATWG `URL` global so `Libraries/Blob/URL.js` runs identically to Android devices.
      const capturedExceptions: string[] = [];
      const dispatchedUrls: string[] = [];
      const defaultStub = new Proxy(() => false, {
        get(_t, p) {
          if (p === 'getConstants') return () => ({ HEIGHT: 24, isRTL: false });
          if (p === 'enableMicrotasks') return () => false;
          if (p === 'then') return undefined;
          return (...args: any[]) => {
            const cb = args.find((a) => typeof a === 'function');
            if (cb) cb(null, []);
            return false;
          };
        },
      });

      const ctx: Record<string, any> = {
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        HermesInternal: { hasPromise: () => true, enablePromiseRejectionTracker: () => {} },
        Promise,
        queueMicrotask,
        TextEncoder,
        TextDecoder,
        AbortController,
        nativeLoggingHook: () => {},
        nativeModuleProxy: new Proxy(
          {
            SourceCode: { getConstants: () => ({ scriptURL: 'assets://index.android.bundle' }) },
            DeviceInfo: {
              getConstants: () => ({
                Dimensions: {
                  windowPhysicalPixels: { width: 1080, height: 2400, scale: 2.75, fontScale: 1, densityDpi: 440 },
                  screenPhysicalPixels: { width: 1080, height: 2400, scale: 2.75, fontScale: 1, densityDpi: 440 },
                },
              }),
            },
            PlatformConstants: {
              getConstants: () => ({
                isTesting: false,
                reactNativeVersion: { major: 0, minor: 76, patch: 6 },
                Version: 34,
                osVersion: '14',
                Brand: 'google',
                Model: 'Pixel 6',
                uiMode: 'normal',
              }),
            },
            UIManager: {
              getConstants: () => ({}),
              getViewManagerConfig: () => ({ Commands: {}, NativeProps: {}, directEventTypes: {}, bubblingEventTypes: {} }),
              hasViewManagerConfig: () => true,
              createView: () => {},
              updateView: () => {},
              manageChildren: () => {},
              setChildren: () => {},
              dispatchViewManagerCommand: () => {},
              measure: (_t: any, cb: any) => cb(0, 0, 392, 872, 0, 0),
              measureInWindow: (_t: any, cb: any) => cb(0, 0, 392, 872),
            },
            Networking: {
              addListener: () => {},
              removeListeners: () => {},
              abortRequest: () => {},
              sendRequest: (query: any, cb: any) => {
                if (query?.url) dispatchedUrls.push(query.url);
                if (typeof cb === 'function') cb(1);
              },
            },
            Timing: {
              createTimer: (id: number, dur: number) => {
                setTimeout(() => {
                  try {
                    ctx.__fbBatchedBridge.callFunctionReturnFlushedQueue('JSTimers', 'callTimers', [[id]]);
                  } catch {}
                }, Math.min(dur || 1, 20));
              },
              deleteTimer: () => {},
              setSendIdleEvents: () => {},
            },
            AppState: {
              getConstants: () => ({ initialAppState: 'active' }),
              getCurrentAppState: (cb: any) => cb({ app_state: 'active' }),
              addListener: () => {},
              removeListeners: () => {},
            },
            AsyncLocalStorage: { multiGet: (_k: any, cb: any) => cb(null, []), multiSet: (_kv: any, cb: any) => cb(null), multiRemove: (_k: any, cb: any) => cb(null) },
            RNCAsyncStorage: { multiGet: (_k: any, cb: any) => cb(null, []), multiSet: (_kv: any, cb: any) => cb(null), multiRemove: (_k: any, cb: any) => cb(null) },
            RNCNetInfo: { getCurrentState: () => Promise.resolve({ type: 'wifi', isConnected: true, isInternetReachable: true }), addListener: () => {}, removeListeners: () => {} },
            MLRNModule: { EventTypes: {}, OfflinePackDownloadState: {}, StyleSource: {}, CameraModes: {}, LineJoin: {}, setAccessToken: () => Promise.resolve(null) },
            MeteoAppConfig: {
              PROD_API_URL: 'https://meteo-gis.vercel.app',
              BUILD_TYPE: 'release',
              DEBUG: false,
              getConstants: () => ({ PROD_API_URL: 'https://meteo-gis.vercel.app', BUILD_TYPE: 'release', DEBUG: false }),
            },
            ExceptionsManager: {
              reportException: (data: any) => capturedExceptions.push(String(data?.message)),
              reportFatalException: (msg: any) => capturedExceptions.push(String(msg)),
              reportSoftException: () => {},
            },
          },
          { get: (t: any, p: string) => (p in t ? t[p] : defaultStub) }
        ),
        __fbBatchedBridgeConfig: { remoteModuleConfig: [] },
        nativeFabricUIManager: undefined,
        window: undefined,
      };
      ctx.global = ctx;
      ctx.globalThis = ctx;

      vm.runInNewContext(bundleText, ctx);
      ctx.__fbBatchedBridge.callFunctionReturnFlushedQueue('AppRegistry', 'runApplication', [
        'MeteoGIS',
        { rootTag: 1, initialProps: {} },
      ]);
      expect(capturedExceptions).toEqual([]);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
