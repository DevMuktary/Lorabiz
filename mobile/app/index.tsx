import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Easing,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { brandColors } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Prominent circle matching ALAT by Wema (~82% of screen width)
const CIRCLE_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.82), 340);
const LOGO_WIDTH = 170;
const LOGO_HEIGHT = 154;

export default function IndexScreen() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // Animation values (all running on GPU native driver for 60/120fps)
  const circleScale = useRef(new Animated.Value(0.85)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // State refs to prevent stale closure bugs
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const animationFinished = useRef(false);
  const hasNavigated = useRef(false);

  const triggerNavigation = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    if (tokenRef.current) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/welcome");
    }
  };

  useEffect(() => {
    // 1. Initial enlarge & fade-in of the white circle and brand mark
    Animated.parallel([
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Brand pause: Main logo displays prominently for ~850ms with subtle micro-scale
      Animated.timing(logoScale, {
        toValue: 1.05,
        duration: 850,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // 3. Circular Zoom Reveal: White circle expands outward to envelop viewport
        Animated.parallel([
          Animated.timing(circleScale, {
            toValue: 18, // 340 * 18 = 6120px, fully envelops any iPhone display
            duration: 750,
            easing: Easing.bezier(0.35, 0, 0.15, 1),
            useNativeDriver: true,
          }),
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 350,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]).start(() => {
          animationFinished.current = true;
          // If auth initialization finished, navigate immediately
          if (!isLoadingRef.current) {
            triggerNavigation();
          }
        });
      });
    });

    // Failsafe timer: Ensure app never hangs on splash under any circumstance
    const failsafeTimeout = setTimeout(() => {
      triggerNavigation();
    }, 3200);

    return () => {
      clearTimeout(failsafeTimeout);
    };
  }, []);

  // When auth state finishes initializing after animation has completed
  useEffect(() => {
    if (!isLoading && animationFinished.current) {
      triggerNavigation();
    }
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C82D75" />

      {/* The Expanding White Circle Mask (ALAT by Wema Style) */}
      <Animated.View
        style={[
          styles.whiteCircle,
          {
            opacity: circleOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      {/* Centered Brand Mark inside the circle */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require("../assets/logo-pink.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C82D75", // Iconic Lorabiz Signature Pink
    justifyContent: "center",
    alignItems: "center",
  },
  whiteCircle: {
    position: "absolute",
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  logoContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});

