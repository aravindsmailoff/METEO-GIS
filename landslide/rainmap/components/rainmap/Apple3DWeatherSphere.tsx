import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Animated, Easing } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
} from "react-native-svg";

interface Apple3DWeatherSphereProps {
  rainfallRate?: number;
  stormSeverity?: "extreme" | "severe" | "moderate";
}

export function Apple3DWeatherSphere({
  rainfallRate = 92.4,
  stormSeverity = "extreme",
}: Apple3DWeatherSphereProps) {
  const rotateAnim1 = useRef(new Animated.Value(0)).current;
  const rotateAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sweepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Orbital Ring Rotation 1
    const loop1 = Animated.loop(
      Animated.timing(rotateAnim1, {
        toValue: 360,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 2. Counter-Rotation Ring 2
    const loop2 = Animated.loop(
      Animated.timing(rotateAnim2, {
        toValue: -360,
        duration: 13000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 3. Radar Sweep
    const sweep = Animated.loop(
      Animated.timing(sweepAnim, {
        toValue: 360,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 4. Core Storm Pulse
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop1.start();
    loop2.start();
    sweep.start();
    pulse.start();

    return () => {
      loop1.stop();
      loop2.stop();
      sweep.stop();
      pulse.stop();
    };
  }, [rotateAnim1, rotateAnim2, sweepAnim, pulseAnim]);

  const spin1 = rotateAnim1.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  const spin2 = rotateAnim2.interpolate({
    inputRange: [-360, 0],
    outputRange: ["-360deg", "0deg"],
  });

  const sweepRotate = sweepAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* ── Base Sphere Layer ── */}
      <Svg width={220} height={176} viewBox="0 0 220 176">
        <Defs>
          {/* Sphere 3D Volume Gradient */}
          <RadialGradient id="sphereCore" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <Stop offset="45%" stopColor="#0284c7" stopOpacity="0.6" />
            <Stop offset="75%" stopColor="#082f49" stopOpacity="0.75" />
            <Stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
          </RadialGradient>

          {/* Atmosphere Outer Glow */}
          <RadialGradient id="atmoGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <Stop offset="65%" stopColor="#0284c7" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </RadialGradient>

          {/* Storm Red Warning Flare */}
          <RadialGradient id="stormFlare" cx="35%" cy="35%" r="50%">
            <Stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
            <Stop offset="80%" stopColor="transparent" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Ambient Glow */}
        <Circle cx={110} cy={88} r={84} fill="url(#atmoGlow)" />

        {/* Outer Storm Ring */}
        <Circle
          cx={110}
          cy={88}
          r={68}
          stroke="#38bdf8"
          strokeWidth={0.8}
          strokeDasharray="4,6"
          strokeOpacity={0.4}
        />

        {/* Main 3D Sphere Core */}
        <Circle cx={110} cy={88} r={54} fill="url(#sphereCore)" />

        {/* Inner Specular Highlight */}
        <Ellipse
          cx={96}
          cy={72}
          rx={28}
          ry={16}
          fill="#ffffff"
          opacity={0.18}
          transform="rotate(-25 96 72)"
        />

        {/* Storm Severe Red Core Flare */}
        {stormSeverity === "extreme" && (
          <Circle cx={110} cy={88} r={46} fill="url(#stormFlare)" />
        )}

        {/* Atmospheric Echo Nodes */}
        <Circle cx={85} cy={95} r={2} fill="#7dd3fc" opacity={0.8} />
        <Circle cx={130} cy={75} r={1.8} fill="#f43f5e" opacity={0.9} />
        <Circle cx={122} cy={108} r={1.5} fill="#38bdf8" opacity={0.7} />
        <Circle cx={100} cy={68} r={1.6} fill="#ffffff" opacity={0.75} />
      </Svg>

      {/* ── Rotating Vortex Ring 1 ── */}
      <Animated.View
        style={[
          styles.overlayRotate,
          { transform: [{ rotate: spin1 }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={220} height={176} viewBox="0 0 220 176">
          <Ellipse
            cx={110}
            cy={88}
            rx={72}
            ry={22}
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeDasharray="8,4,2,4"
            strokeOpacity={0.65}
            fill="none"
            transform="rotate(-28 110 88)"
          />
          <Circle cx={170} cy={60} r={3} fill="#38bdf8" />
        </Svg>
      </Animated.View>

      {/* ── Rotating Counter Vortex Ring 2 ── */}
      <Animated.View
        style={[
          styles.overlayRotate,
          { transform: [{ rotate: spin2 }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={220} height={176} viewBox="0 0 220 176">
          <Ellipse
            cx={110}
            cy={88}
            rx={64}
            ry={18}
            stroke={stormSeverity === "extreme" ? "#ef4444" : "#f97316"}
            strokeWidth={1.2}
            strokeDasharray="5,3"
            strokeOpacity={0.55}
            fill="none"
            transform="rotate(38 110 88)"
          />
          <Circle cx={54} cy={118} r={2.5} fill="#ef4444" />
        </Svg>
      </Animated.View>

      {/* ── Rotating Radar Sweep Arm ── */}
      <Animated.View
        style={[
          styles.overlayRotate,
          { transform: [{ rotate: sweepRotate }] },
        ]}
        pointerEvents="none"
      >
        <Svg width={220} height={176} viewBox="0 0 220 176">
          <Defs>
            <SvgLinearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
              <Stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M 110 88 L 158 60 A 54 54 0 0 1 164 88 Z"
            fill="url(#sweepGradient)"
          />
          <Path
            d="M 110 88 L 164 88"
            stroke="#7dd3fc"
            strokeWidth={1.2}
            strokeOpacity={0.8}
          />
        </Svg>
      </Animated.View>

      {/* Holographic HUD Overlay Badges */}
      <View style={styles.topHud}>
        <View style={styles.pulseDot} />
        <Text style={styles.hudText}>DOPPLER 3D GRID</Text>
      </View>

      <View style={styles.bottomHud}>
        <Text style={styles.subHudText}>LIVE RADAR ATMOSPHERE • {rainfallRate} MM/H</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: "rgba(3, 7, 18, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  overlayRotate: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  topHud: {
    position: "absolute",
    top: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#38bdf8",
  },
  hudText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#38bdf8",
  },
  bottomHud: {
    position: "absolute",
    bottom: 8,
    right: 12,
    zIndex: 10,
  },
  subHudText: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "rgba(255, 255, 255, 0.45)",
    letterSpacing: 0.5,
  },
});
