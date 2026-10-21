import React, { useState, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { MapCanvas } from "@/components/flood/MapCanvas";
import { getAllMapMarkers, useFlood } from "@/lib/flood/FloodProvider";
import { AppleDynamicIsland } from "./AppleDynamicIsland";
import { AppleFloatingDock, RainTabType } from "./AppleFloatingDock";
import { AppleDrawerSheet } from "./AppleDrawerSheet";
import type { MapMarker, MapLayer, GeoPoint } from "@/lib/flood/types";

export function RainMapScreen() {
  const { reports, language, cachedAt } = useFlood();
  const [activeTab, setActiveTab] = useState<RainTabType>("rainfall");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isExpandedFull, setIsExpandedFull] = useState(false);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);

  // Default active layers for the map
  const [layers] = useState<Record<MapLayer, boolean>>({
    rain: true,
    risk: true,
    rescue: true,
    water: true,
    infrastructure: true,
    relief: true,
    reports: true,
    imd: true,
    wind: true,
    route: true,
  });

  const markers = useMemo(() => getAllMapMarkers(reports), [reports, cachedAt]);

  const handleTabSelect = (tab: RainTabType) => {
    setActiveTab(tab);
    if (!isDrawerOpen) setIsDrawerOpen(true);
  };

  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  const toggleExpand = () => {
    setIsExpandedFull((prev) => !prev);
  };

  const handleMarkerPress = (marker: MapMarker) => {
    setFocusCoords([marker.latitude, marker.longitude]);
    if (marker.type === "reservoir") {
      setActiveTab("dams");
      setIsDrawerOpen(true);
    } else if (marker.type === "infrastructure") {
      setActiveTab("impact");
      setIsDrawerOpen(true);
    } else if (marker.type === "report") {
      setActiveTab("sos");
      setIsDrawerOpen(true);
    }
  };

  return (
    <View style={styles.shell}>
      <StatusBar style="light" />

      {/* ── Background: Original High-Res Satellite Map Canvas ── */}
      <View style={StyleSheet.absoluteFill}>
        <MapCanvas
          markers={markers}
          layers={layers}
          language={language}
          windDirectionDeg={140}
          windSpeedKmh={24}
          activeDistrictName="CHENNAI METRO"
          countdownFormatted="1h 45m"
          focusCoords={focusCoords}
          userLocation={{ latitude: 13.0827, longitude: 80.2707, accuracy: 20 }}
          onMarker={handleMarkerPress}
          onMapPress={(_point: GeoPoint) => {}}
          pinMode={false}
        />
      </View>

      {/* ── Top Apple Dynamic Island ── */}
      <AppleDynamicIsland
        onOpenSOS={() => handleTabSelect("sos")}
        onOpenDams={() => handleTabSelect("dams")}
      />

      {/* ── Apple-Grade Bottom Sheet Drawer ── */}
      <AppleDrawerSheet
        isOpen={isDrawerOpen}
        isExpandedFull={isExpandedFull}
        activeTab={activeTab}
        onToggleExpand={toggleExpand}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* ── Apple Floating Capsule Bottom Dock ── */}
      <AppleFloatingDock
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={toggleDrawer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
});
