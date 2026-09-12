import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Platform,
} from "react-native";
import {
  FileText,
  Shield,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  X,
  Wallet,
  Check,
  UserCheck,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { colors } from "../../constants/theme";

interface SlipOption {
  id: "nin_basic" | "nin_regular" | "nin_standard" | "nin_premium" | "nin_vnin";
  name: string;
  price: number;
  tag: string;
  description: string;
}

const NIN_OPTIONS: SlipOption[] = [
  {
    id: "nin_basic",
    name: "Basic Slip",
    price: 400,
    tag: "Standard Size",
    description: "Compact NIN verification document with core demographics.",
  },
  {
    id: "nin_regular",
    name: "Regular Slip",
    price: 500,
    tag: "A4 Format",
    description: "Full-page standard verification slip with photo and details.",
  },
  {
    id: "nin_standard",
    name: "Standard Slip",
    price: 700,
    tag: "HD Color",
    description: "High-definition color slip formatted for official presentations.",
  },
  {
    id: "nin_premium",
    name: "Premium Slip",
    price: 1000,
    tag: "ID Card Format",
    description: "Card-style laminate layout with barcode, QR, and dual photo.",
  },
  {
    id: "nin_vnin",
    name: "VNIN Slip",
    price: 500,
    tag: "Virtual NIN",
    description: "Official Virtual NIN slip matching NIMC compliance specs.",
  },
];

export default function SlipsScreen() {
  const { user, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"NIN" | "BVN" | "HISTORY">("NIN");
  const [searchMode, setSearchMode] = useState<"NIN" | "PHONE">("NIN");
  const [idNumber, setIdNumber] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<SlipOption>(NIN_OPTIONS[3]); // Premium default
  const [consentGiven, setConsentGiven] = useState(false);

  // Status & Results
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<any | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const walletBalance = user?.wallet?.balance ?? 0;
  const hasSufficientBalance = walletBalance >= selectedSlip.price;

  async function handleGenerateNinSlip() {
    setErrorMsg(null);

    const cleanInput = idNumber.trim();
    if (!cleanInput) {
      setErrorMsg(`Please enter a valid 11-digit ${searchMode === "NIN" ? "NIN" : "Phone Number"}.`);
      return;
    }

    if (cleanInput.length !== 11 || !/^\d+$/.test(cleanInput)) {
      setErrorMsg(`${searchMode === "NIN" ? "NIN" : "Phone number"} must be exactly 11 numeric digits.`);
      return;
    }

    if (!consentGiven) {
      setErrorMsg("You must confirm you have the ID owner's consent to generate this slip.");
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMsg(
        `Insufficient balance. This slip costs ₦${selectedSlip.price.toLocaleString()}, but your balance is ₦${walletBalance.toLocaleString()}. Please fund your wallet.`
      );
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = "/api/nin/slips";
      const payload = {
        type: searchMode,
        value: cleanInput,
        slipType: selectedSlip.id,
      };

      const res = await api.post(endpoint, payload);

      if (res?.success || res?.status === "success") {
        setDemographics(res.data || res.demographics || res);
        setIsResultOpen(true);
        // Refresh balance after debit
        refreshProfile();
      } else {
        setErrorMsg(res?.message || "Failed to generate slip. Please verify the ID number.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An error occurred while communicating with the verification network.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShareSlip() {
    if (!demographics?.pdfUrl && !demographics?.slipUrl) {
      Alert.alert("Slip Generated", "Demographics verified and recorded successfully.");
      return;
    }

    const downloadUrl = demographics.pdfUrl || demographics.slipUrl;
    try {
      const baseDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || "";
      const fileUri = `${baseDir}nin_slip_${Date.now()}.pdf`;
      const downloadRes = await (FileSystem as any).downloadAsync(downloadUrl, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert("Success", "File saved to device.");
      }
    } catch (err) {
      Alert.alert("Notice", "Failed to download PDF directly. You can access it in your slip history.");
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Slips Hub</Text>
        <Text style={styles.headerSubtitle}>
          Instant NIN & BVN verification with official PDF slip generation
        </Text>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "NIN" && styles.tabBtnActive]}
            onPress={() => setActiveTab("NIN")}
          >
            <FileText size={16} color={activeTab === "NIN" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === "NIN" && styles.tabBtnTextActive]}>
              NIN Slips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "BVN" && styles.tabBtnActive]}
            onPress={() => setActiveTab("BVN")}
          >
            <Shield size={16} color={activeTab === "BVN" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === "BVN" && styles.tabBtnTextActive]}>
              BVN Slips
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "HISTORY" && styles.tabBtnActive]}
            onPress={() => setActiveTab("HISTORY")}
          >
            <Clock size={16} color={activeTab === "HISTORY" ? "#FFFFFF" : colors.textSecondary} />
            <Text style={[styles.tabBtnText, activeTab === "HISTORY" && styles.tabBtnTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {activeTab === "NIN" ? (
          /* ============================================================
             NIN SLIP GENERATION FORM
             ============================================================ */
          <View>
            {/* Search Mode Toggle */}
            <View style={styles.searchModeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, searchMode === "NIN" && styles.modeBtnActive]}
                onPress={() => {
                  setSearchMode("NIN");
                  setIdNumber("");
                }}
              >
                <Text style={[styles.modeBtnText, searchMode === "NIN" && styles.modeBtnTextActive]}>
                  By NIN (11 Digits)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, searchMode === "PHONE" && styles.modeBtnActive]}
                onPress={() => {
                  setSearchMode("PHONE");
                  setIdNumber("");
                }}
              >
                <Text style={[styles.modeBtnText, searchMode === "PHONE" && styles.modeBtnTextActive]}>
                  By Phone Number
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Card */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                Enter {searchMode === "NIN" ? "National Identification Number (NIN)" : "Phone Number"}
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder={searchMode === "NIN" ? "e.g. 12345678901" : "e.g. 08012345678"}
                  placeholderTextColor={colors.textMuted}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  keyboardType="number-pad"
                  maxLength={11}
                />
                <View style={styles.digitBadge}>
                  <Text style={styles.digitBadgeText}>{idNumber.length}/11</Text>
                </View>
              </View>
            </View>

            {/* Slip Design Selection */}
            <Text style={styles.sectionHeading}>Select Slip Design</Text>
            <View style={styles.slipOptionsList}>
              {NIN_OPTIONS.map((opt) => {
                const isSelected = selectedSlip.id === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.slipCard, isSelected && styles.slipCardActive]}
                    onPress={() => setSelectedSlip(opt)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.slipCardHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={styles.slipCardName}>{opt.name}</Text>
                          <View style={styles.slipTag}>
                            <Text style={styles.slipTagText}>{opt.tag}</Text>
                          </View>
                        </View>
                        <Text style={styles.slipCardDesc}>{opt.description}</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceText}>₦{opt.price}</Text>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected ? <Check size={14} color="#FFFFFF" /> : null}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Consent Checkbox */}
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => setConsentGiven(!consentGiven)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, consentGiven && styles.checkboxActive]}>
                {consentGiven ? <Check size={14} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.consentText}>
                I confirm that I have the lawful consent of the ID holder to verify this information in accordance with national privacy guidelines.
              </Text>
            </TouchableOpacity>

            {/* Wallet Balance Info */}
            <View style={styles.walletStatusBox}>
              <Wallet size={16} color={colors.primaryLight} />
              <Text style={styles.walletStatusText}>
                Wallet Balance:{" "}
                <Text style={{ fontWeight: "700", color: colors.text }}>
                  ₦{walletBalance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </Text>
              </Text>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#FCA5A5" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                (!hasSufficientBalance || isLoading) && styles.actionBtnDisabled,
              ]}
              onPress={handleGenerateNinSlip}
              disabled={isLoading || !hasSufficientBalance}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionBtnText}>
                  Pay ₦{selectedSlip.price} & Generate Slip
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : activeTab === "BVN" ? (
          /* ============================================================
             BVN SLIP GENERATION FORM
             ============================================================ */
          <View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Enter Bank Verification Number (BVN)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 22234567890"
                  placeholderTextColor={colors.textMuted}
                  value={idNumber}
                  onChangeText={setIdNumber}
                  keyboardType="number-pad"
                  maxLength={11}
                />
                <View style={styles.digitBadge}>
                  <Text style={styles.digitBadgeText}>{idNumber.length}/11</Text>
                </View>
              </View>
            </View>

            <View style={styles.walletStatusBox}>
              <Shield size={16} color={colors.primaryLight} />
              <Text style={styles.walletStatusText}>
                Official BVN Slip Fee:{" "}
                <Text style={{ fontWeight: "700", color: colors.text }}>₦500</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert("BVN Verification", "Enter an 11-digit BVN to verify.")}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>Generate BVN Slip (₦500)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ============================================================
             HISTORY TAB
             ============================================================ */
          <View style={styles.emptyHistoryCard}>
            <Clock size={32} color={colors.textMuted} />
            <Text style={styles.emptyHistoryTitle}>No slips generated yet</Text>
            <Text style={styles.emptyHistorySubtitle}>
              All your generated NIN & BVN slips will appear here with instant reprint and PDF sharing options.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Result Demographics Modal */}
      <Modal visible={isResultOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CheckCircle2 size={22} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Verification Successful</Text>
              </View>
              <TouchableOpacity onPress={() => setIsResultOpen(false)} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.demographicsContent}>
              {demographics?.photo ? (
                <View style={styles.photoWrapper}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${demographics.photo}` }}
                    style={styles.photo}
                  />
                </View>
              ) : null}

              <View style={styles.demoField}>
                <Text style={styles.demoLabel}>Full Name</Text>
                <Text style={styles.demoValue}>
                  {`${demographics?.firstName || ""} ${demographics?.middleName || ""} ${demographics?.surname || ""}`.trim() || "Verified Record"}
                </Text>
              </View>

              <View style={styles.demoField}>
                <Text style={styles.demoLabel}>NIN</Text>
                <Text style={styles.demoValue}>{demographics?.nin || idNumber}</Text>
              </View>

              <View style={styles.demoRow}>
                <View style={[styles.demoField, { flex: 1 }]}>
                  <Text style={styles.demoLabel}>Date of Birth</Text>
                  <Text style={styles.demoValue}>{demographics?.birthdate || "Verified"}</Text>
                </View>
                <View style={[styles.demoField, { flex: 1 }]}>
                  <Text style={styles.demoLabel}>Gender</Text>
                  <Text style={styles.demoValue}>{demographics?.gender || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.demoField}>
                <Text style={styles.demoLabel}>Phone</Text>
                <Text style={styles.demoValue}>{demographics?.telephoneno || "Registered"}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShareSlip}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.shareBtnText}>Share / Save PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginLeft: 6,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  contentContainer: {
    padding: 20,
  },
  searchModeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primaryLight,
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modeBtnTextActive: {
    color: colors.primaryLight,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 14,
    letterSpacing: 1.5,
  },
  digitBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  digitBadgeText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  slipOptionsList: {
    gap: 10,
    marginBottom: 20,
  },
  slipCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    padding: 14,
  },
  slipCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#0284C70D",
  },
  slipCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  slipCardName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  slipTag: {
    backgroundColor: "#0284C722",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  slipTagText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: "700",
  },
  slipCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  priceContainer: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.gold,
    marginBottom: 6,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  walletStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  walletStatusText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: "#FCA5A5",
    fontSize: 13,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyHistoryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  emptyHistorySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  demographicsContent: {
    padding: 20,
  },
  photoWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  photo: {
    width: 90,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  demoField: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  demoRow: {
    flexDirection: "row",
    gap: 10,
  },
  demoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  demoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "700",
    marginTop: 4,
  },
  modalActions: {
    paddingHorizontal: 20,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
