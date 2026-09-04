import { router, Stack } from "expo-router"; // 1. Added Stack import
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* 2. This hides the top navigation header for this screen */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Text style={styles.title}>Welcome 👋</Text>
      </View>

      {/* Bottom Loading */}
      <Text style={styles.loading}>Loading.....</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06142E",
    justifyContent: "space-between", 
    alignItems: "center",
    paddingVertical: 50,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 34,
    color: "white",
    fontWeight: "bold",
  },

  subtitle: {
    fontSize: 18,
    color: "#B8C1CC",
    marginTop: 10,
  },

  loading: {
    fontSize: 16,
    color: "#FF8C42",
    marginBottom: 10,
  },
});