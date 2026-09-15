import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  X,
  Wallet,
  Check,
  Eye,
  Clock,
  ArrowLeft,
  Phone,
  FileText,
} from "lucide-react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { colors } from "../../constants/theme";
import BrandLoader from "../../components/BrandLoader";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SlipFormatConfig {
  id: "nin_basic" | "nin_regular" | "nin_standard" | "nin_premium" | "nin_vnin";
  label: string;
  defaultPrice: number;
  imageSource: any;
  serviceKey: string;
}

const NIN_QUERY_SLIPS: SlipFormatConfig[] = [
  {
    id: "nin_basic",
    label: "Basic Slip",
    defaultPrice: 400,
    imageSource: require("../../assets/examples/nin_basic.png"),
    serviceKey: "NIN_BASIC",
  },
  {
    id: "nin_regular",
    label: "Regular Slip",
    defaultPrice: 500,
    imageSource: require("../../assets/examples/nin_regular_example.png"),
    serviceKey: "NIN_REGULAR",
  },
  {
    id: "nin_standard",
    label: "Standard Slip",
    defaultPrice: 700,
    imageSource: require("../../assets/examples/nin_standard_example.png"),
    serviceKey: "NIN_STANDARD",
  },
  {
    id: "nin_premium",
    label: "Premium Slip",
    defaultPrice: 1000,
    imageSource: require("../../assets/examples/nin_premium_example.png"),
    serviceKey: "NIN_PREMIUM",
  },
  {
    id: "nin_vnin",
    label: "VNIN Slip",
    defaultPrice: 500,
    imageSource: require("../../assets/examples/nin_vnin.png"),
    serviceKey: "NIN_VNIN",
  },
];

const PHONE_QUERY_SLIPS: SlipFormatConfig[] = [
  {
    id: "nin_regular",
    label: "Regular Slip",
    defaultPrice: 500,
    imageSource: require("../../assets/examples/nin_regular_example.png"),
    serviceKey: "NIN_PHONE_REGULAR",
  },
  {
    id: "nin_standard",
    label: "Standard Slip",
    defaultPrice: 700,
    imageSource: require("../../assets/examples/nin_standard_example.png"),
    serviceKey: "NIN_PHONE_STANDARD",
  },
  {
    id: "nin_premium",
    label: "Premium Slip",
    defaultPrice: 1000,
    imageSource: require("../../assets/examples/nin_premium_example.png"),
    serviceKey: "NIN_PHONE_PREMIUM",
  },
];

export default function NinSlipsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  // Search Mode: Query by NIN Number vs Query by Phone Number
  const [searchMode, setSearchMode] = useState<"NIN" | "PHONE">("NIN");
  const [identifierInput, setIdentifierInput] = useState("");
  const [selectedFormatId, setSelectedFormatId] = useState<
    "nin_basic" | "nin_regular" | "nin_standard" | "nin_premium" | "nin_vnin"
  >("nin_premium");

  // Statutory NDPA consent only (fee authorization checkbox is no longer needed)
  const [ndpaConsent, setNdpaConsent] = useState(false);

  // States for Modals and Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Specimen Preview Lightbox
  const [lightbox, setLightbox] = useState<{
    visible: boolean;
    imageSource: any;
    label: string;
  }>({
    visible: false,
    imageSource: null,
    label: "",
  });

  // Result Modal State
  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    pdfBase64?: string;
    pdfUrl?: string;
    userData?: any;
    slipLabel?: string;
    identifier?: string;
  }>({ visible: false });

  // Fetch Live Pricing & Gateway Availability
  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["ninSlipsProviderStatus"],
    queryFn: async () => {
      try {
        return await api.get("/api/nin/slips/status");
      } catch {
        return null;
      }
    },
  });

  // Fetch Past Slips History
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ["ninSlipsHistory", searchMode],
    queryFn: async () => {
      try {
        return await api.get(`/api/nin/slips/history?searchType=${searchMode}`);
      } catch {
        return null;
      }
    },
  });

  // Available Slips & Live Pricing Maps
  const pricingMap = statusData?.pricing || {};
  const availableNINSlips = statusData?.status?.availableNINSlips || [
    "nin_basic",
    "nin_regular",
    "nin_standard",
    "nin_premium",
    "nin_vnin",
  ];
  const availablePhoneSlips = statusData?.status?.availablePhoneSlips || [
    "nin_regular",
    "nin_standard",
    "nin_premium",
  ];

  const currentOptions = searchMode === "NIN" ? NIN_QUERY_SLIPS : PHONE_QUERY_SLIPS;
  const currentAvailableList = searchMode === "NIN" ? availableNINSlips : availablePhoneSlips;

  // Compute availability map for each format
  const activeMap: Record<string, boolean> = {};
  currentOptions.forEach((opt) => {
    const pInfo = pricingMap[opt.serviceKey];
    const isServiceActive = pInfo ? pInfo.isActive !== false : true;
    const isGatewayAvailable = currentAvailableList.includes(opt.id);
    activeMap[opt.id] = isServiceActive && isGatewayAvailable;
  });

  // Get current active price
  const selectedOption =
    currentOptions.find((o) => o.id === selectedFormatId) || currentOptions[0];
  const pInfo = pricingMap[selectedOption?.serviceKey];
  const currentPrice = pInfo?.price ?? selectedOption?.defaultPrice ?? 500;

  const walletBalance = user?.wallet?.balance ?? 0;
  const isSelectedFormatAvailable = activeMap[selectedFormatId] !== false;

  // Clean identifier input
  const cleanIdentifier = identifierInput.trim();
  const isInputValid =
    searchMode === "NIN"
      ? cleanIdentifier.length === 11 && /^\d{11}$/.test(cleanIdentifier)
      : cleanIdentifier.length >= 10 && cleanIdentifier.length <= 14 && /^\d+$/.test(cleanIdentifier);

  const canSubmit =
    isInputValid &&
    ndpaConsent &&
    isSelectedFormatAvailable &&
    !isGenerating &&
    !isStatusLoading;

  // Handle Generation
  const handleGenerate = async () => {
    setErrorMessage(null);

    if (!isInputValid) {
      setErrorMessage(
        searchMode === "NIN"
          ? "Please enter a valid 11-digit National Identity Number."
          : "Please enter a valid 11-digit Nigerian phone number."
      );
      return;
    }

    if (!ndpaConsent) {
      setErrorMessage("Please accept the NDPA 2023 statutory consent to proceed.");
      return;
    }

    if (!isSelectedFormatAvailable) {
      setErrorMessage("The selected slip format is currently unavailable. Please choose another format.");
      return;
    }

    if (walletBalance < currentPrice) {
      Alert.alert(
        "Insufficient Balance",
        `This slip requires ₦${currentPrice.toLocaleString()}, but your balance is ₦${walletBalance.toLocaleString()}. Would you like to fund your wallet?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Fund Wallet", onPress: () => router.push("/wallet/fund" as any) },
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      const res = await api.post("/api/nin/slips", {
        identifier: cleanIdentifier,
        searchType: searchMode,
        slipType: selectedFormatId,
        attestationsAccepted: true,
      });

      setIsGenerating(false);

      if (!res?.success || !res?.pdfBase64) {
        setErrorMessage(res?.message || "Failed to generate NIN slip. Please check the details and try again.");
        return;
      }

      // Success: Open Result Modal
      setResultModal({
        visible: true,
        pdfBase64: res.pdfBase64,
        pdfUrl: res.pdfUrl,
        userData: res.userData,
        slipLabel: selectedOption.label,
        identifier: cleanIdentifier,
      });

      // Refresh wallet & history
      refreshProfile();
      refetchHistory();
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMessage(err.message || "Unable to complete request. Please check your network connection.");
    }
  };

  // Download Slip PDF
  const handleDownloadPdf = async () => {
    if (!resultModal.pdfBase64) {
      Alert.alert("Notice", "No document available for download.");
      return;
    }

    try {
      const filename = `NIN_Slip_${resultModal.identifier || "document"}_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, resultModal.pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Official NIMC Slip",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", `Slip PDF saved successfully to ${filename}`);
      }
    } catch (err: any) {
      Alert.alert("Error", "Could not save PDF. Please try again.");
    }
  };

  const historyList: any[] = historyData?.history || [];

  return (
    <View style={styles.screen}>
      {/* App Header */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NIN Verification Slips</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Method Segmented Control */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              searchMode === "NIN" && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSearchMode("NIN");
              setErrorMessage(null);
            }}
            activeOpacity={0.8}
          >
            <FileText
              size={16}
              color={searchMode === "NIN" ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentBtnText,
                searchMode === "NIN" && styles.segmentBtnTextActive,
              ]}
            >
              Query by NIN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              searchMode === "PHONE" && styles.segmentBtnActive,
            ]}
            onPress={() => {
              setSearchMode("PHONE");
              setErrorMessage(null);
              // Switch to a format valid for phone search if needed
              if (selectedFormatId === "nin_basic" || selectedFormatId === "nin_vnin") {
                setSelectedFormatId("nin_premium");
              }
            }}
            activeOpacity={0.8}
          >
            <Phone
              size={16}
              color={searchMode === "PHONE" ? colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentBtnText,
                searchMode === "PHONE" && styles.segmentBtnTextActive,
              ]}
            >
              Query by Phone
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Alert Box */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={colors.error} style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Identifier Input Field */}
        <View style={styles.inputCard}>
          <View style={styles.inputLabelRow}>
            <Text style={styles.inputLabel}>
              {searchMode === "NIN"
                ? "11-Digit National Identity Number (NIN)"
                : "Registered Phone Number"}
            </Text>
            <Text style={styles.inputCounter}>
              {identifierInput.length}/{searchMode === "NIN" ? 11 : 11}
            </Text>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              maxLength={searchMode === "NIN" ? 11 : 14}
              value={identifierInput}
              onChangeText={(val) => {
                setIdentifierInput(val.replace(/\D/g, ""));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder={
                searchMode === "NIN"
                  ? "Enter 11-digit NIN"
                  : "Enter phone number (e.g. 080...)"
              }
              placeholderTextColor={colors.textMuted}
            />
            {isInputValid ? (
              <CheckCircle2 size={20} color={colors.success} style={{ marginLeft: 8 }} />
            ) : null}
          </View>
        </View>

        {/* Slip Format Selection */}
        <View style={styles.formatSection}>
          <Text style={styles.sectionLabel}>Select Slip Format</Text>

          <View style={styles.formatsList}>
            {currentOptions.map((opt) => {
              const isSelected = selectedFormatId === opt.id;
              const isAvailable = activeMap[opt.id] !== false;
              const formatPrice = pricingMap[opt.serviceKey]?.price ?? opt.defaultPrice;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.formatCard,
                    isSelected && styles.formatCardSelected,
                    !isAvailable && styles.formatCardDisabled,
                  ]}
                  onPress={() => {
                    if (isAvailable) setSelectedFormatId(opt.id);
                  }}
                  activeOpacity={isAvailable ? 0.75 : 1}
                >
                  <View style={styles.formatCardLeft}>
                    {/* Radio circle */}
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                        !isAvailable && styles.radioCircleDisabled,
                      ]}
                    >
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>

                    <View style={styles.formatInfo}>
                      <View style={styles.formatTitleRow}>
                        <Text
                          style={[
                            styles.formatTitle,
                            !isAvailable && { color: colors.textMuted },
                          ]}
                        >
                          {opt.label}
                        </Text>

                        {/* View Example Specimen Button */}
                        <TouchableOpacity
                          style={styles.viewExampleBtn}
                          onPress={() =>
                            setLightbox({
                              visible: true,
                              imageSource: opt.imageSource,
                              label: opt.label,
                            })
                          }
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Eye size={12} color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.viewExampleText}>View Example</Text>
                        </TouchableOpacity>

                        {!isAvailable ? (
                          <View style={styles.unavailableBadge}>
                            <Text style={styles.unavailableBadgeText}>Unavailable</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Price on right */}
                  <View style={styles.formatPriceWrap}>
                    <Text
                      style={[
                        styles.formatPrice,
                        !isAvailable && styles.formatPriceDisabled,
                      ]}
                    >
                      ₦{Number(formatPrice).toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Statutory NDPA Consent (Single Checkbox, No Fee Checkbox) */}
        <TouchableOpacity
          style={styles.consentRow}
          onPress={() => setNdpaConsent(!ndpaConsent)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkboxBox,
              ndpaConsent && styles.checkboxBoxChecked,
            ]}
          >
            {ndpaConsent ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text style={styles.consentText}>
            I confirm that I am the owner of this NIN or have lawful authorization to retrieve this record in accordance with the{" "}
            <Text style={{ fontWeight: "800", color: colors.text }}>
              Nigeria Data Protection Act (NDPA) 2023
            </Text>{" "}
            and LoraBiz Terms.
          </Text>
        </TouchableOpacity>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleGenerate}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            Verify & Generate (₦{Number(currentPrice).toLocaleString()})
          </Text>
        </TouchableOpacity>

        {/* Recent NIN Slips History */}
        {historyList.length > 0 ? (
          <View style={styles.historySection}>
            <Text style={styles.sectionLabel}>Recent Slips Generated</Text>
            <View style={styles.historyCard}>
              {historyList.slice(0, 5).map((item, idx) => (
                <View
                  key={item.id || idx}
                  style={[
                    styles.historyItem,
                    idx === Math.min(historyList.length, 5) - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.historyIconWrap}>
                    <FileText size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {item.fullName || item.identifier || "NIN Slip"}
                    </Text>
                    <Text style={styles.historySub}>
                      {item.slipType || "Standard"} •{" "}
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                    </Text>
                  </View>
                  <View style={styles.historyStatusBadge}>
                    <Text style={styles.historyStatusText}>
                      {item.status || "SUCCESS"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Reusable Shrunken Logo BrandLoader (Blocks touch inputs while generating) */}
      <BrandLoader
        visible={isGenerating}
        message="Retrieving official NIMC record..."
      />

      {/* SPECIMEN PREVIEW LIGHTBOX MODAL */}
      <Modal
        visible={lightbox.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setLightbox({ visible: false, imageSource: null, label: "" })}
      >
        <View style={styles.lightboxBackdrop}>
          <View style={styles.lightboxCard}>
            <View style={styles.lightboxHeader}>
              <Text style={styles.lightboxTitle}>{lightbox.label} Specimen</Text>
              <TouchableOpacity
                onPress={() => setLightbox({ visible: false, imageSource: null, label: "" })}
                style={styles.lightboxCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.lightboxImageWrap}>
              {lightbox.imageSource ? (
                <Image
                  source={lightbox.imageSource}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </View>
        </View>
      </Modal>

      {/* RESULT MODAL WITH DEMOGRAPHICS & PDF DOWNLOAD */}
      <Modal
        visible={resultModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setResultModal({ visible: false })}
      >
        <View style={styles.resultBackdrop}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CheckCircle2 size={20} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={styles.resultTitle}>NIN Record Verified</Text>
              </View>
              <TouchableOpacity
                onPress={() => setResultModal({ visible: false })}
                style={styles.lightboxCloseBtn}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.55 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Demographics Summary */}
              {resultModal.userData ? (
                <View style={styles.demoCard}>
                  {resultModal.userData.photo ? (
                    <Image
                      source={{
                        uri: `data:image/jpeg;base64,${resultModal.userData.photo}`,
                      }}
                      style={styles.demoPhoto}
                    />
                  ) : null}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.demoName}>
                      {[
                        resultModal.userData.firstname,
                        resultModal.userData.middlename,
                        resultModal.userData.surname,
                      ]
                        .filter(Boolean)
                        .join(" ") || "Verified Identity"}
                    </Text>
                    <Text style={styles.demoDetail}>
                      NIN: {resultModal.userData.nin || resultModal.identifier}
                    </Text>
                    {resultModal.userData.birthdate ? (
                      <Text style={styles.demoDetail}>
                        DOB: {resultModal.userData.birthdate}
                      </Text>
                    ) : null}
                    {resultModal.userData.gender ? (
                      <Text style={styles.demoDetail}>
                        Gender: {resultModal.userData.gender}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>
                  Your official {resultModal.slipLabel || "NIN Slip"} PDF has been generated and is ready to download.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.downloadBtn}
                onPress={handleDownloadPdf}
                activeOpacity={0.85}
              >
                <Download size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.downloadBtnText}>Download Official PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeResultBtn}
                onPress={() => setResultModal({ visible: false })}
                activeOpacity={0.8}
              >
                <Text style={styles.closeResultBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  /* Segmented Control */
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: colors.text,
    fontWeight: "800",
  },

  /* Error Box */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: colors.error,
  },

  /* Input Card */
  inputCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputCounter: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  /* Formats List */
  formatSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  formatsList: {
    gap: 8,
  },
  formatCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
  },
  formatCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(200, 45, 117, 0.03)",
  },
  formatCardDisabled: {
    opacity: 0.5,
    backgroundColor: "#F1F5F9",
  },
  formatCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioCircleDisabled: {
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  formatInfo: {
    flex: 1,
  },
  formatTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  viewExampleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(200, 45, 117, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewExampleText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  unavailableBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unavailableBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
  },
  formatPriceWrap: {
    paddingLeft: 8,
  },
  formatPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
  },
  formatPriceDisabled: {
    color: colors.textMuted,
    textDecorationLine: "line-through",
  },

  /* Statutory NDPA Consent */
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  /* Submit Button */
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* History */
  historySection: {
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
  },
  historyIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(200, 45, 117, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  historySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyStatusBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.success,
  },

  /* Lightbox Modal */
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  lightboxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "100%",
    maxWidth: 420,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  lightboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.06)",
  },
  lightboxTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  lightboxCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0, 0, 0, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImageWrap: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.55,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  lightboxImage: {
    width: "100%",
    height: "100%",
  },

  /* Result Modal */
  resultBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  demoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    marginBottom: 14,
  },
  demoPhoto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  demoName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  demoDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  successBanner: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.success,
    lineHeight: 18,
  },
  resultActions: {
    gap: 10,
  },
  downloadBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  downloadBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  closeResultBtn: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeResultBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
});
