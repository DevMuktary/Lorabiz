import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Wallet, ShieldCheck, X, CheckCircle2 } from "lucide-react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors } from "../../constants/theme";

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

export default function FundWalletScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [amount, setAmount] = useState("5000");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // KoraPay WebView State
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  async function handleInitializeKoraPay() {
    setErrorMsg(null);
    const numAmount = Number(amount);

    if (!numAmount || isNaN(numAmount) || numAmount < 100) {
      setErrorMsg("Minimum funding amount is ₦100.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/payment/checkout", {
        service: "wallet_funding",
        amount: numAmount,
        paymentMethod: "ONLINE",
      });

      if (res?.success && res.authorizationUrl) {
        setCheckoutUrl(res.authorizationUrl);
        setIsWebViewOpen(true);
      } else {
        setErrorMsg(res?.message || "Failed to initialize payment gateway.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Payment network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleNavigationStateChange(navState: any) {
    const { url } = navState;

    // Check if the checkout redirect reached Lorabiz callback
    if (url.includes("funded=true") || url.includes("/dashboard")) {
      setIsWebViewOpen(false);
      setCheckoutUrl(null);
      setPaymentSuccess(true);
      // Quietly update wallet balance
      refreshProfile();

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Current Balance */}
        <View style={styles.balanceBox}>
          <Text style={styles.balanceLabel}>Current Available Balance</Text>
          <Text style={styles.balanceValue}>
            ₦{(user?.wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputCard}>
          <Text style={styles.cardLabel}>Enter Amount (NGN)</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.nairaPrefix}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Preset Amounts */}
        <Text style={styles.presetHeading}>Quick Select</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((val) => {
            const isSelected = amount === String(val);
            return (
              <TouchableOpacity
                key={val}
                style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                onPress={() => setAmount(String(val))}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetBtnText, isSelected && styles.presetBtnTextActive]}>
                  ₦{val.toLocaleString()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Security Info */}
        <View style={styles.securityBadge}>
          <ShieldCheck size={18} color={colors.success} style={{ marginRight: 8 }} />
          <Text style={styles.securityText}>
            Secured with bank-grade 256-bit encryption via KoraPay.
          </Text>
        </View>

        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Success Banner */}
        {paymentSuccess ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={20} color={colors.success} style={{ marginRight: 8 }} />
            <Text style={styles.successText}>Payment successful! Redirecting...</Text>
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.payBtn, isLoading && styles.payBtnDisabled]}
          onPress={handleInitializeKoraPay}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.payBtnText}>
              Proceed to Pay ₦{Number(amount || 0).toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* KoraPay Inline Checkout Modal */}
      <Modal visible={isWebViewOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>KoraPay Secure Checkout</Text>
            <TouchableOpacity
              onPress={() => {
                setIsWebViewOpen(false);
                setCheckoutUrl(null);
                refreshProfile();
              }}
              style={styles.closeWebViewBtn}
            >
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {checkoutUrl ? (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleNavigationStateChange}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ color: colors.textSecondary, marginTop: 12 }}>
                    Loading secure checkout...
                  </Text>
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  balanceBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  inputCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 8,
  },
  nairaPrefix: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryLight,
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  presetHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  presetBtn: {
    width: "31%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  presetBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "#0284C71A",
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  presetBtnTextActive: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 20,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  errorBox: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "center",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.successSurface,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: "#86EFAC",
    fontSize: 14,
    fontWeight: "700",
  },
  payBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.6,
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  closeWebViewBtn: {
    padding: 4,
  },
  webLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
