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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck } from "lucide-react-native";
import { colors } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  // Dynamic floating micro-animation so the 3D scene feels alive (non-static)
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Branding Header */}
        <View style={styles.topHeader}>
          <Image
            source={require("../../assets/logo-pink.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        {/* Center 3D Digital Identity & Services Visual Scene with Floating Motion */}
        <View style={styles.heroSection}>
          <Animated.View
            style={[
              styles.imageCardContainer,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            <Image
              source={require("../../assets/welcome-hero.jpg")}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* Bottom Call to Actions & Trust Info */}
        <View style={styles.actionSection}>
          {/* Primary CTA: Get Started (App-grade button, no web arrow) */}
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
              <ShieldCheck size={14} color={colors.textSecondary} />
              <Text style={styles.trustText}>
                Business & Identity Infrastructure
              </Text>
            </View>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  brandLogo: {
    width: 140,
    height: 60,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  imageCardContainer: {
    width: SCREEN_WIDTH - 44,
    height: Math.min(SCREEN_HEIGHT * 0.47, 400),
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: colors.surface,
    position: "relative",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  actionSection: {
    width: "100%",
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    marginTop: 4,
  },
  trustBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  trustText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  versionText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 0.5,
  },
});

