// app/index.tsx
// Home Screen

import React from "react";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Stack, router } from "expo-router";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06142E" />

        {/* Logo */}
        <Image
          source={require("../assets/images/object-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Object Detection App</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Detect real-world objects instantly using AI-powered camera vision.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/welcome")}   // ✅ CHANGED HERE
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06142E",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  logo: {
    width: 260,
    height: 260,
    marginBottom: 30,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#B8C1CC",
    textAlign: "center",
    marginTop: 15,
    lineHeight: 24,
    paddingHorizontal: 10,
  },

  button: {
    marginTop: 40,
    backgroundColor: "#FF8C42",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 15,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});