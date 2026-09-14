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
import { getSavedProfile } from "../lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const LOGO_WIDTH = Math.min(Math.round(SCREEN_WIDTH * 0.48), 190);
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * 0.65);

export default function IndexScreen() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  // Smooth entrance animation values
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const tokenRef = useRef(token);
  tokenRef.current = token;
  const userRef = useRef(user);
  userRef.current = user;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const minTimerFinished = useRef(false);
  const hasNavigated = useRef(false);

  const triggerNavigation = async () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // Smooth subtle fade out before screen handoff
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(async () => {
      if (tokenRef.current) {
        if (userRef.current && userRef.current.isProfileComplete === false) {
          router.replace({
            pathname: "/(auth)/register",
            params: {
              fromGoogle: "true",
              googleFirstName: userRef.current.firstName || "",
              googleLastName: userRef.current.lastName || "",
              googleEmail: userRef.current.email || "",
            },
          });
        } else {
          router.replace("/(tabs)");
        }
      } else {
        try {
          const saved = await getSavedProfile();
          if (saved) {
            router.replace("/(auth)/login");
          } else {
            router.replace("/(auth)/welcome");
          }
        } catch {
          router.replace("/(auth)/welcome");
        }
      }
    });
  };

  useEffect(() => {
    // Elegant, crisp brand logo reveal (0 to 600ms)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Minimum brand presentation time: 700ms (fast & responsive, zero white flash)
    const timer = setTimeout(() => {
      minTimerFinished.current = true;
      if (!isLoadingRef.current) {
        triggerNavigation();
      }
    }, 700);

    // Failsafe timer: Never hold the user longer than 2.2s
    const failsafe = setTimeout(() => {
      triggerNavigation();
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(failsafe);
    };
  }, []);

  // Check navigation once loading finishes
  useEffect(() => {
    if (!isLoading && minTimerFinished.current) {
      triggerNavigation();
    }
  }, [isLoading]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#C82D75" translucent />

      {/* Centered Brand Mark on Signature Pink */}
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
          source={require("../assets/logo-white.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C82D75", // Iconic Lorabiz Signature Pink
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: LOGO_WIDTH + 40,
    height: LOGO_HEIGHT + 40,
    justifyContent: "center",
    alignItems: "center",
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});
