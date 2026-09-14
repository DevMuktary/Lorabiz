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
  Sparkles,
  LayoutGrid,
  Bell,
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

  // 4. Transactions Query
  const { data: txData, refetch: refetchTx } = useQuery({
    queryKey: ["mobileRecentTransactions"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/transactions?limit=6");
      } catch {
        return null;
      }
    },
  });

  // 5. Loyalty Profile Query
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
      refetchTx(),
      refetchLoyalty(),
    ]).catch(() => {});
    setRefreshing(false);
  }, [refreshProfile, refetchProfile, refetchWallet, refetchDashboard, refetchTx, refetchLoyalty]);

  // Derived Values
  const balance =
    walletData?.balance ??
    walletData?.wallet?.balance ??
    dashboardData?.walletBalance ??
    user?.wallet?.balance ??
    0;

  const rawTxList = txData?.transactions || dashboardData?.transactions || [];
  const recentTransactions = Array.isArray(rawTxList) ? rawTxList.slice(0, 5) : [];

  const rawApps = dashboardData?.tableData || dashboardData?.registrations || [];
  const applications = Array.isArray(rawApps) ? rawApps.slice(0, 2) : [];

  // Accurate First Name extraction (priority: profile API > AuthContext user > email prefix)
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

  // Compact Quick Services Bar Configuration
  const QUICK_SERVICES = [
    {
      id: "cac",
      title: "CAC",
      logo: require("../../assets/cac.png"),
      route: "/(tabs)/services",
    },
    {
      id: "nin",
      title: "NIN",
      logo: require("../../assets/nimc.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "bvn",
      title: "BVN",
      logo: require("../../assets/nibss.png"),
      route: "/(tabs)/slips",
    },
    {
      id: "scuml",
      title: "SCUML",
      logo: require("../../assets/scuml.png"),
      route: "/(tabs)/services",
    },
    {
      id: "tax_id",
      title: "Tax ID",
      logo: require("../../assets/nrs.png"),
      route: "/(tabs)/services",
    },
    {
      id: "affidavit",
      title: "Affidavit",
      logo: require("../../assets/court.png"),
      route: "/(tabs)/services",
    },
    {
      id: "bills",
      title: "Bills",
      logo: require("../../assets/airtime.png"),
      route: "/(tabs)/bills",
    },
    {
      id: "more",
      title: "More",
      isMore: true,
      route: "/(tabs)/services",
    },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top, 20) + 4 },
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
        <View style={styles.topHeader}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.actionIconButton}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.75}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <View style={styles.avatarMini}>
                <Text style={styles.avatarText}>{userInitial}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 2. GREETING */}
        {/* =================================================================== */}
        <View style={styles.greetingBox}>
          <Text style={styles.greetingSub}>{greeting},</Text>
          <Text style={styles.greetingName}>
            {displayName ? `${displayName} 👋` : "Welcome 👋"}
          </Text>
        </View>

        {/* =================================================================== */}
        {/* 3. CLEAN ELEVATED WALLET CARD */}
        {/* =================================================================== */}
        <View style={styles.walletCard}>
          <View style={styles.walletTopRow}>
            <View style={styles.walletBadge}>
              <Wallet size={14} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.walletBadgeText}>Wallet Balance</Text>
            </View>

            <View style={styles.tierPill}>
              <Sparkles size={11} color="#B45309" style={{ marginRight: 4 }} />
              <Text style={styles.tierPillText}>{loyaltyTier} Tier</Text>
            </View>

            <TouchableOpacity
              onPress={() => setHideBalance(!hideBalance)}
              style={styles.eyeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              {hideBalance ? (
                <EyeOff size={18} color={colors.textSecondary} />
              ) : (
                <Eye size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>
            {hideBalance
              ? "₦ ••••••••"
              : `₦${Number(balance).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </Text>

          {/* Quick Actions: Exactly Fund Wallet & History */}
          <View style={styles.walletActionRow}>
            <TouchableOpacity
              style={styles.fundBtn}
              onPress={() => router.push("/wallet/fund" as any)}
              activeOpacity={0.85}
            >
              <PlusCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.fundBtnText}>Fund Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.8}
            >
              <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.historyBtnText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* =================================================================== */}
        {/* 4. COMPACT QUICK SERVICES BAR */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Services</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickBarContainer}
        >
          {QUICK_SERVICES.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.quickBarItem}
              onPress={() => router.push(svc.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickBarBadge, svc.isMore && styles.moreBadge]}>
                {svc.isMore ? (
                  <LayoutGrid size={20} color={colors.primary} />
                ) : (
                  <Image source={svc.logo} style={styles.agencyLogo} resizeMode="contain" />
                )}
              </View>
              <Text
                style={[styles.quickBarLabel, svc.isMore && styles.moreLabel]}
                numberOfLines={1}
              >
                {svc.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* =================================================================== */}
        {/* 5. TELECOM & UTILITIES STRIP */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Telecom & Utilities</Text>
        </View>

        <TouchableOpacity
          style={styles.vtuBanner}
          onPress={() => router.push("/(tabs)/bills")}
          activeOpacity={0.85}
        >
          <View style={styles.vtuIconWrap}>
            <Image
              source={require("../../assets/airtime.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.vtuTitle}>Airtime & Cheap Data</Text>
            <Text style={styles.vtuSub}>
              Instant delivery across MTN, Airtel, Glo & 9mobile
            </Text>
          </View>
          <ChevronRight size={17} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* =================================================================== */}
        {/* 6. ACTIVE APPLICATIONS TRACKER */}
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
            </View>

            {applications.map((app: any, idx: number) => {
              const displayId = app.trackingId || app.id?.substring(0, 8)?.toUpperCase();
              const isApproved = app.status === "APPROVED";
              const isQueried = app.status === "QUERIED";

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
                    <View style={{ flex: 1, marginLeft: 10 }}>
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
        ) : null}

        {/* =================================================================== */}
        {/* 7. RECENT ACTIVITY */}
        {/* =================================================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {recentTransactions.length > 0 ? (
          <View style={styles.transactionsList}>
            {recentTransactions.map((tx: any, idx: number) => {
              const isCredit = tx.type === "CREDIT";
              const isLast = idx === recentTransactions.length - 1;
              return (
                <View
                  key={tx.id || idx}
                  style={[styles.transactionItem, isLast && { borderBottomWidth: 0 }]}
                >
                  <View
                    style={[
                      styles.txIcon,
                      {
                        backgroundColor: isCredit ? "#ECFDF5" : "#F1F5F9",
                      },
                    ]}
                  >
                    {isCredit ? (
                      <ArrowDownLeft size={16} color={colors.success} />
                    ) : (
                      <ArrowUpRight size={16} color="#64748B" />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {tx.description || (isCredit ? "Wallet Deposit" : "Service Payment")}
                    </Text>
                    <Text style={styles.txDate}>{formatTxDate(tx.createdAt)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? colors.success : colors.text },
                    ]}
                  >
                    {isCredit ? "+" : "-"}₦
                    {Number(tx.amount || 0).toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Clock size={22} color={colors.textMuted} />
            <Text style={styles.emptyCardText}>No recent activity yet</Text>
            <Text style={styles.emptyCardSub}>
              Fund your wallet or process a service to get started.
            </Text>
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
    paddingBottom: 40,
  },

  /* Top Header */
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLogo: {
    width: 125,
    height: 36,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {
    padding: 1,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(200, 45, 117, 0.4)",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },

  /* Greeting */
  greetingBox: {
    marginBottom: 12,
  },
  greetingSub: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.2,
    marginTop: 1,
  },

  /* Wallet Card */
  walletCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.22)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  walletTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200, 45, 117, 0.12)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  walletBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tierPillText: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "700",
  },
  eyeBtn: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginVertical: 10,
    letterSpacing: -0.5,
  },
  walletActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  fundBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  fundBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
  historyBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  historyBtnText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },

  /* Compact Quick Services Bar */
  quickBarContainer: {
    flexDirection: "row",
    paddingVertical: 2,
    gap: 10,
    marginBottom: 16,
  },
  quickBarItem: {
    width: 60,
    alignItems: "center",
  },
  quickBarBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  moreBadge: {
    backgroundColor: "rgba(200, 45, 117, 0.10)",
    borderColor: "rgba(200, 45, 117, 0.25)",
  },
  agencyLogo: {
    width: 24,
    height: 24,
  },
  quickBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  moreLabel: {
    color: colors.primary,
    fontWeight: "800",
  },

  /* VTU Banner */
  vtuBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  vtuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  vtuTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  vtuSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  /* Applications Section */
  applicationsSection: {
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: "rgba(200, 45, 117, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  countBadgeText: {
    fontSize: 10,
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  appCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
  },
  appStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  appSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
  },

  /* Transactions */
  transactionsList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  txDate: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },
  emptyCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
});
