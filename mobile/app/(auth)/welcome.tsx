import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, CheckCircle2 } from "lucide-react-native";
import { colors } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // Dynamic floating micro-animation for the interactive 3D elements
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth looping float
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Subtle gentle tilt/rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const badgeRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-2deg", "2deg"],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Full-bleed 3D Designed Architectural Scene */}
      <Image
        source={require("../../assets/welcome-hero.jpg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Top Branding Header standing directly on the architectural grid wall */}
        <View style={styles.topHeader}>
          <Image
            source={require("../../assets/logo-pink.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        {/* Center Zone with dynamic floating 3D badge pill */}
        <View style={styles.centerSection}>
          <Animated.View
            style={[
              styles.floatingPill,
              {
                transform: [
                  { translateY: floatAnim },
                  { rotate: badgeRotation },
                ],
              },
            ]}
          >
            <CheckCircle2 size={16} color="#059669" />
            <Text style={styles.floatingPillText}>Official Verified Slips</Text>
          </Animated.View>
        </View>

        {/* Bottom Call to Actions & Trust Info standing directly on the marble floor */}
        <View style={styles.bottomSection}>
          {/* Primary CTA: Get Started */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Secondary CTA: Log in */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Log in</Text>
          </TouchableOpacity>

          {/* Trust Footnote & App Version */}
          <View style={styles.footerInfo}>
            <View style={styles.trustBadgeRow}>
              <ShieldCheck size={14} color="#475569" />
              <Text style={styles.trustText}>
                Business & Identity Infrastructure
              </Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  topHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandLogo: {
    width: 150,
    height: 58,
  },
  centerSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  floatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 8,
  },
  floatingPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  bottomSection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footerInfo: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  trustBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  trustText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 6,
    fontWeight: "600",
  },
  versionText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
});


