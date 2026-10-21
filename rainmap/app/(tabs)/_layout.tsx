import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FloodProvider, useFlood } from "@/lib/flood/FloodProvider";
import { copy } from "@/lib/i18n/copy";
import { SF_PRO } from "@/components/flood/ui";

import { ReactBitsBackground } from "@/components/meteo/ReactBitsBackground";

import React, { useState } from "react";
import { EmergencyAssistanceModal } from "@/components/meteo/EmergencyAssistanceModal";

function GlassFloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language } = useFlood();
  const [sosModalOpen, setSosModalOpen] = useState(false);

  const tabMeta: Record<
    string,
    {
      labelKey: "map" | "impact" | "reports" | "myArea";
      iconActive: keyof typeof Ionicons.glyphMap;
      iconInactive: keyof typeof Ionicons.glyphMap;
    }
  > = {
    index: { labelKey: "map", iconActive: "map", iconInactive: "map-outline" },
    impact: { labelKey: "impact", iconActive: "stats-chart", iconInactive: "stats-chart-outline" },
    reports: { labelKey: "reports", iconActive: "alert-circle", iconInactive: "alert-circle-outline" },
    area: { labelKey: "myArea", iconActive: "location", iconInactive: "location-outline" },
  };

  return (
    <>
      <View
        style={[
          styles.floatingBarContainer,
          { bottom: Platform.OS === "web" ? 14 : Math.max(insets.bottom, 12) },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const meta = tabMeta[route.name] || {
            labelKey: "map",
            iconActive: "map",
            iconInactive: "map-outline",
          };
          const label = copy(language, meta.labelKey);

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <React.Fragment key={route.key}>
              {/* Center Prominent Apple Emergency SOS Action Button */}
              {index === 2 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Trigger Emergency SOS"
                  onPress={() => setSosModalOpen(true)}
                  style={({ pressed }) => [
                    styles.centerSosTabBtn,
                    pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
                  ]}
                >
                  <View style={styles.centerSosBeaconDot} />
                  <Ionicons name="warning" size={16} color="#FFFFFF" />
                  <Text style={styles.centerSosLabel}>SOS</Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={`${label} tab`}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabButton,
                  isFocused && styles.tabButtonActive,
                  pressed && styles.tabButtonPressed,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isFocused ? meta.iconActive : meta.iconInactive}
                    size={18}
                    color={isFocused ? "#0A84FF" : "rgba(255, 255, 255, 0.45)"}
                  />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {label}
                </Text>
                {isFocused ? <View style={styles.tabGlowPip} /> : null}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      <EmergencyAssistanceModal
        visible={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </>
  );
}

function CitizenTabs() {
  return (
    <View style={styles.rootLayout}>
      <ReactBitsBackground />
      <Tabs
        tabBar={(props) => <GlassFloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          freezeOnBlur: false,
          lazy: false,
          sceneStyle: { backgroundColor: "#030712" },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="impact" />
        <Tabs.Screen name="reports" />
        <Tabs.Screen name="area" />
      </Tabs>
    </View>
  );
}

export default function TabLayout() {
  return (
    <FloodProvider>
      <CitizenTabs />
    </FloodProvider>
  );
}

const styles = StyleSheet.create({
  rootLayout: {
    flex: 1,
    backgroundColor: "#000000",
  },
  floatingBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(28, 28, 30, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 25,
    zIndex: 99,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          boxShadow:
            "0 12px 36px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.22)",
        } as any)
      : {}),
  },
  tabButton: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 4,
    marginHorizontal: 3,
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
        } as any)
      : {}),
  },
  tabButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.82,
  },
  iconContainer: {
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 10.5,
    fontWeight: "700",
    fontFamily: SF_PRO,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  tabGlowPip: {
    position: "absolute",
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#0A84FF",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 0 6px #0A84FF",
        } as any)
      : {}),
  },
  centerSosTabBtn: {
    height: 52,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: "#FF453A",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    shadowColor: "#FF453A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 4px 16px rgba(255, 69, 58, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
        } as any)
      : {}),
  },
  centerSosBeaconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
    marginBottom: 2,
  },
  centerSosLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
});
