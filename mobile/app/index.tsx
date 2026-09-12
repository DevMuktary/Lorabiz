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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function IndexScreen() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // Animation values (all running on GPU native driver for 60/120fps)
  const circleScale = useRef(new Animated.Value(0.4)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const animationFinished = useRef(false);

  useEffect(() => {
    // 1. Initial fade-in of the white circle and logo
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Brief pause, then smooth circular zoom-out reveal (matching ALAT by Wema)
      setTimeout(() => {
        Animated.timing(circleScale, {
          toValue: 24, // Expands well beyond any screen diagonal
          duration: 750,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }).start(() => {
          animationFinished.current = true;
          navigateNext();
        });
      }, 400);
    });
  }, []);

  // When auth state is ready AND animation completes, transition smoothly
  useEffect(() => {
    if (!isLoading && animationFinished.current) {
      navigateNext();
    }
  }, [isLoading, token]);

  function navigateNext() {
    if (isLoading) return;
    if (token) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/welcome");
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={brandColors.primary} />

      {/* The Expanding White Circle Mask (ALAT by Wema Style) */}
      <Animated.View
        style={[
          styles.whiteCircle,
          {
            opacity: contentOpacity,
            transform: [{ scale: circleScale }],
          },
        ]}
      />

      {/* Centered Brand Mark inside the circle */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: contentOpacity,
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

const CIRCLE_SIZE = 150;

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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logoImage: {
    width: 110,
    height: 38,
  },
});
