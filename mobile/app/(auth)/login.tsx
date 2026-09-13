import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Animated,
  Easing,
  StatusBar,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  X,
} from "lucide-react-native";
import { WebView } from "react-native-webview";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../constants/theme";
import { BASE_URL } from "../../lib/api";

// Official Multi-Color Google G Icon
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </Svg>
  );
}

// Sleek Circular Back Chevron Icon matching ALAT (Screenshot 1 & 2)
function ChevronLeftIcon({ size = 20, color = "#0F172A" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  );
}

// Right Arrow Icon for Primary Button (Screenshot 3)
function ArrowRightIcon({ size = 18, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  );
}

// Edit Pencil Icon inside Masked Email Pill (Screenshot 1)
function EditPencilIcon({ size = 14, color = "#475569" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <Path d="m15 5 4 4" />
    </Svg>
  );
}

// Bottom Biometric / Face ID Scanner Icon matching ALAT (Screenshot 1)
function BiometricScanIcon({ size = 38, color = "#0F172A" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 3H5a2 2 0 0 0-2 2v2" />
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path d="M3 17v2a2 2 0 0 0 2 2h2" />
      <Path d="M9 10a3 3 0 0 1 6 0v4a3 3 0 0 1-6 0v-4z" />
      <Path d="M12 7.5v1.5" />
      <Path d="M12 15v1.5" />
    </Svg>
  );
}

// Cinematic Shrunken Brand Loader Overlay ("Loading Tiers")
function BrandLoader({ message = "Signing in..." }: { message?: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.loaderBackdrop}>
      <View style={styles.loaderCard}>
        <View style={styles.loaderRingWrapper}>
          <Animated.View
            style={[
              styles.loaderSpinnerRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          />
          <Animated.Image
            source={require("../../assets/logo-pink.png")}
            style={[
              styles.loaderLogo,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.loaderText}>{message}</Text>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    login,
    savedProfile,
    clearSavedProfile,
    biometricAvailable,
    biometricEnabled,
    promptBiometricUnlock,
  } = useAuth();

  // Mode: returning user quick-unlock (Screenshot 1) vs standard 1-step login (Screenshot 3)
  const [isReturningUser, setIsReturningUser] = useState<boolean>(Boolean(savedProfile));

  // Form inputs (Both Email and Password together in 1 step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Signing in...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // In-App Google Sign-In WebView Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // 2FA OTP state
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Synchronize returning user state when savedProfile is loaded
  useEffect(() => {
    if (savedProfile) {
      setIsReturningUser(true);
      setEmail(savedProfile.email);
    }
  }, [savedProfile]);

  // Prompt Face ID / Biometrics on mount if returning user
  useEffect(() => {
    if (isReturningUser && biometricAvailable && biometricEnabled) {
      handleBiometricUnlock();
    }
  }, [isReturningUser, biometricAvailable, biometricEnabled]);

  async function handleBiometricUnlock() {
    setLoaderMessage("Authenticating with Face ID...");
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const success = await promptBiometricUnlock();
      if (success) {
        router.replace("/(tabs)");
      }
    } catch {
      // Canceled
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogin() {
    setErrorMsg(null);
    const targetEmail = isReturningUser && savedProfile ? savedProfile.email : email.trim();

    if (!targetEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoaderMessage("Verifying credentials...");
    setIsLoading(true);
    try {
      const result = await login(targetEmail, password);
      if (result.requireOtp) {
        setRequireOtp(true);
      } else if (result.success) {
        router.replace("/(tabs)");
      } else {
        setErrorMsg(result.message || "Invalid email or password.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg("Please enter the 6-digit code.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg(null);
    try {
      const targetEmail = isReturningUser && savedProfile ? savedProfile.email : email.trim();
      const result = await login(targetEmail, password, cleanCode);
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setErrorMsg(result.message || "Invalid or expired code.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  function handleSwitchAccount() {
    setIsReturningUser(false);
    setPassword("");
    setErrorMsg(null);
  }

  function handleBackToWelcome() {
    if (requireOtp) {
      setRequireOtp(false);
      setOtpCode("");
    } else {
      router.replace("/(auth)/welcome");
    }
  }

  // Calculate generous safe area top padding so back button is never jammed under status bar clock
  const topSafePadding = Math.max(insets.top, 44) + 12;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Subtle Background Corner Glow Waves (Screenshot 3) */}
      <View style={styles.backgroundAuraTopRight} pointerEvents="none" />
      <View style={styles.backgroundAuraBottomLeft} pointerEvents="none" />

      {/* Brand Loading Overlay ("Loading Tiers") */}
      {(isLoading || isVerifyingOtp) && <BrandLoader message={loaderMessage} />}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: topSafePadding,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Bar with ALAT-style Circular Back Button */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.circularBackButton}
            onPress={handleBackToWelcome}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeftIcon size={20} color="#0F172A" />
          </TouchableOpacity>

          {isReturningUser ? (
            <View style={styles.topRightBadge}>
              <View style={styles.topRightInnerDot} />
            </View>
          ) : (
            <View style={styles.securityBadge}>
              <ShieldCheck size={13} color="#10B981" />
              <Text style={styles.securityBadgeText}>256-bit Encrypted</Text>
            </View>
          )}
        </View>

        {/* Error Notification Pill */}
        {errorMsg ? (
          <View style={styles.errorPill}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ---------------------------------------------------- */}
        {/* SCREEN STATE A: 2FA OTP Code Verification */}
        {/* ---------------------------------------------------- */}
        {requireOtp ? (
          <View style={styles.contentSection}>
            <View style={styles.brandHeader}>
              <View style={styles.iconCircle}>
                <ShieldCheck size={32} color={colors.primary} />
              </View>
              <Text style={styles.title}>Two-Factor Code</Text>
              <Text style={styles.subtitleMuted}>
                Enter the 6-digit code sent to your email or authenticator app.
              </Text>
            </View>

            <View style={styles.inputCard}>
              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isVerifyingOtp && styles.btnDisabled]}
              onPress={handleVerifyOtp}
              disabled={isVerifyingOtp}
              activeOpacity={0.88}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setRequireOtp(false);
                setOtpCode("");
              }}
            >
              <Text style={styles.switchButtonText}>Back to password</Text>
            </TouchableOpacity>
          </View>
        ) : isReturningUser && savedProfile ? (
          /* ---------------------------------------------------- */
          /* SCREEN STATE B: Returning User Quick Unlock (Screenshot 1 - ALAT Style) */
          /* ---------------------------------------------------- */
          <View style={styles.returningContainer}>
            {/* User Greeting Row (Avatar on Left, Welcome Back & Name on Right) */}
            <View style={styles.returningProfileRow}>
              <Image
                source={
                  savedProfile.image
                    ? { uri: savedProfile.image }
                    : require("../../assets/default-avatar.png")
                }
                style={styles.returningAvatarImage}
                resizeMode="cover"
              />
              <View style={styles.returningNameColumn}>
                <Text style={styles.returningWelcomeText}>Welcome Back</Text>
                <Text style={styles.returningUserName} numberOfLines={1}>
                  {savedProfile.firstName || savedProfile.name || "Mukhtar"}
                </Text>
              </View>
            </View>

            {/* Masked Email Pill with Edit Pencil (Screenshot 1) */}
            <TouchableOpacity
              style={styles.maskedEmailPill}
              onPress={handleSwitchAccount}
              activeOpacity={0.75}
            >
              <Text style={styles.maskedEmailText}>
                {savedProfile.maskedEmail || savedProfile.email}
              </Text>
              <View style={styles.pillDivider} />
              <EditPencilIcon size={14} color="#475569" />
            </TouchableOpacity>

            {/* Password Section */}
            <View style={styles.passwordFieldSection}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputCard, passwordFocused && styles.inputCardActive]}>
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onSubmitEditing={handleLogin}
                  returnKeyType="go"
                  autoFocus={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggleBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={19} color="#94A3B8" />
                  ) : (
                    <Eye size={19} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Reset Password Link */}
              <View style={styles.resetPasswordRow}>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`${BASE_URL}/auth/forgot-password`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetPasswordText}>Reset password</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Action: Log in */}
              <TouchableOpacity
                style={[styles.primaryButton, (!password || isLoading) && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={!password || isLoading}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryButtonText}>Log in</Text>
              </TouchableOpacity>

              {/* Footer: Don't have an account? Sign up */}
              <View style={styles.footerRow}>
                <Text style={styles.footerMuted}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.footerLinkPink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Biometric Icon Trigger (Screenshot 1) */}
            <View style={styles.bottomBiometricWrapper}>
              <TouchableOpacity
                style={styles.biometricIconTapTarget}
                onPress={handleBiometricUnlock}
                activeOpacity={0.65}
              >
                <BiometricScanIcon size={40} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ---------------------------------------------------- */
          /* SCREEN STATE C: Standard 1-Step Login (Screenshot 3) */
          /* ---------------------------------------------------- */
          <View style={styles.contentSection}>
            {/* LoraBiz Centered Brand Header (Exact Capitalization: LoraBiz) */}
            <View style={styles.standardBrandHeader}>
              <View style={styles.logoRow}>
                <Image
                  source={require("../../assets/logo-pink.png")}
                  style={styles.standardBrandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitleText}>
                  <Text style={styles.brandTextDark}>Lora</Text>
                  <Text style={styles.brandTextPink}>Biz</Text>
                </Text>
              </View>
              <Text style={styles.standardTitle}>Welcome back</Text>
              <Text style={styles.standardSubtitle}>Log in to continue</Text>
            </View>

            {/* Input 1: Email address or phone number */}
            <View style={[styles.inputCard, emailFocused && styles.inputCardActive]}>
              <Mail size={18} color={emailFocused ? colors.primary : "#94A3B8"} />
              <TextInput
                style={styles.textInputField}
                placeholder="Email address or phone number"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                returnKeyType="next"
              />
            </View>

            {/* Input 2: Password */}
            <View style={[styles.inputCard, passwordFocused && styles.inputCardActive]}>
              <Lock size={18} color={passwordFocused ? colors.primary : "#94A3B8"} />
              <TextInput
                style={styles.textInputField}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeToggleBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#94A3B8" />
                ) : (
                  <Eye size={18} color="#94A3B8" />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotPasswordRow}>
              <TouchableOpacity
                onPress={() => Linking.openURL(`${BASE_URL}/auth/forgot-password`)}
              >
                <Text style={styles.forgotPasswordPinkText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary CTA: Log In → */}
            <TouchableOpacity
              style={[
                styles.primaryButtonWithArrow,
                (!email.trim() || !password || isLoading) && styles.btnDisabled,
              ]}
              onPress={handleLogin}
              disabled={!email.trim() || !password || isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Log In</Text>
              <ArrowRightIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Divider: "or" */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Prominent "Continue with Google" In-App Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={() => setIsGoogleModalOpen(true)}
              activeOpacity={0.85}
            >
              <GoogleIcon size={20} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer Sign Up Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerMuted}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.footerLinkPink}>Sign Up →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ---------------------------------------------------- */}
      {/* IN-APP GOOGLE SIGN-IN WEBVIEW MODAL */}
      {/* ---------------------------------------------------- */}
      <Modal
        visible={isGoogleModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsGoogleModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header Bar */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={styles.modalHeaderTitle}>Google Sign In</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsGoogleModalOpen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* In-App Browser WebView */}
          <WebView
            source={{ uri: `${BASE_URL}/api/auth/signin/google` }}
            style={styles.modalWebView}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.modalLoader}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoaderText}>Connecting to Google...</Text>
              </View>
            )}
            onNavigationStateChange={(navState) => {
              // Intercept return redirect back to app
              if (
                navState.url.includes("/dashboard") ||
                navState.url.includes("/overview") ||
                navState.url.includes("callback")
              ) {
                setIsGoogleModalOpen(false);
                router.replace("/(tabs)");
              }
            }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  backgroundAuraTopRight: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(200, 45, 117, 0.07)",
  },
  backgroundAuraBottomLeft: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(200, 45, 117, 0.05)",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  circularBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRightBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(200, 45, 117, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  topRightInnerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  securityBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
    marginLeft: 4,
  },
  contentSection: {
    width: "100%",
    paddingVertical: 10,
  },
  errorPill: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  // ----------------------------------------------------
  // Standard 1-Step Login Styles (Screenshot 3)
  // ----------------------------------------------------
  standardBrandHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  standardBrandLogo: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  brandTitleText: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  brandTextDark: {
    color: "#0F172A",
  },
  brandTextPink: {
    color: colors.primary,
  },
  standardTitle: {
    fontSize: 27,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  standardSubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  inputCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  textInputField: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 16,
    paddingHorizontal: 10,
    fontWeight: "500",
  },
  eyeToggleBtn: {
    padding: 6,
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: -4,
  },
  forgotPasswordPinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  primaryButtonWithArrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
    gap: 8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 22,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 12,
    letterSpacing: 0.1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerMuted: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  footerLinkPink: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },

  // ----------------------------------------------------
  // Returning User Styles (Screenshot 1 - ALAT Style)
  // ----------------------------------------------------
  returningContainer: {
    width: "100%",
    paddingTop: 12,
  },
  returningProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  returningAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    backgroundColor: "#F1F5F9",
    marginRight: 16,
  },
  returningNameColumn: {
    justifyContent: "center",
  },
  returningWelcomeText: {
    fontSize: 15,
    color: "#475569",
    fontWeight: "500",
    marginBottom: 2,
  },
  returningUserName: {
    fontSize: 25,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  maskedEmailPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 26,
  },
  maskedEmailText: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600",
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  passwordFieldSection: {
    width: "100%",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  resetPasswordRow: {
    alignItems: "flex-end",
    marginBottom: 24,
    marginTop: -4,
  },
  resetPasswordText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  bottomBiometricWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 36,
    paddingBottom: 8,
  },
  biometricIconTapTarget: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  // ----------------------------------------------------
  // 2FA Screen Styles
  // ----------------------------------------------------
  brandHeader: {
    alignItems: "center",
    marginBottom: 26,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  subtitleMuted: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(200, 45, 117, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  otpInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 8,
    paddingVertical: 14,
  },
  switchButton: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 6,
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  // ----------------------------------------------------
  // Shrunken Brand Loader Overlay ("Loading Tiers")
  // ----------------------------------------------------
  loaderBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  loaderRingWrapper: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 16,
  },
  loaderSpinnerRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(200, 45, 117, 0.15)",
    borderTopColor: colors.primary,
  },
  loaderLogo: {
    width: 48,
    height: 48,
  },
  loaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.2,
  },

  // ----------------------------------------------------
  // In-App Google Sign-In WebView Modal Styles
  // ----------------------------------------------------
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalWebView: {
    flex: 1,
  },
  modalLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modalLoaderText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "600",
  },
});
