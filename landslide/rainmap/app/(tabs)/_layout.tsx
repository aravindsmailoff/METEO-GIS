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

function DockedBottomTabBar({ state, descriptors, navigation }: any) {
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
          styles.dockedBarContainer,
          {
            paddingBottom: Platform.OS === "web" ? 8 : Math.max(insets.bottom, 6),
          },
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
                  <Ionicons name="warning" size={15} color="#FFFFFF" />
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
                    size={19}
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
        tabBar={(props) => <DockedBottomTabBar {...props} />}
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
  dockedBarContainer: {
    width: "100%",
    backgroundColor: "#0B0F19",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 6,
    zIndex: 99,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.6)",
        } as any)
      : {
          elevation: 16,
        }),
  },
  tabButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 2,
    marginHorizontal: 2,
    position: "relative",
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  tabButtonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.82,
  },
  iconContainer: {
    height: 22,
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
    bottom: 1,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 8,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 4px 16px rgba(255, 59, 48, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.45)",
        } as any)
      : {}),
  },
  centerSosBeaconDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginBottom: 1,
  },
  centerSosLabel: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
    fontFamily: SF_PRO,
  },
});
