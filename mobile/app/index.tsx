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

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Prominent circle matching ALAT by Wema (~82% of screen width)
const CIRCLE_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.82), 340);
const LOGO_WIDTH = 170;
const LOGO_HEIGHT = 154;

export default function IndexScreen() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // Animation values (all running on GPU native driver for 60/120fps)
  // Starts compact in the center ("the circle will not start that big")
  const circleScale = useRef(new Animated.Value(0.2)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.2)).current;
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
    // Single continuous, fluid zoom reveal over 3.4 seconds (ZERO FREEZE, ZERO PAUSES)
    // Starts small in center and continuously, smoothly expands ("it will be revealing till it's finished, maybe 3 to 4 seconds")
    Animated.parallel([
      // Quick smooth entrance of the white circle and logo (0 to 250ms)
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),

      // Continuous circle expansion over 3400ms (NO intermediate stop or freeze)
      Animated.timing(circleScale, {
        toValue: 7, // 340 * 7 = 2,380px, fully envelops screen diagonal with no texture clipping
        duration: 3400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),

      // Logo tracks smoothly with the circle expansion
      Animated.timing(logoScale, {
        toValue: 1.15,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Logo dissolves as circle sweeps past screen edges
      Animated.sequence([
        Animated.delay(2200),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      animationFinished.current = true;
      if (!isLoadingRef.current) {
        triggerNavigation();
      }
    });

    // Seamless navigation handoff at t = 2800ms while circle is at full expansion
    // Mounts the Welcome screen with ZERO blank white screen delay
    const handoffTimer = setTimeout(() => {
      if (!isLoadingRef.current) {
        triggerNavigation();
      }
    }, 2800);

    // Failsafe timer: Ensure app never hangs on splash under any circumstance
    const failsafeTimeout = setTimeout(() => {
      triggerNavigation();
    }, 4500);

    return () => {
      clearTimeout(handoffTimer);
      clearTimeout(failsafeTimeout);
    };
  }, []);

  // When auth state finishes initializing after animation has completed
  useEffect(() => {
    if (!isLoading && (animationFinished.current || hasNavigated.current)) {
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
