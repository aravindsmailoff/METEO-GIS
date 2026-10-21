import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RainTabType } from "./AppleFloatingDock";
import { RainfallAlertPanel } from "./RainfallAlertPanel";
import { DamStatusPanel } from "./DamStatusPanel";
import { InfraImpactPanel } from "./InfraImpactPanel";
import { CitizenReportPanel } from "./CitizenReportPanel";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface AppleDrawerSheetProps {
  isOpen: boolean;
  isExpandedFull: boolean;
  activeTab: RainTabType;
  onToggleExpand: () => void;
  onClose: () => void;
}

export function AppleDrawerSheet({
  isOpen,
  isExpandedFull,
  activeTab,
  onToggleExpand,
  onClose,
}: AppleDrawerSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 1 : 0,
      friction: 9,
      tension: 50,
      useNativeDriver: false,
    }).start();
  }, [isOpen, slideAnim]);

  const targetHeight = isExpandedFull
    ? SCREEN_HEIGHT * 0.88
    : SCREEN_HEIGHT * 0.52;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case "rainfall":
        return "Doppler Rain Intelligence";
      case "dams":
        return "Dam Reservoir & Gate Discharge";
      case "impact":
        return "Infrastructure & Flood Impact";
      case "sos":
        return "Emergency SOS & Citizen Intelligence";
      default:
        return "Disaster Intelligence";
    }
  };

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        {
          height: targetHeight,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={isOpen ? "box-none" : "none"}
    >
      {/* ── Sheet background catches all touches on the visible card ── */}
      <View style={styles.sheetInner}>
        {/* Specular hairline top rim */}
        <View style={styles.specularRim} pointerEvents="none" />

        {/* ── Grab Handle & Header ── */}
        <View style={styles.headerArea}>
          {/* Grab Handle */}
          <Pressable
            onPress={onToggleExpand}
            hitSlop={12}
            style={styles.handleHitbox}
          >
            <View style={styles.handleBar} />
          </Pressable>

          {/* Title Bar */}
          <View style={styles.titleRow}>
            <View style={styles.titleBadgeGroup}>
              <Text style={styles.titleText}>{getTabTitle()}</Text>
              <View style={styles.liveTag}>
                <Text style={styles.liveTagText}>LIVE</Text>
              </View>
            </View>

            {/* Controls: Full Expand & Minimize */}
            <View style={styles.headerBtnsRow}>
              <Pressable
                onPress={onToggleExpand}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name={isExpandedFull ? "contract" : "expand"}
                  size={14}
                  color="rgba(255, 255, 255, 0.75)"
                />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && { opacity: 0.7 },
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name="chevron-down"
                  size={17}
                  color="rgba(255, 255, 255, 0.75)"
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* ── Scrollable Panel Content ── */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 80 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "rainfall" && <RainfallAlertPanel />}
          {activeTab === "dams" && <DamStatusPanel />}
          {activeTab === "impact" && <InfraImpactPanel />}
          {activeTab === "sos" && <CitizenReportPanel />}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 150,
    overflow: "visible",
  },
  sheetInner: {
    flex: 1,
    backgroundColor: "rgba(14, 14, 20, 0.96)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -16 },
    shadowOpacity: 0.75,
    shadowRadius: 40,
    elevation: 30,
    overflow: "hidden",
  },
  specularRim: {
    position: "absolute",
    top: 0,
    left: 32,
    right: 32,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  headerArea: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  handleHitbox: {
    alignItems: "center",
    paddingVertical: 4,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.32)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  titleBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  liveTag: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveTagText: {
    fontSize: 9,
    fontFamily: "monospace",
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.7)",
  },
  headerBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
