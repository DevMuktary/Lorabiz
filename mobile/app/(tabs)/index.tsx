import React, { useState, useCallback } from "react";
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
  FileText,
  Shield,
  Briefcase,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Bell,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../constants/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
          style={styles.bellBtn}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <View style={styles.avatarMini}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || "U").toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          Hello, {user?.firstName || "Customer"} 👋
        </Text>
        <Text style={styles.subGreetingText}>
          Welcome to your Lorabiz dashboard
        </Text>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletTopRow}>
          <View style={styles.walletBadge}>
            <Wallet size={16} color={colors.primaryLight} style={{ marginRight: 6 }} />
            <Text style={styles.walletBadgeText}>Available Balance</Text>
          </View>
          <TouchableOpacity
            onPress={() => setHideBalance(!hideBalance)}
            style={styles.eyeBtn}
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
            activeOpacity={0.8}
          >
            <PlusCircle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.fundBtnText}>Fund Wallet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => router.push("/wallet/history" as any)}
            activeOpacity={0.8}
          >
            <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.historyBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Services Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Instant Services</Text>
      </View>

      <View style={styles.serviceGrid}>
        {/* NIN Slips */}
        <TouchableOpacity
          style={[styles.serviceCard, { borderColor: "#F59E0B33" }]}
          onPress={() => router.push("/(tabs)/slips")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "#F59E0B15" }]}>
            <Image source={require("../../assets/nimc.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
          </View>
          <Text style={styles.serviceTitle}>NIN Slips</Text>
          <Text style={styles.serviceSubtitle}>₦400 - ₦1,000</Text>
        </TouchableOpacity>

        {/* BVN Slips */}
        <TouchableOpacity
          style={[styles.serviceCard, { borderColor: "#C82D7533" }]}
          onPress={() => router.push("/(tabs)/slips")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "#C82D7515" }]}>
            <Image source={require("../../assets/nibss.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
          </View>
          <Text style={styles.serviceTitle}>BVN Slips</Text>
          <Text style={styles.serviceSubtitle}>Instant lookup</Text>
        </TouchableOpacity>

        {/* Airtime & Data */}
        <TouchableOpacity
          style={[styles.serviceCard, { borderColor: "#10B98133" }]}
          onPress={() => router.push("/(tabs)/bills")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "#10B98115" }]}>
            <Zap size={22} color={colors.success} />
          </View>
          <Text style={styles.serviceTitle}>Airtime & Data</Text>
          <Text style={styles.serviceSubtitle}>All networks</Text>
        </TouchableOpacity>

        {/* CAC Corporate */}
        <TouchableOpacity
          style={[styles.serviceCard, { borderColor: "#8B5CF633" }]}
          onPress={() => router.push("/(tabs)/services")}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrapper, { backgroundColor: "#8B5CF615" }]}>
            <Image source={require("../../assets/cac.png")} style={{ width: 26, height: 26 }} resizeMode="contain" />
          </View>
          <Text style={styles.serviceTitle}>CAC Filing</Text>
          <Text style={styles.serviceSubtitle}>Biz Name & LLC</Text>
        </TouchableOpacity>
      </View>

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
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 36,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLogo: {
    width: 140,
    height: 44,
  },
  greetingSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  subGreetingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bellBtn: {
    padding: 2,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  walletCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  walletTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#C82D751A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  walletBadgeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: "600",
  },
  eyeBtn: {
    padding: 6,
  },
  balanceAmount: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginVertical: 14,
  },
  walletActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  fundBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 12,
  },
  fundBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  historyBtn: {
    backgroundColor: colors.surfaceElevated,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  historyBtnText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: "48%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionsList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 12,
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
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  txDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "700",
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
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 10,
  },
  emptyCardSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});
