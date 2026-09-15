import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react-native";
import { colors } from "../../constants/theme";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

type FilterType = "ALL" | "DEPOSIT" | "PAYMENT";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: txData, refetch, isFetching } = useQuery({
    queryKey: ["mobileAllTransactions"],
    queryFn: async () => {
      try {
        return await api.get("/api/user/transactions?limit=50");
      } catch {
        return null;
      }
    },
  });

  const transactions: any[] = txData?.transactions || [];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter =
        filter === "ALL"
          ? true
          : filter === "DEPOSIT"
          ? tx.type === "DEPOSIT" || tx.type === "CREDIT"
          : tx.type === "PAYMENT" || tx.type === "DEBIT";

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        tx.description?.toLowerCase().includes(query) ||
        tx.reference?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [transactions, filter, searchQuery]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <Text style={styles.headerTitle}>Activity</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions or orders..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(["ALL", "PAYMENT", "DEPOSIT"] as FilterType[]).map((type) => {
            const label = type === "ALL" ? "All" : type === "PAYMENT" ? "Orders" : "Deposits";
            const isActive = filter === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.filterPill, isActive && styles.activeFilterPill]}
                onPress={() => setFilter(type)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.activeFilterPillText]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item.id || String(index)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Clock size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Activity Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? "No transactions matched your search query."
                : "Transactions and orders will appear here once you fund your wallet or make a filing."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCredit = item.type === "DEPOSIT" || item.type === "CREDIT";
          const isSuccess = item.status === "SUCCESS" || item.status === "COMPLETED";
          const isPending = item.status === "PENDING";

          return (
            <View style={styles.txCard}>
              <View
                style={[
                  styles.txIconWrap,
                  {
                    backgroundColor: isCredit
                      ? "rgba(16, 185, 129, 0.10)"
                      : "rgba(239, 68, 68, 0.10)",
                  },
                ]}
              >
                {isCredit ? (
                  <ArrowDownLeft size={18} color={colors.success} />
                ) : (
                  <ArrowUpRight size={18} color={colors.error} />
                )}
              </View>

              <View style={styles.txBody}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {item.description || item.reference || "Transaction"}
                </Text>
                <View style={styles.txMetaRow}>
                  <Text style={styles.txDate}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                  </Text>
                  <View style={styles.statusDotWrap}>
                    {isSuccess ? (
                      <CheckCircle2 size={11} color={colors.success} />
                    ) : isPending ? (
                      <Clock3 size={11} color="#D97706" />
                    ) : (
                      <AlertCircle size={11} color={colors.error} />
                    )}
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isSuccess
                            ? colors.success
                            : isPending
                            ? "#D97706"
                            : colors.error,
                        },
                      ]}
                    >
                      {item.status || "SUCCESS"}
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={[
                  styles.txAmount,
                  { color: isCredit ? colors.success : colors.text },
                ]}
              >
                {isCredit ? "+" : "-"}₦
                {Number(item.amount || 0).toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  activeFilterPill: {
    backgroundColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  activeFilterPillText: {
    color: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txBody: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
  },
  txMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  txDate: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  statusDotWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  txAmount: {
    fontSize: 14,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
