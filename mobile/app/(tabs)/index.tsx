import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
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
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  // Fetch recent dashboard metrics and transactions
  const { data: dashboardData, refetch } = useQuery({
    queryKey: ["mobileDashboard"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/dashboard?page=1");
        return res;
      } catch {
        return null;
      }
    },
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), refetch()]);
    setRefreshing(false);
  }, [refreshProfile, refetch]);

  const balance = user?.wallet?.balance ?? 0;
  const recentTransactions = dashboardData?.transactions?.slice(0, 5) || [];
  const firstName = user?.firstName || user?.name?.split(" ")[0] || "there";

  return (
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
      {/* Top Header with Brand Logo */}
      <View style={styles.topHeader}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push("/(tabs)/profile")}
          activeOpacity={0.8}
        >
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(firstName?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hero Banner with 3D Wallet Artwork */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTextCol}>
          <Text style={styles.heroGreeting}>{greeting},</Text>
          <Text style={styles.heroName}>{firstName.toUpperCase()} 👋</Text>
          <Text style={styles.heroSub}>
            Explore official registrations & instant utilities
          </Text>
        </View>
        <View style={styles.walletIllustrationContainer}>
          <View style={styles.walletGlowCircle}>
            <Image
              source={require("../../assets/wallet.png")}
              style={styles.walletImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletTopRow}>
          <View style={styles.walletBadge}>
            <Wallet size={15} color={colors.primaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.walletBadgeText}>Wallet Balance</Text>
          </View>

          <View style={styles.tierPill}>
            <Sparkles size={12} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.tierPillText}>VIP Member</Text>
          </View>

          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            : `₦${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
        </Text>

        <View style={styles.walletActionRow}>
          <TouchableOpacity
            style={styles.fundBtn}
            onPress={() => router.push("/wallet/fund" as any)}
            activeOpacity={0.85}
          >
            <PlusCircle size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
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

      {/* Official Government Registrations Dock */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Official Government Services</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/services")}>
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickDockGrid}>
        {/* CAC */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.8}
        >
          <View style={styles.dockBadge}>
            <Image
              source={require("../../assets/cac.png")}
              style={styles.agencyLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.dockLabel}>CAC</Text>
          <Text style={styles.dockSub}>Biz & LLC</Text>
        </TouchableOpacity>

        {/* SCUML */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.8}
        >
          <View style={styles.dockBadge}>
            <Image
              source={require("../../assets/scuml.png")}
              style={styles.agencyLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.dockLabel}>SCUML</Text>
          <Text style={styles.dockSub}>Certificate</Text>
        </TouchableOpacity>

        {/* Tax ID */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.8}
        >
          <View style={styles.dockBadge}>
            <Image
              source={require("../../assets/nrs.png")}
              style={styles.agencyLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.dockLabel}>Tax ID</Text>
          <Text style={styles.dockSub}>TIN / JTB</Text>
        </TouchableOpacity>

        {/* NIN */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => router.push("/(tabs)/slips")}
          activeOpacity={0.8}
        >
          <View style={styles.dockBadge}>
            <Image
              source={require("../../assets/nimc.png")}
              style={styles.agencyLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.dockLabel}>NIN Slips</Text>
          <Text style={styles.dockSub}>Instant NIMC</Text>
        </TouchableOpacity>

        {/* BVN */}
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => router.push("/(tabs)/slips")}
          activeOpacity={0.8}
        >
          <View style={styles.dockBadge}>
            <Image
              source={require("../../assets/nibss.png")}
              style={styles.agencyLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.dockLabel}>BVN Slips</Text>
          <Text style={styles.dockSub}>NIBSS Verified</Text>
        </TouchableOpacity>
      </View>

      {/* Utilities & Telecom Strip */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Telecom & Utilities</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/bills")}>
          <Text style={styles.seeAllText}>Buy VTU</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.vtuBanner}
        onPress={() => router.push("/(tabs)/bills")}
        activeOpacity={0.85}
      >
        <View style={styles.vtuIconWrap}>
          <Image
            source={require("../../assets/airtime.png")}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
          />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.vtuTitle}>Airtime & Cheap Data</Text>
          <Text style={styles.vtuSub}>
            Instant delivery across MTN, Airtel, Glo & 9mobile
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>

      {recentTransactions.length > 0 ? (
        <View style={styles.transactionsList}>
          {recentTransactions.map((tx: any, idx: number) => {
            const isCredit = tx.type === "CREDIT";
            return (
              <View key={tx.id || idx} style={styles.transactionItem}>
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor: isCredit ? "#10B98122" : "#EF444422",
                    },
                  ]}
                >
                  {isCredit ? (
                    <ArrowDownLeft size={18} color={colors.success} />
                  ) : (
                    <ArrowUpRight size={18} color={colors.error} />
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {tx.description || "Wallet Transaction"}
                  </Text>
                  <Text style={styles.txDate}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "Recent"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: isCredit ? colors.success : colors.text },
                  ]}
                >
                  {isCredit ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Clock size={28} color={colors.textMuted} />
          <Text style={styles.emptyCardText}>No recent activity yet</Text>
          <Text style={styles.emptyCardSub}>
            Fund your wallet or generate an instant slip to get started.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 40,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLogo: {
    width: 140,
    height: 42,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarMini: {
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

  /* Hero Banner */
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroGreeting: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  heroName: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  heroSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  walletIllustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  walletGlowCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(200, 45, 117, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletImage: {
    width: 52,
    height: 52,
  },

  /* Wallet Card */
  walletCard: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: "rgba(200, 45, 117, 0.25)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  walletTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200, 45, 117, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletBadgeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "700",
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  tierPillText: {
    color: "#F59E0B",
    fontSize: 11,
    fontWeight: "800",
  },
  eyeBtn: {
    padding: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    marginVertical: 12,
    letterSpacing: -0.5,
  },
  walletActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  fundBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  fundBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  historyBtn: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryLight,
  },

  /* Government Quick Dock */
  quickDockGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 6,
  },
  dockItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  dockBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  agencyLogo: {
    width: 26,
    height: 26,
  },
  dockLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  dockSub: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 1,
  },

  /* VTU Banner */
  vtuBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  vtuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  vtuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  vtuSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  /* Transactions */
  transactionsList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  txDesc: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  txDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
