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
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import Svg, { Path } from "react-native-svg";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Fingerprint,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  RefreshCw,
} from "lucide-react-native";
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

// Cinematic Shrunken Brand Loader Overlay ("Loading Tiers")
function BrandLoader({ message = "Signing in..." }: { message?: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Breathing pulse on the shrunken logo
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

    // Smooth continuous orbiting ring
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

  // Mode: returning user quick-unlock vs standard 2-step login
  const [isReturningUser, setIsReturningUser] = useState<boolean>(Boolean(savedProfile));
  const [loginStep, setLoginStep] = useState<1 | 2>(1); // 1 = Email/Social, 2 = Password

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Signing in...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // Prompt Face ID / Biometrics on mount if returning user with biometrics enabled
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
      // Biometric canceled by user
    } finally {
      setIsLoading(false);
    }
  }

  function handleContinueToPassword() {
    setErrorMsg(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setLoginStep(2);
  }

  async function handleLogin() {
    setErrorMsg(null);
    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setLoaderMessage("Verifying credentials...");
    setIsLoading(true);
    try {
      const targetEmail = isReturningUser && savedProfile ? savedProfile.email : email.trim();
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
    setLoginStep(1);
    setEmail("");
    setPassword("");
    setErrorMsg(null);
  }

  async function handleGoogleSignIn() {
    try {
      await Linking.openURL(`${BASE_URL}/api/auth/signin/google`);
    } catch (err) {
      setErrorMsg("Unable to open Google sign-in. Please use email and password.");
    }
  }

  const userInitial = (
    savedProfile?.firstName?.[0] ||
    savedProfile?.name?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Brand Loading Overlay ("Loading Tiers") */}
      {(isLoading || isVerifyingOtp) && <BrandLoader message={loaderMessage} />}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: Math.max(insets.top, 20) + 8,
            paddingBottom: Math.max(insets.bottom, 20) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (requireOtp) {
                setRequireOtp(false);
                setOtpCode("");
              } else if (!isReturningUser && loginStep === 2) {
                setLoginStep(1);
                setErrorMsg(null);
              } else {
                router.back();
              }
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.securityBadge}>
            <ShieldCheck size={14} color="#10B981" />
            <Text style={styles.securityBadgeText}>256-bit Encrypted</Text>
          </View>
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
          /* SCREEN STATE B: Returning User Quick Unlock (Face ID) */
          /* ---------------------------------------------------- */
          <View style={styles.contentSection}>
            {/* User Profile Monogram Badge */}
            <View style={styles.returningHeader}>
              <View style={styles.avatarGlowWrapper}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>{userInitial}</Text>
                </View>
              </View>
              <Text style={styles.title}>
                Welcome back, {savedProfile.firstName || "User"}
              </Text>
              <View style={styles.emailBadge}>
                <Text style={styles.emailBadgeText}>{savedProfile.maskedEmail}</Text>
              </View>
            </View>

            {/* Quick Face ID / Touch ID Button */}
            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                style={styles.biometricTriggerButton}
                onPress={handleBiometricUnlock}
                activeOpacity={0.85}
              >
                <Fingerprint size={24} color="#FFFFFF" />
                <Text style={styles.biometricTriggerText}>
                  Unlock with Face ID
                </Text>
              </TouchableOpacity>
            )}

            {/* Password Input Alternative */}
            <View style={styles.returningForm}>
              <View style={[styles.inputCard, passwordFocused && styles.inputCardActive]}>
                <Lock size={18} color={passwordFocused ? colors.primary : "#94A3B8"} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, (!password || isLoading) && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={!password || isLoading}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            {/* Switch Account */}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleSwitchAccount}
              activeOpacity={0.7}
            >
              <Text style={styles.switchButtonText}>
                Not {savedProfile.firstName || "you"}? Switch account
              </Text>
            </TouchableOpacity>
          </View>
        ) : loginStep === 1 ? (
          /* ---------------------------------------------------- */
          /* SCREEN STATE C: Step 1 — Email & Continue with Google */
          /* ---------------------------------------------------- */
          <View style={styles.contentSection}>
            {/* Cinematic Brand Header (Shrunk, clean, no explanation) */}
            <View style={styles.brandHeader}>
              <Image
                source={require("../../assets/logo-pink.png")}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Log In</Text>
            </View>

            {/* Prominent "Continue with Google" Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <GoogleIcon size={20} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Input Field */}
            <View style={[styles.inputCard, emailFocused && styles.inputCardActive]}>
              <Mail size={18} color={emailFocused ? colors.primary : "#94A3B8"} />
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onSubmitEditing={handleContinueToPassword}
                returnKeyType="next"
              />
            </View>

            {/* Primary CTA: Continue */}
            <TouchableOpacity
              style={[styles.primaryButton, !email.trim() && styles.btnDisabled]}
              onPress={handleContinueToPassword}
              disabled={!email.trim()}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Footer Sign Up Link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerMuted}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.footerLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ---------------------------------------------------- */
          /* SCREEN STATE D: Step 2 — Password Entry & Biometrics */
          /* ---------------------------------------------------- */
          <View style={styles.contentSection}>
            {/* Cinematic Brand Header */}
            <View style={styles.brandHeader}>
              <Image
                source={require("../../assets/logo-pink.png")}
                style={styles.brandLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Enter Password</Text>
            </View>

            {/* Active User Email Pill with Edit Button */}
            <View style={styles.emailPillContainer}>
              <Text style={styles.emailPillText} numberOfLines={1}>
                {email}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setLoginStep(1);
                  setErrorMsg(null);
                }}
              >
                <Text style={styles.emailPillEdit}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Password Input Field */}
            <View style={[styles.inputCard, passwordFocused && styles.inputCardActive]}>
              <Lock size={18} color={passwordFocused ? colors.primary : "#94A3B8"} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={handleLogin}
                returnKeyType="go"
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
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
                onPress={() =>
                  Linking.openURL(`${BASE_URL}/auth/forgot-password`)
                }
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {/* Primary CTA: Sign In */}
            <TouchableOpacity
              style={[styles.primaryButton, (!password || isLoading) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={!password || isLoading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Biometric Unlock (if available) */}
            {biometricAvailable && biometricEnabled && (
              <TouchableOpacity
                style={styles.secondaryBiometricButton}
                onPress={handleBiometricUnlock}
                activeOpacity={0.8}
              >
                <Fingerprint size={20} color={colors.primary} />
                <Text style={styles.secondaryBiometricText}>
                  Sign in with Face ID
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
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
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 26,
  },
  brandLogo: {
    width: 130,
    height: 42,
    marginBottom: 12,
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
  errorPill: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 12,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
    textTransform: "uppercase",
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
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 6,
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
  emailPillContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  emailPillText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
    flex: 1,
  },
  emailPillEdit: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 8,
  },
  forgotPasswordRow: {
    alignItems: "flex-end",
    marginBottom: 18,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
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
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  secondaryBiometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginTop: 14,
  },
  secondaryBiometricText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 26,
  },
  footerMuted: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },

  // Returning User Specific Styles
  returningHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarGlowWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(200, 45, 117, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  emailBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  emailBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  biometricTriggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 18,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  biometricTriggerText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginLeft: 10,
  },
  returningForm: {
    width: "100%",
  },
  switchButton: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 6,
  },
  switchButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  // Shrunken Brand Loader Overlay ("Loading Tiers")
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
});
