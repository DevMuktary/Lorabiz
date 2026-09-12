import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldCheck, Sparkles, ArrowRight } from "lucide-react-native";
import { colors, spacing } from "../../constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Top Branding */}
        <View style={styles.topHeader}>
          <Image
            source={require("../../assets/logo-pink.png")}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>

        {/* Center 3D Fintech Visual Scene */}
        <View style={styles.heroSection}>
          <View style={styles.imageCardContainer}>
            <Image
              source={require("../../assets/welcome-hero.jpg")}
              style={styles.heroImage}
              resizeMode="cover"
            />

            {/* Floating Contactless/Instant Slips Badge (ALAT Style) */}
            <View style={styles.floatingBadge}>
              <View style={styles.badgeIconCircle}>
                <Sparkles size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.badgeText}>Instant Slips & Bills</Text>
            </View>
          </View>
        </View>

        {/* Bottom Call to Actions & Version */}
        <View style={styles.actionSection}>
          {/* Primary CTA: Get Started */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
                Licensed Business & Identity Infrastructure
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topHeader: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  brandLogo: {
    width: 160,
    height: 48,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  imageCardContainer: {
    width: SCREEN_WIDTH - 48,
    height: Math.min(SCREEN_HEIGHT * 0.46, 380),
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    position: "relative",
    shadowColor: "#C82D75",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  floatingBadge: {
    position: "absolute",
    left: 16,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.15)",
  },
  badgeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 0.2,
  },
  actionSection: {
    width: "100%",
    paddingTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
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
    backgroundColor: "#FFFFFF",
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
