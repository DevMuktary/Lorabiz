import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StatusBar,
  Linking,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Wallet,
  Eye,
  EyeOff,
  PlusCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  Bell,
  Headphones,
  Search,
  CheckCircle2,
  FileText,
  Shield,
  HelpCircle,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);

  // Failsafe: Redirect incomplete profile users to finish registration details
  useEffect(() => {
    if (user && user.isProfileComplete === false) {
      router.replace({
        pathname: "/(auth)/register",
        params: {
          fromGoogle: "true",
          googleFirstName: user.firstName || "",
          googleLastName: user.lastName || "",
          googleEmail: user.email || "",
        },
      });
    }
  }, [user]);

  // 1. User Profile Query for accurate first name
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/profile");
      } catch {
        return null;
      }
    },
  });

  // 2. Dedicated Wallet Query
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ["mobileWallet"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/wallet");
      } catch {
        return null;
      }
    },
  });

  // 3. Dashboard Query (Applications & Stats)
  const { data: dashboardData, refetch: refetchDashboard } = useQuery({
    queryKey: ["mobileDashboard"],
    queryFn: async () => {
      try {
        return await api.get("/api/dashboard?limit=10");
      } catch {
        return null;
      }
    },
  });

  // 4. Loyalty Profile Query
  const { data: loyaltyData, refetch: refetchLoyalty } = useQuery({
    queryKey: ["mobileLoyaltyProfile"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/loyalty");
      } catch {
        return null;
      }
    },
  });

  // Unified Refresh Handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshProfile(),
      refetchProfile(),
      refetchWallet(),
      refetchDashboard(),
      refetchLoyalty(),
    ]).catch(() => {});
    setRefreshing(false);
  }, [refreshProfile, refetchProfile, refetchWallet, refetchDashboard, refetchLoyalty]);

  // Derived Values
  const balance =
    walletData?.balance ??
    walletData?.wallet?.balance ??
    dashboardData?.walletBalance ??
    user?.wallet?.balance ??
    0;

  const rawApps = dashboardData?.tableData || dashboardData?.registrations || [];
  const applications = Array.isArray(rawApps) ? rawApps.slice(0, 3) : [];

  // Accurate First Name extraction
  const rawName =
    profileData?.user?.firstName ||
    user?.firstName ||
    profileData?.user?.name ||
    user?.name ||
    profileData?.user?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "";
  const firstName = rawName.split(" ")[0].trim();
  const displayName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "";
  const userInitial = (displayName?.[0] || user?.name?.[0] || "U").toUpperCase();
  const loyaltyTier = loyaltyData?.profile?.tier || "Standard";

  // Quick Services Grid: Strictly 4 items per row, 2 rows (8 items total)
  // Replaced duplicate "NIN Verify" with SMEDAN Certificate. Item 8 is "More"
  const QUICK_SERVICES = [
    {
      id: "cac_reg",
      title: "CAC Reg",
      logo: require("../../assets/cac.png"),
      route: "/(tabs)/services",
    },
    {
      id: "nin_slip",
      title: "NIN Slip",
      logo: require("../../assets/nimc.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "bvn_slip",
      title: "BVN Slip",
      logo: require("../../assets/nibss.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "tax_id",
      title: "Tax ID",
      logo: require("../../assets/nrs.png"),
      route: "/(tabs)/services",
    },
    {
      id: "scuml",
      title: "SCUML",
      logo: require("../../assets/scuml.png"),
      route: "/(tabs)/services",
    },
    {
      id: "affidavit",
      title: "Affidavit",
      logo: require("../../assets/court.png"),
      route: "/(tabs)/services",
    },
    {
      id: "smedan",
      title: "SMEDAN",
      logo: require("../../assets/smedan.png"),
      route: "/(tabs)/services",
    },
    {
      id: "more",
      title: "More",
      isMore: true,
      route: "/(tabs)/services",
    },
  ];

  // Promotional Announcements & Ads Carousel Data
  const PROMO_ADS = [
    {
      id: "cac_promo",
      tag: "⚡ FAST-TRACK",
      title: "Register Your Business in 24h",
      desc: "Get your official CAC Certificate & Tax ID delivered seamlessly.",
      cta: "Register Now",
      route: "/(tabs)/services",
      color: "#831843",
      accent: "#F472B6",
    },
    {
      id: "scuml_promo",
      tag: "🛡️ COMPLIANCE READY",
      title: "Instant SCUML Processing",
      desc: "Open corporate bank accounts fast with certified AML compliance.",
      cta: "Apply for SCUML",
      route: "/(tabs)/services",
      color: "#1E1B4B",
      accent: "#818CF8",
    },
    {
      id: "affidavit_promo",
      tag: "📄 LEGAL SEAL",
      title: "Certified Court Affidavits",
      desc: "Declaration of age, name change & loss of document sworn online.",
      cta: "Get Affidavit",
      route: "/(tabs)/services",
      color: "#064E3B",
      accent: "#34D399",
    },
  ];

  const currentAd = PROMO_ADS[activePromoIndex];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* =================================================================== */}
      {/* 1. TOP APP BAR: Left Avatar + Greeting | Right Support & Bell */}
      {/* =================================================================== */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.avatarOrb}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarText}>{userInitial}</Text>
          </TouchableOpacity>
          <View style={styles.greetingWrap}>
            <Text style={styles.greetingSub}>Welcome back,</Text>
            <Text style={styles.greetingTitle}>
              Hi, {displayName ? `${displayName}` : "there"} 👋
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => Linking.openURL("mailto:support@lorabiz.com")}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Headphones size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Bell size={20} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* =================================================================== */}
        {/* 2. LUXURY FINTECH WALLET CARD */}
        {/* =================================================================== */}
        <View style={styles.fintechCard}>
          {/* Card Top Row */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.walletIconCircle}>
                <Wallet size={14} color="#F472B6" />
              </View>
              <Text style={styles.balanceLabelText}>Total Balance</Text>
            </View>

            <View style={styles.cardHeaderRight}>
              <View style={styles.tierPillDark}>
                <Sparkles size={11} color="#FBBF24" style={{ marginRight: 4 }} />
                <Text style={styles.tierPillDarkText}>{loyaltyTier}</Text>
              </View>

              <TouchableOpacity
                onPress={() => setHideBalance(!hideBalance)}
                style={styles.eyeBtnDark}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                {hideBalance ? (
                  <EyeOff size={18} color="#9CA3AF" />
                ) : (
                  <Eye size={18} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Display */}
          <View style={styles.mainBalanceRow}>
            <Text style={styles.mainBalanceText}>
              {hideBalance
                ? "₦ ••••••••"
                : `₦${Number(balance).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </Text>
          </View>

          {/* Action Buttons Row: Fund Wallet & History */}
          <View style={styles.cardActionRow}>
            <TouchableOpacity
              style={styles.fundWalletBtn}
              onPress={() => router.push("/wallet/fund" as any)}
              activeOpacity={0.88}
            >
              <PlusCircle size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.fundWalletBtnText}>Fund Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyBtnDark}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Clock size={16} color="#E5E7EB" style={{ marginRight: 6 }} />
              <Text style={styles.historyBtnDarkText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 3. PROMOTIONAL / ANNOUNCEMENT / AD CAROUSEL SLOT */}
        {/* =================================================================== */}
        <View style={styles.adSection}>
          <TouchableOpacity
            style={[styles.adCard, { backgroundColor: currentAd.color }]}
            onPress={() => router.push(currentAd.route as any)}
            activeOpacity={0.9}
          >
            <View style={styles.adContent}>
              <View style={[styles.adTagPill, { borderColor: currentAd.accent }]}>
                <Text style={[styles.adTagText, { color: currentAd.accent }]}>
                  {currentAd.tag}
                </Text>
              </View>

              <Text style={styles.adTitle}>{currentAd.title}</Text>
              <Text style={styles.adDesc} numberOfLines={2}>
                {currentAd.desc}
              </Text>

              <View style={styles.adCtaRow}>
                <Text style={[styles.adCtaText, { color: currentAd.accent }]}>
                  {currentAd.cta}
                </Text>
                <ArrowRight size={14} color={currentAd.accent} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Carousel Pagination Dots */}
          <View style={styles.dotsRow}>
            {PROMO_ADS.map((_, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActivePromoIndex(idx)}
                style={[
                  styles.dot,
                  activePromoIndex === idx && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* =================================================================== */}
        {/* 4. QUICK SERVICES GRID (Strictly 4x2 = 8 Total Items) */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services</Text>
        </View>

        <View style={styles.quickServicesGrid}>
          {QUICK_SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.gridItem}
              onPress={() => router.push(svc.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.gridIconBox, svc.isMore && styles.moreIconBox]}>
                {svc.isMore ? (
                  <LayoutGrid size={22} color={colors.primary} />
                ) : (
                  <Image source={svc.logo} style={styles.gridAgencyLogo} resizeMode="contain" />
                )}
              </View>
              <Text
                style={[styles.gridLabel, svc.isMore && styles.moreGridLabel]}
                numberOfLines={1}
              >
                {svc.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* =================================================================== */}
        {/* 5. ACTIVE APPLICATIONS TRACKER */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Track Applications</Text>
        </View>

        {applications.length > 0 ? (
          <View style={styles.applicationsList}>
            {applications.map((app: any, idx: number) => {
              const displayId = app.trackingId || app.id?.substring(0, 8)?.toUpperCase() || `LB-${idx + 101}`;
              const isApproved = app.status === "APPROVED";
              const isQueried = app.status === "QUERIED";

              return (
                <TouchableOpacity
                  key={app.id || idx}
                  style={styles.appCard}
                  onPress={() => router.push("/(tabs)/services")}
                  activeOpacity={0.8}
                >
                  <View style={styles.appCardLeft}>
                    <View style={styles.appIconCircle}>
                      <FileText size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {app.serviceName || app.businessName || "Corporate Registration"}
                      </Text>
                      <Text style={styles.appSub}>ID: {displayId}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isApproved
                          ? "rgba(16, 185, 129, 0.12)"
                          : isQueried
                          ? "rgba(239, 68, 68, 0.12)"
                          : "rgba(245, 158, 11, 0.12)",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isApproved
                            ? colors.success
                            : isQueried
                            ? colors.error
                            : "#B45309",
                        },
                      ]}
                    >
                      {app.status || "PROCESSING"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyTrackingCard}
            onPress={() => router.push("/(tabs)/services")}
            activeOpacity={0.85}
          >
            <View style={styles.emptyTrackingLeft}>
              <View style={styles.trackIconWrap}>
                <Search size={20} color={colors.primary} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.emptyTrackingTitle}>Real-time Filing Status</Text>
                <Text style={styles.emptyTrackingSub}>
                  Track your CAC, SCUML or Legal Affidavits in real-time
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* =================================================================== */}
        {/* 6. DEDICATED SUPPORT STRIP */}
        {/* =================================================================== */}
        <TouchableOpacity
          style={styles.supportStrip}
          onPress={() => Linking.openURL("mailto:support@lorabiz.com")}
          activeOpacity={0.85}
        >
          <View style={styles.supportStripLeft}>
            <View style={styles.supportIconWrap}>
              <Shield size={18} color={colors.primary} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.supportTitle}>Certified Compliance Support</Text>
              <Text style={styles.supportSub}>
                Questions about your filing? Speak with an accredited officer.
              </Text>
            </View>
          </View>
          <ChevronRight size={17} color={colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  /* Top App Bar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarOrb: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  greetingWrap: {
    marginLeft: 10,
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  /* Luxury Fintech Card */
  fintechCard: {
    backgroundColor: "#111827", // Luxury Slate-900
    borderRadius: 20,
    padding: 18,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.25)",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(200, 45, 117, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  balanceLabelText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierPillDark: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  tierPillDarkText: {
    color: "#FBBF24",
    fontSize: 10,
    fontWeight: "700",
  },
  eyeBtnDark: {
    padding: 4,
  },
  mainBalanceRow: {
    marginVertical: 12,
  },
  mainBalanceText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  cardActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  fundWalletBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  fundWalletBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  historyBtnDark: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  historyBtnDarkText: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 13,
  },

  /* Promotional / Ad Section */
  adSection: {
    marginBottom: 18,
  },
  adCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  adContent: {
    gap: 4,
  },
  adTagPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  adTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  adDesc: {
    fontSize: 12,
    color: "#D1D5DB",
    lineHeight: 16,
  },
  adCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  adCtaText: {
    fontSize: 12,
    fontWeight: "800",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
  },
  activeDot: {
    width: 18,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },

  /* Quick Services Grid: Strictly 4x2 = 8 Total Items */
  quickServicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
    marginBottom: 20,
  },
  gridItem: {
    width: "23%",
    alignItems: "center",
  },
  gridIconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moreIconBox: {
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    borderColor: "rgba(200, 45, 117, 0.25)",
  },
  gridAgencyLogo: {
    width: 28,
    height: 28,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginTop: 6,
  },
  moreGridLabel: {
    color: colors.primary,
    fontWeight: "800",
  },

  /* Active Applications */
  applicationsList: {
    marginBottom: 16,
    gap: 8,
  },
  appCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  appCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  appIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(200, 45, 117, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  appSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /* Empty State Tracker */
  emptyTrackingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  emptyTrackingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  trackIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTrackingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  emptyTrackingSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Support Strip */
  supportStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.2)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  supportStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  supportIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.text,
  },
  supportSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
