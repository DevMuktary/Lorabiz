import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Wallet,
  Eye,
  EyeOff,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Zap,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bell,
  Award,
  ArrowRight,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // 1. Dedicated Wallet Query
  const {
    data: walletData,
    refetch: refetchWallet,
    isLoading: isWalletLoading,
  } = useQuery({
    queryKey: ["mobileWallet"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/wallet");
      } catch {
        return null;
      }
    },
  });

  // 2. Dashboard Query (Applications & Stats)
  const {
    data: dashboardData,
    refetch: refetchDashboard,
    isLoading: isDashboardLoading,
  } = useQuery({
    queryKey: ["mobileDashboard"],
    queryFn: async () => {
      try {
        return await api.get("/api/dashboard?limit=10");
      } catch {
        return null;
      }
    },
  });

  // 3. Transactions Query
  const {
    data: txData,
    refetch: refetchTx,
    isLoading: isTxLoading,
  } = useQuery({
    queryKey: ["mobileRecentTransactions"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/transactions?limit=6");
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
      refetchWallet(),
      refetchDashboard(),
      refetchTx(),
      refetchLoyalty(),
    ]).catch(() => {});
    setRefreshing(false);
  }, [refreshProfile, refetchWallet, refetchDashboard, refetchTx, refetchLoyalty]);

  // Derived Values
  const balance =
    walletData?.balance ??
    walletData?.wallet?.balance ??
    dashboardData?.walletBalance ??
    user?.wallet?.balance ??
    0;

  const rawTxList = txData?.transactions || dashboardData?.transactions || [];
  const recentTransactions = Array.isArray(rawTxList) ? rawTxList.slice(0, 6) : [];

  const rawApps = dashboardData?.tableData || dashboardData?.registrations || [];
  const applications = Array.isArray(rawApps) ? rawApps.slice(0, 3) : [];

  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";
  const userInitial = (firstName?.[0] || "U").toUpperCase();
  const loyaltyTier = loyaltyData?.profile?.tier || "Standard";
  const spinTokens = loyaltyData?.profile?.spinTokens ?? 0;

  // Format Transaction Timestamp
  const formatTxDate = (dateString?: string) => {
    if (!dateString) return "Recent";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Recent";
      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
      if (isToday) {
        return `Today, ${d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
      }
      return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    } catch {
      return "Recent";
    }
  };

  // Service Grid Configuration (4x2)
  const GOVERNMENT_SERVICES = [
    {
      id: "cac_biz",
      title: "CAC Biz",
      sub: "Business Name",
      badge: "30 Mins",
      logo: require("../../assets/cac.png"),
      route: "/(tabs)/services",
    },
    {
      id: "cac_llc",
      title: "CAC Ltd",
      sub: "Company LLC",
      badge: "24-72h",
      logo: require("../../assets/cac.png"),
      route: "/(tabs)/services",
    },
    {
      id: "nin_slips",
      title: "NIN Slip",
      sub: "Instant NIMC",
      badge: "Instant",
      logo: require("../../assets/nimc.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "bvn_slips",
      title: "BVN Slip",
      sub: "NIBSS Verified",
      badge: "Instant",
      logo: require("../../assets/nibss.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "scuml_cert",
      title: "SCUML",
      sub: "Certificate",
      badge: "EFCC",
      logo: require("../../assets/scuml.png"),
      route: "/(tabs)/services",
    },
    {
      id: "tax_id",
      title: "Tax ID",
      sub: "TIN / JTB",
      badge: "FIRS",
      logo: require("../../assets/nrs.png"),
      route: "/(tabs)/services",
    },
    {
      id: "affidavit",
      title: "Affidavit",
      sub: "Court Sworn",
      badge: "Legal",
      logo: require("../../assets/court.png"),
      route: "/(tabs)/services",
    },
    {
      id: "airtime_data",
      title: "Bills & Data",
      sub: "VTU Gateway",
      badge: "Instant",
      logo: require("../../assets/airtime.png"),
      route: "/(tabs)/bills",
    },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top, 16) + 4 },
        ]}
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
        {/* 1. TOP APP BAR */}
        {/* =================================================================== */}
        <View style={styles.topAppBar}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.topActionsRow}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={20} color={colors.text} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <View style={styles.avatarOrb}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 2. USER GREETING & TIER BADGE */}
        {/* =================================================================== */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingSub}>{greeting},</Text>
            <Text style={styles.greetingName}>{firstName} 👋</Text>
          </View>

          <View style={styles.tierPill}>
            <Sparkles size={13} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.tierPillText}>{loyaltyTier} Tier</Text>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 3. LUXURY CROWN WALLET CARD */}
        {/* =================================================================== */}
        <View style={styles.walletCard}>
          {/* Card Top Row: Label & Eye Toggle */}
          <View style={styles.walletHeaderRow}>
            <View style={styles.walletLabelBox}>
              <Wallet size={15} color="#F472B6" style={{ marginRight: 6 }} />
              <Text style={styles.walletLabelText}>Available Balance</Text>
            </View>

            <TouchableOpacity
              onPress={() => setHideBalance(!hideBalance)}
              style={styles.eyeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {hideBalance ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Card Balance Amount */}
          <View style={styles.balanceContainer}>
            {isWalletLoading && !walletData && !dashboardData ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginVertical: 8 }} />
            ) : (
              <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
                {hideBalance
                  ? "₦ ••••••••"
                  : `₦${Number(balance).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`}
              </Text>
            )}
          </View>

          {/* Quick Actions (4-item row) */}
          <View style={styles.quickActionRow}>
            {/* Action 1: Fund Wallet (Primary CTA) */}
            <TouchableOpacity
              style={styles.fundActionBtn}
              onPress={() => router.push("/wallet/fund" as any)}
              activeOpacity={0.85}
            >
              <PlusCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.fundActionText}>Fund Wallet</Text>
            </TouchableOpacity>

            {/* Action 2: Pay Bills */}
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push("/(tabs)/bills")}
              activeOpacity={0.8}
            >
              <Zap size={15} color="#E2E8F0" style={{ marginRight: 5 }} />
              <Text style={styles.secondaryActionText}>Pay Bills</Text>
            </TouchableOpacity>

            {/* Action 3: Get Slips */}
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push("/(tabs)/slips")}
              activeOpacity={0.8}
            >
              <FileText size={15} color="#E2E8F0" style={{ marginRight: 5 }} />
              <Text style={styles.secondaryActionText}>Slips</Text>
            </TouchableOpacity>

            {/* Action 4: History */}
            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Clock size={15} color="#E2E8F0" style={{ marginRight: 5 }} />
              <Text style={styles.secondaryActionText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 4. OFFICIAL GOVERNMENT SERVICES (4x2 GRID) */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Government & Utility Services</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.servicesGrid}>
          {GOVERNMENT_SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.serviceGridCard}
              onPress={() => router.push(svc.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.serviceBadgeRow}>
                <View style={styles.serviceLogoWrap}>
                  <Image source={svc.logo} style={styles.serviceAgencyLogo} resizeMode="contain" />
                </View>
                <View style={styles.miniTag}>
                  <Text style={styles.miniTagText}>{svc.badge}</Text>
                </View>
              </View>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {svc.title}
              </Text>
              <Text style={styles.serviceSub} numberOfLines={1}>
                {svc.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* =================================================================== */}
        {/* 5. ACTIVE APPLICATION TRACKER / ONBOARDING BANNER */}
        {/* =================================================================== */}
        {applications.length > 0 ? (
          <View style={styles.applicationsSection}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.sectionTitle}>Active Applications</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{applications.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
                <Text style={styles.seeAllText}>Manage</Text>
              </TouchableOpacity>
            </View>

            {applications.map((app: any, idx: number) => {
              const displayId = app.trackingId || app.id?.substring(0, 8)?.toUpperCase();
              const isApproved = app.status === "APPROVED";
              const isQueried = app.status === "QUERIED";
              const isPending = app.status === "PENDING" || !app.status;

              return (
                <TouchableOpacity
                  key={app.id || idx}
                  style={styles.applicationCard}
                  onPress={() => router.push("/(tabs)/services")}
                  activeOpacity={0.8}
                >
                  <View style={styles.appCardLeft}>
                    <View
                      style={[
                        styles.appStatusDot,
                        {
                          backgroundColor: isApproved
                            ? colors.success
                            : isQueried
                            ? colors.error
                            : colors.warning,
                        },
                      ]}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.appTitle} numberOfLines={1}>
                        {app.proposedName || `Application ${displayId}`}
                      </Text>
                      <Text style={styles.appSub}>
                        {app._appType === "LLC" ? "Company LLC" : "Business Name"} • ID: {displayId}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isApproved
                          ? "#ECFDF5"
                          : isQueried
                          ? "#FEF2F2"
                          : "#FFFBEB",
                      },
                    ]}
                  >
                    {isApproved ? (
                      <CheckCircle2 size={12} color={colors.success} style={{ marginRight: 4 }} />
                    ) : isQueried ? (
                      <AlertCircle size={12} color={colors.error} style={{ marginRight: 4 }} />
                    ) : (
                      <Clock size={12} color={colors.warning} style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.statusPillText,
                        {
                          color: isApproved
                            ? colors.success
                            : isQueried
                            ? colors.error
                            : "#D97706",
                        },
                      ]}
                    >
                      {app.status || "PENDING"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.onboardingBanner}
            onPress={() => router.push("/(tabs)/services")}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={styles.promoTag}>
                <Sparkles size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.promoTagText}>Accredited Filing</Text>
              </View>
              <Text style={styles.onboardingTitle}>Register Your Business or LLC</Text>
              <Text style={styles.onboardingSub}>
                Get your official CAC Certificate & Tax ID with accredited filing in 30 minutes.
              </Text>
            </View>
            <View style={styles.onboardingArrow}>
              <ArrowRight size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        )}

        {/* =================================================================== */}
        {/* 6. REWARDS & SPIN BANNER */}
        {/* =================================================================== */}
        <TouchableOpacity
          style={styles.rewardsBanner}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.85}
        >
          <View style={styles.rewardsIconWrap}>
            <Award size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.rewardsTitle}>Daily Rewards & Cashback</Text>
            <Text style={styles.rewardsSub}>
              {spinTokens > 0
                ? `You have ${spinTokens} spin token${spinTokens > 1 ? "s" : ""} available`
                : "Earn cashback and fee discounts on every transaction"}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* =================================================================== */}
        {/* 7. RECENT ACTIVITY LEDGER */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.seeAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {isTxLoading && recentTransactions.length === 0 ? (
          <View style={styles.transactionsLoadingCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading ledger records...</Text>
          </View>
        ) : recentTransactions.length > 0 ? (
          <View style={styles.transactionsCard}>
            {recentTransactions.map((tx: any, idx: number) => {
              const isCredit = tx.type === "CREDIT";
              const isLast = idx === recentTransactions.length - 1;

              return (
                <View
                  key={tx.id || idx}
                  style={[styles.transactionRow, isLast && { borderBottomWidth: 0 }]}
                >
                  <View
                    style={[
                      styles.txIconOrb,
                      {
                        backgroundColor: isCredit ? "#ECFDF5" : "#F1F5F9",
                      },
                    ]}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={17} color={colors.success} />
                    ) : (
                      <ArrowUpRight size={17} color="#64748B" />
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txDescription} numberOfLines={1}>
                      {tx.description || (isCredit ? "Wallet Deposit" : "Service Payment")}
                    </Text>
                    <Text style={styles.txTimestamp}>{formatTxDate(tx.createdAt)}</Text>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={[
                        styles.txAmountText,
                        { color: isCredit ? colors.success : colors.text },
                      ]}
                    >
                      {isCredit ? "+" : "-"}₦
                      {Number(tx.amount || 0).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                    {tx.status && tx.status !== "SUCCESS" && (
                      <Text style={styles.txStatusMuted}>{tx.status}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyLedgerCard}>
            <View style={styles.emptyIconCircle}>
              <Clock size={24} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyLedgerTitle}>No recent activity</Text>
            <Text style={styles.emptyLedgerSub}>
              Fund your wallet or process a service to start building your ledger.
            </Text>
            <TouchableOpacity
              style={styles.emptyFundBtn}
              onPress={() => router.push("/wallet/fund" as any)}
              activeOpacity={0.85}
            >
              <PlusCircle size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyFundBtnText}>Fund Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },

  /* Top App Bar */
  topAppBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLogo: {
    width: 135,
    height: 38,
  },
  topActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
  },
  avatarBtn: {
    padding: 1,
  },
  avatarOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(200, 45, 117, 0.4)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },

  /* Greeting & Tier */
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: 1,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tierPillText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },

  /* Luxury Crown Wallet Card */
  walletCard: {
    backgroundColor: "#0F172A", // Deep Obsidian Black Card
    borderRadius: 22,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: "rgba(200, 45, 117, 0.35)", // Signature Lorabiz Glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  walletHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabelBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200, 45, 117, 0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  walletLabelText: {
    color: "#F472B6",
    fontSize: 12,
    fontWeight: "700",
  },
  eyeBtn: {
    padding: 4,
  },
  balanceContainer: {
    marginVertical: 14,
    minHeight: 40,
    justifyContent: "center",
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fundActionBtn: {
    flex: 1.3,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  fundActionText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
  },
  secondaryActionText: {
    color: "#F1F5F9",
    fontWeight: "700",
    fontSize: 12,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },

  /* 4x2 Government Services Grid */
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 22,
  },
  serviceGridCard: {
    width: "48.4%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 12,
  },
  serviceBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  serviceLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  serviceAgencyLogo: {
    width: 22,
    height: 22,
  },
  miniTag: {
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  serviceSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Applications Section */
  applicationsSection: {
    marginBottom: 22,
  },
  countBadge: {
    backgroundColor: "rgba(200, 45, 117, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  applicationCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  appCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  appStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  appSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
  },

  /* Onboarding Promotion Banner */
  onboardingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.22)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  promoTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.primary,
  },
  onboardingTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  onboardingSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  onboardingArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Rewards Ribbon */
  rewardsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  rewardsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardsTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
  },
  rewardsSub: {
    fontSize: 11,
    color: "#B45309",
    marginTop: 2,
  },

  /* Recent Activity Card */
  transactionsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  txIconOrb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txDescription: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  txTimestamp: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: "800",
  },
  txStatusMuted: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 2,
  },
  transactionsLoadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },

  /* Empty Ledger State */
  emptyLedgerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyLedgerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  emptyLedgerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 17,
    maxWidth: 260,
  },
  emptyFundBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
  },
  emptyFundBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
