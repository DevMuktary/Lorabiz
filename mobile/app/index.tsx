import React, { useEffect, useRef, useState } from "react";
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
import WelcomeView from "../components/WelcomeView";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base circle diameter (~82% of screen width)
const CIRCLE_SIZE = Math.min(Math.round(SCREEN_WIDTH * 0.82), 340);
const LOGO_WIDTH = 170;
const LOGO_HEIGHT = 154;

export default function IndexScreen() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [showSplash, setShowSplash] = useState(true);

  // Animation values (GPU native driver for 60/120fps)
  // Starts compact in the center ("the circle will not start that big")
  const circleScale = useRef(new Animated.Value(0.15)).current;
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.18)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const splashOverlayOpacity = useRef(new Animated.Value(1)).current;

  // State refs to prevent stale closure bugs
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  useEffect(() => {
    // Single continuous, fluid reveal over 3.6 seconds (NO FREEZE, NO PAUSE)
    // Starts small in center and continuously expands ("it will have to be coming... so it will be revealing till it's finished, maybe 3 to 4 seconds")
    Animated.parallel([
      // 1. Initial fade-in of circle and logo (0 to 350ms)
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      // 2. Continuous, unbroken circle expansion over 3600ms (ZERO FREEZE at any point)
      Animated.timing(circleScale, {
        toValue: 16,
        duration: 3600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),

      // 3. Logo scaling tracks smoothly alongside the circle
      Animated.timing(logoScale, {
        toValue: 1.25,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // 4. Logo dissolves as circle nears full envelopment
      Animated.sequence([
        Animated.delay(2300),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),

      // 5. ZERO WHITE SCREEN FLASH: Splash overlay dissolves seamlessly into WelcomeView underneath
      Animated.sequence([
        Animated.delay(2700),
        Animated.timing(splashOverlayOpacity, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // If user is authenticated, route to main tabs
      if (tokenRef.current) {
        router.replace("/(tabs)");
      } else {
        // WelcomeView is already pre-rendered underneath and interactive; unmount splash overlay
        setShowSplash(false);
      }
    });

    // Failsafe timer: Ensure app never hangs under any circumstance
    const failsafeTimeout = setTimeout(() => {
      if (tokenRef.current) {
        router.replace("/(tabs)");
      } else {
        setShowSplash(false);
      }
    }, 4500);

    return () => {
      clearTimeout(failsafeTimeout);
    };
  }, []);

  return (
    <View style={styles.rootContainer}>
      {/* Base Layer: Pre-rendered Welcome Screen (Eliminates 100% of route transition delay and white screen flash) */}
      <WelcomeView />

      {/* Top Layer: Splash Presentation Overlay */}
      {showSplash && (
        <Animated.View
          style={[
            styles.splashOverlay,
            {
              opacity: splashOverlayOpacity,
            },
          ]}
          pointerEvents={showSplash ? "auto" : "none"}
        >
          <StatusBar barStyle="light-content" backgroundColor="#C82D75" />

          {/* Continuous Expanding White Circle */}
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
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#C82D75", // Iconic Lorabiz Pink
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
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
