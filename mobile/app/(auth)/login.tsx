import React, { useState, useEffect } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Lock, Mail, Eye, EyeOff, Fingerprint, ShieldCheck, ArrowRight, X } from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing } from "../../constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login, biometricAvailable, biometricEnabled, promptBiometricUnlock } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2FA OTP State
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Try biometric unlock on mount if enabled
  useEffect(() => {
    if (biometricAvailable && biometricEnabled) {
      handleBiometricUnlock();
    }
  }, [biometricAvailable, biometricEnabled]);

  async function handleBiometricUnlock() {
    const success = await promptBiometricUnlock();
    if (success) {
      router.replace("/(tabs)");
    }
  }

  async function handleLogin() {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (result.requireOtp) {
        setRequireOtp(true);
      } else if (result.success) {
        router.replace("/(tabs)");
      } else {
        setErrorMsg(result.message || "Invalid email or password.");
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setErrorMsg("Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg(null);
    try {
      const result = await login(email.trim(), password, otpCode.trim());
      if (result.success) {
        router.replace("/(tabs)");
      } else {
        setErrorMsg(result.message || "Invalid or expired code.");
      }
    } catch (err) {
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your wallet, NIN/BVN slips, and business services.
          </Text>
        </View>

        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {!requireOtp ? (
          /* Standard Email & Password Form */
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textMuted} />
                  ) : (
                    <Eye size={20} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Biometric Quick Unlock */}
            {biometricAvailable && biometricEnabled ? (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricUnlock}
                activeOpacity={0.7}
              >
                <Fingerprint size={22} color={colors.primaryLight} />
                <Text style={styles.biometricText}>Unlock with Biometrics</Text>
              </TouchableOpacity>
            ) : null}

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.linkText}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 2FA OTP Screen */
          <View style={styles.form}>
            <View style={styles.otpHeader}>
              <ShieldCheck size={36} color={colors.primary} />
              <Text style={styles.otpTitle}>Two-Factor Verification</Text>
              <Text style={styles.otpSubtitle}>
                Enter the 6-digit security code sent to your email or generated by your authenticator app.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-Digit Verification Code</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isVerifyingOtp && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isVerifyingOtp}
              activeOpacity={0.8}
            >
              {isVerifyingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setRequireOtp(false);
                setOtpCode("");
              }}
            >
              <Text style={styles.backButtonText}>Back to login</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 170,
    height: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 320,
  },
  errorBox: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 14,
  },
  eyeButton: {
    padding: 6,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  biometricText: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "700",
  },
  otpHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
  },
  otpSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 6,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: "center",
    marginTop: 16,
    padding: 8,
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
