import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { setCustomApiBase } from '../config/api';
import {
  ActiveRouteOverlay,
  BaseMapId,
  BottomSheetSnap,
  CityHotspotPinpoint,
  InspectorTab,
  LayerPreferences,
  OperationalMode,
  PluvialFloodZone,
  SelectedLocationEvidence,
} from '../types/meteo';
import { QUICK_STATES, resolveNearestRadar } from '../data/indiaGeoCatalog';

const PREFS_STORAGE_KEY = '@meteogis_user_prefs_v1';

export interface CameraTargetCommand {
  lat: number;
  lng: number;
  zoom: number;
  padForHalfSheet: boolean;
  nonce: number;
}

interface AppState {
  // Territory & Operational Mode
  selectedState: string;
  defaultTerritory: string;
  operationalMode: OperationalMode;
  isHazardFocusOnly: boolean;

  // Map Camera Command Queue
  cameraCommand: CameraTargetCommand;

  // Selection & Inspector Context
  selectedAlertId: string | null;
  selectedWarningObjId: string | null;
  selectedPluvialZone: PluvialFloodZone | null;
  selectedHotspot: CityHotspotPinpoint | null;
  selectedEvidence: SelectedLocationEvidence | null;
  activeZoneStepperIndex: number;
  activeRadarStationCode: string;
  activeRouteOverlay: ActiveRouteOverlay | null;

  // Mutual-Exclusion UI Surface State
  bottomSheetSnap: BottomSheetSnap;
  activeTab: InspectorTab;
  isTopStripExpanded: boolean;
  isDrawerOpen: boolean;
  isRadarModalOpen: boolean;
  isSatelliteModalOpen: boolean;
  isSearchModalOpen: boolean;
  isSystemInfoOpen: boolean;

  // Persisted Layer Preferences
  layerConfig: LayerPreferences;

  // Device / QA Settings
  notificationsEnabled: boolean;
  customApiUrl: string;
  simulateOfflineMode: boolean;
  useReferenceFallbackWhenUpstreamDown: boolean;
  refreshNonce: number;

  // Actions
  hydratePreferences: () => Promise<void>;
  setSelectedState: (stateName: string) => void;
  setDefaultTerritory: (stateName: string) => Promise<void>;
  setOperationalMode: (mode: OperationalMode) => void;
  toggleHazardFocusOnly: () => void;

  flyToLocation: (lat: number, lng: number, zoom?: number, padForHalfSheet?: boolean) => void;
  resetNationalView: () => void;
  handleEmptyMapTap: () => void;

  setBottomSheetSnap: (snap: BottomSheetSnap) => void;
  setActiveTab: (tab: InspectorTab) => void;
  setTopStripExpanded: (expanded: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setActiveZoneStepperIndex: (index: number) => void;

  openRadarModal: (stationCode?: string) => void;
  closeRadarModal: () => void;
  openSatelliteModal: () => void;
  closeSatelliteModal: () => void;
  setSearchModalOpen: (open: boolean) => void;
  setSystemInfoOpen: (open: boolean) => void;

  selectEvidenceAndRoute: (params: {
    evidence: SelectedLocationEvidence;
    targetTab: InspectorTab;
    alertId?: string | null;
    warningObjId?: string | null;
    pluvialZone?: PluvialFloodZone | null;
    hotspot?: CityHotspotPinpoint | null;
    zoom?: number;
  }) => void;
  clearSelection: () => void;

  setBaseMap: (baseMap: BaseMapId) => void;
  toggleOverlay: (key: keyof Omit<LayerPreferences, 'baseMap'>) => void;
  setActiveRouteOverlay: (route: ActiveRouteOverlay | null) => void;

  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  updateCustomApiUrl: (url: string) => Promise<void>;
  setSimulateOfflineMode: (offline: boolean) => void;
  setUseReferenceFallbackWhenUpstreamDown: (enabled: boolean) => void;
  triggerGlobalRefresh: () => void;

  /**
   * Android Hardware Back Priority Stack:
   * Modal -> Drawer -> Expanded Top Strip -> Sheet (Full -> Half -> Collapsed) -> Navigation
   */
  handleHardwareBackPress: () => boolean;
}

const DEFAULT_LAYERS: LayerPreferences = {
  baseMap: 'nasa_clouds',
  showDistrictWarnings: true,
  showLiveRainfall: true,
  showAwsStations: true,
  showDwrRings: true,
  showPluvialFloodLayer: true,
};

async function savePrefsSnapshot(partial: Record<string, any>) {
  try {
    const existingRaw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify({ ...existing, ...partial }));
  } catch {
    // Ignore storage write errors gracefully
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedState: 'All India',
  defaultTerritory: 'All India',
  operationalMode: 'LIVE',
  isHazardFocusOnly: false,

  cameraCommand: {
    lat: 22.4,
    lng: 79.2,
    zoom: 4.3,
    padForHalfSheet: false,
    nonce: 1,
  },

  selectedAlertId: null,
  selectedWarningObjId: null,
  selectedPluvialZone: null,
  selectedHotspot: null,
  selectedEvidence: null,
  activeZoneStepperIndex: 0,
  activeRadarStationCode: 'kkl',
  activeRouteOverlay: null,

  bottomSheetSnap: 'collapsed',
  activeTab: 'overview',
  isTopStripExpanded: false,
  isDrawerOpen: false,
  isRadarModalOpen: false,
  isSatelliteModalOpen: false,
  isSearchModalOpen: false,
  isSystemInfoOpen: false,

  layerConfig: DEFAULT_LAYERS,

  notificationsEnabled: false,
  customApiUrl: '',
  simulateOfflineMode: false,
  useReferenceFallbackWhenUpstreamDown: true,
  refreshNonce: 1,

  hydratePreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.customApiUrl) {
        setCustomApiBase(parsed.customApiUrl);
      }
      const territory = parsed.defaultTerritory || 'All India';
      const stateMeta = QUICK_STATES.find((s) => s.name === territory) || QUICK_STATES[0];
      set({
        layerConfig: parsed.layerConfig ? { ...DEFAULT_LAYERS, ...parsed.layerConfig } : DEFAULT_LAYERS,
        defaultTerritory: territory,
        selectedState: territory,
        notificationsEnabled: Boolean(parsed.notificationsEnabled),
        customApiUrl: parsed.customApiUrl || '',
        cameraCommand: {
          lat: stateMeta.lat,
          lng: stateMeta.lng,
          zoom: stateMeta.zoom,
          padForHalfSheet: false,
          nonce: Date.now(),
        },
      });
    } catch {
      // Defaults remain intact if corrupt cache
    }
  },

  setSelectedState: (stateName: string) => {
    const found = QUICK_STATES.find(
      (s) => s.name.toLowerCase() === stateName.toLowerCase()
    );
    const radar = found ? resolveNearestRadar(found.lat, found.lng) : null;
    set((prev) => ({
      selectedState: stateName,
      activeZoneStepperIndex: 0,
      selectedEvidence: stateName === 'All India' ? null : prev.selectedEvidence,
      activeRadarStationCode: radar ? radar.code : prev.activeRadarStationCode,
      cameraCommand: found
        ? {
            lat: found.lat,
            lng: found.lng,
            zoom: found.zoom,
            padForHalfSheet: prev.bottomSheetSnap === 'half',
            nonce: Date.now(),
          }
        : prev.cameraCommand,
    }));
  },

  setDefaultTerritory: async (stateName: string) => {
    await savePrefsSnapshot({ defaultTerritory: stateName });
    get().setSelectedState(stateName);
    set({ defaultTerritory: stateName });
  },

  setOperationalMode: (mode: OperationalMode) => set({ operationalMode: mode }),

  toggleHazardFocusOnly: () => set((s) => ({ isHazardFocusOnly: !s.isHazardFocusOnly })),

  flyToLocation: (lat: number, lng: number, zoom = 9.5, padForHalfSheet = false) => {
    const nearestRadar = resolveNearestRadar(lat, lng);
    set({
      activeRadarStationCode: nearestRadar.code,
      cameraCommand: {
        lat,
        lng,
        zoom,
        padForHalfSheet,
        nonce: Date.now(),
      },
    });
  },

  resetNationalView: () => {
    set((prev) => ({
      selectedState: 'All India',
      selectedAlertId: null,
      selectedWarningObjId: null,
      selectedPluvialZone: null,
      selectedHotspot: null,
      selectedEvidence: null,
      activeRouteOverlay: null,
      isTopStripExpanded: false,
      bottomSheetSnap: 'collapsed',
      layerConfig: { ...prev.layerConfig, baseMap: 'nasa_clouds' },
      cameraCommand: {
        lat: 22.4,
        lng: 79.2,
        zoom: 4.3,
        padForHalfSheet: false,
        nonce: Date.now(),
      },
    }));
  },

  handleEmptyMapTap: () => {
    // Spec Section 5: Tap empty map -> does NOT move sheet, collapses expanded strip & returns strip summary
    set((prev) => ({
      isTopStripExpanded: false,
      selectedAlertId: prev.bottomSheetSnap === 'collapsed' ? null : prev.selectedAlertId,
    }));
  },

  setBottomSheetSnap: (snap: BottomSheetSnap) => {
    set((prev) => ({
      bottomSheetSnap: snap,
      // Auto-collapse TopHazardStrip and LayerDrawer whenever BottomSheet enters FULL
      isTopStripExpanded: snap === 'full' ? false : prev.isTopStripExpanded,
      isDrawerOpen: snap === 'full' ? false : prev.isDrawerOpen,
    }));
  },

  setActiveTab: (tab: InspectorTab) => set({ activeTab: tab }),

  setTopStripExpanded: (expanded: boolean) =>
    set((prev) => ({
      isTopStripExpanded: expanded,
      isDrawerOpen: expanded ? false : prev.isDrawerOpen,
    })),

  setDrawerOpen: (open: boolean) =>
    set((prev) => ({
      isDrawerOpen: open,
      isTopStripExpanded: open ? false : prev.isTopStripExpanded,
      bottomSheetSnap: open && prev.bottomSheetSnap === 'full' ? 'collapsed' : prev.bottomSheetSnap,
    })),

  setActiveZoneStepperIndex: (index: number) => set({ activeZoneStepperIndex: index }),

  openRadarModal: (stationCode?: string) =>
    set((prev) => ({
      isRadarModalOpen: true,
      isDrawerOpen: false,
      isTopStripExpanded: false,
      activeRadarStationCode: stationCode || prev.activeRadarStationCode,
    })),

  closeRadarModal: () => set({ isRadarModalOpen: false }),

  openSatelliteModal: () =>
    set({
      isSatelliteModalOpen: true,
      isDrawerOpen: false,
      isTopStripExpanded: false,
    }),

  closeSatelliteModal: () => set({ isSatelliteModalOpen: false }),

  setSearchModalOpen: (open: boolean) =>
    set({
      isSearchModalOpen: open,
      isDrawerOpen: false,
      isTopStripExpanded: false,
    }),

  setSystemInfoOpen: (open: boolean) =>
    set({
      isSystemInfoOpen: open,
      isDrawerOpen: false,
      isTopStripExpanded: false,
    }),

  selectEvidenceAndRoute: ({
    evidence,
    targetTab,
    alertId = null,
    warningObjId = null,
    pluvialZone = null,
    hotspot = null,
    zoom = 9.5,
  }) => {
    const nextLayers = pluvialZone
      ? { ...get().layerConfig, baseMap: 'bhuvan_sat' as BaseMapId, showPluvialFloodLayer: true }
      : get().layerConfig;
    set({
      selectedEvidence: evidence,
      selectedAlertId: alertId,
      selectedWarningObjId: warningObjId,
      selectedPluvialZone: pluvialZone,
      selectedHotspot: hotspot,
      activeRadarStationCode: evidence.radarCode,
      bottomSheetSnap: 'half',
      activeTab: targetTab,
      isTopStripExpanded: false,
      isDrawerOpen: false,
      layerConfig: nextLayers,
      cameraCommand: {
        lat: evidence.lat,
        lng: evidence.lng,
        zoom: pluvialZone ? (hotspot ? 14.5 : 12.5) : zoom,
        padForHalfSheet: true,
        nonce: Date.now(),
      },
    });
  },

  clearSelection: () =>
    set({
      selectedAlertId: null,
      selectedWarningObjId: null,
      selectedPluvialZone: null,
      selectedHotspot: null,
      selectedEvidence: null,
      activeRouteOverlay: null,
      bottomSheetSnap: 'collapsed',
    }),

  setBaseMap: (baseMap: BaseMapId) => {
    const updated = { ...get().layerConfig, baseMap };
    set({ layerConfig: updated });
    savePrefsSnapshot({ layerConfig: updated });
  },

  toggleOverlay: (key: keyof Omit<LayerPreferences, 'baseMap'>) => {
    const prev = get().layerConfig;
    const updated = { ...prev, [key]: !prev[key] };
    set({ layerConfig: updated });
    savePrefsSnapshot({ layerConfig: updated });
  },

  setActiveRouteOverlay: (route: ActiveRouteOverlay | null) => set({ activeRouteOverlay: route }),

  setNotificationsEnabled: async (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    await savePrefsSnapshot({ notificationsEnabled: enabled });
  },

  updateCustomApiUrl: async (url: string) => {
    const cleaned = url.trim().replace(/\/+$/, '');
    setCustomApiBase(cleaned || null);
    set((prev) => ({ customApiUrl: cleaned, refreshNonce: prev.refreshNonce + 1 }));
    await savePrefsSnapshot({ customApiUrl: cleaned });
  },

  setSimulateOfflineMode: (offline: boolean) =>
    set((prev) => ({ simulateOfflineMode: offline, refreshNonce: prev.refreshNonce + 1 })),

  setUseReferenceFallbackWhenUpstreamDown: (enabled: boolean) =>
    set((prev) => ({
      useReferenceFallbackWhenUpstreamDown: enabled,
      refreshNonce: prev.refreshNonce + 1,
    })),

  triggerGlobalRefresh: () => set((prev) => ({ refreshNonce: prev.refreshNonce + 1 })),

  handleHardwareBackPress: () => {
    const s = get();
    if (s.isRadarModalOpen) {
      set({ isRadarModalOpen: false });
      return true;
    }
    if (s.isSatelliteModalOpen) {
      set({ isSatelliteModalOpen: false });
      return true;
    }
    if (s.isSearchModalOpen) {
      set({ isSearchModalOpen: false });
      return true;
    }
    if (s.isSystemInfoOpen) {
      set({ isSystemInfoOpen: false });
      return true;
    }
    if (s.isDrawerOpen) {
      set({ isDrawerOpen: false });
      return true;
    }
    if (s.isTopStripExpanded) {
      set({ isTopStripExpanded: false });
      return true;
    }
    if (s.bottomSheetSnap === 'full') {
      set({ bottomSheetSnap: 'half' });
      return true;
    }
    if (s.bottomSheetSnap === 'half') {
      set({ bottomSheetSnap: 'collapsed' });
      return true;
    }
    return false;
  },
}));
