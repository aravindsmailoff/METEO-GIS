import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RainTabType = "rainfall" | "dams" | "impact" | "sos";

interface AppleFloatingDockProps {
  activeTab: RainTabType | null;
  onSelectTab: (tab: RainTabType) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
}

const TABS: {
  id: RainTabType;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  isCommunity?: boolean;
  communityName?: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
  badgeColor: string;
}[] = [
  {
    id: "rainfall",
    label: "Rainfall",
    iconName: "rainy",
    badge: "92mm",
    badgeColor: "#ef4444",
  },
  {
    id: "dams",
    label: "Dams",
    iconName: "water",
    isCommunity: true,
    communityName: "waves",
    badge: "91%",
    badgeColor: "#f97316",
  },
  {
    id: "impact",
    label: "Impact",
    iconName: "shield",
    isCommunity: true,
    communityName: "shield-alert",
    badge: "4 cut",
    badgeColor: "#fbbf24",
  },
  {
    id: "sos",
    label: "SOS",
    iconName: "help-buoy",
    badge: "LIVE",
    badgeColor: "#ef4444",
  },
];

export function AppleFloatingDock({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  onToggleDrawer,
}: AppleFloatingDockProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "web" ? 18 : Math.max(insets.bottom, 12);

  return (
    <View
      style={[styles.floatingAnchor, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      {/* ── Main Nav Capsule ── */}
      <View style={styles.dockCapsule}>
        {/* Specular hairline highlight */}
        <View style={styles.specularBorder} pointerEvents="none" />

        {TABS.map((tab) => {
          const isActive = activeTab === tab.id && isDrawerOpen;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              style={({ pressed }) => [
                styles.tabButton,
                isActive && styles.tabButtonActive,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${tab.label} Intelligence Tab`}
            >
              {tab.isCommunity && tab.communityName ? (
                <MaterialCommunityIcons
                  name={tab.communityName}
                  size={15}
                  color={isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.6)"}
                />
              ) : (
                <Ionicons
                  name={tab.iconName}
                  size={15}
                  color={isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.6)"}
                />
              )}

              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>

              {/* Micro Status Badge */}
              {tab.badge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: `${tab.badgeColor}22`,
                      borderColor: `${tab.badgeColor}55`,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: tab.badgeColor }]}>
                    {tab.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Drawer Toggle Pill (Eye / EyeOff) ── */}
      <Pressable
        onPress={onToggleDrawer}
        style={({ pressed }) => [
          styles.drawerToggleBtn,
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isDrawerOpen ? "Maximize Map" : "Show Intelligence Drawer"}
      >
        <Ionicons
          name={isDrawerOpen ? "eye-off" : "eye"}
          size={17}
          color={isDrawerOpen ? "#38bdf8" : "#ffffff"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingAnchor: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 250,
  },
  dockCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 5,
    borderRadius: 999,
    backgroundColor: "rgba(10, 10, 14, 0.88)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 36,
    elevation: 20,
  },
  specularBorder: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  tabButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    lineHeight: 11,
  },
  drawerToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10, 10, 14, 0.88)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.16)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.65,
    shadowRadius: 36,
    elevation: 20,
  },
});
