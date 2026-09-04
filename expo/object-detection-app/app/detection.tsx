import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

// 🌐 Flask backend URL — route changed to /detect
const FLASK_API_URL = "http://192.168.100.7:5000/detect";

// ✅ Matches Flask response exactly
interface DetectionResult {
  object: string;
  confidence: number;
  X: number;
  Y: number;
  Z: number;
}

interface BackendResponse {
  detections: DetectionResult[];
  image: string; // base64 annotated image with bounding boxes
}

export default function DetectionScreen() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Fixed: array of detections + annotated image
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const userName = (params.name as string) || "User";
  const userEmail = (params.userEmail as string) || "Not Available";
  const userPassword = (params.userPass as string) || "••••••••";
  const userInitial = userName.charAt(0).toUpperCase();

  // 🚀 Send image to Flask and receive annotated image + XYZ data
  const uploadImageToBackend = async (imageUri: string) => {
    setLoading(true);
    // ✅ Fixed: clear both state values on new request
    setDetections([]);
    setAnnotatedImage(null);

    const filename = imageUri.split("/").pop() || "upload.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    try {
      const response = await fetch(FLASK_API_URL, {
        method: "POST",
        body: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // ✅ Fixed: parse as BackendResponse { detections[], image }
      const result: BackendResponse = await response.json();
      console.log("Backend Response:", result);
      setDetections(result.detections);
      setAnnotatedImage(result.image);

    } catch (error: any) {
      console.error("Transmission Error:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the backend server. Make sure your phone and PC are on the same Wi-Fi (192.168.100.7)."
      );
    } finally {
      setLoading(false);
    }
  };

  // 📸 Open camera
  const handleOpenCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Allow camera access to take pictures.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0].uri) {
      console.log("Captured Image URI:", result.assets[0].uri);
      await uploadImageToBackend(result.assets[0].uri);
    }
  };

  // 🖼️ Pick from gallery
  const handlePickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Allow gallery access to pick images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets[0].uri) {
      // ✅ Fixed: was print(...) — now console.log
      console.log("Selected Gallery URI:", result.assets[0].uri);
      await uploadImageToBackend(result.assets[0].uri);
    }
  };

  const displayAccountDetails = () => {
    Alert.alert(
      "Account Info",
      `Name: ${userName}\nEmail: ${userEmail}\nPassword: ${userPassword}`,
      [{ text: "Close", style: "cancel" }]
    );
  };

  const handleMenuItemPress = (optionName: string) => {
    setMenuVisible(false);
    if (optionName === "Logout") {
      router.replace("/login");
    } else if (optionName === "Account Info") {
      displayAccountDetails();
    } else {
      Alert.alert(optionName, `Navigating to ${optionName}...`);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Detection",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#00A8FF" },
          headerTintColor: "#000",
          headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
          headerLeft: () => (
            <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => setMenuVisible(true)}>
              <Ionicons name="settings-sharp" size={24} color="#000" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.avatarCircle} onPress={displayAccountDetails}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── Settings Dropdown Modal ── */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuDropdown}>
              <Text style={styles.menuHeader}>Options</Text>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress("History")}>
                <Ionicons name="time-outline" size={20} color="#FFF" style={styles.menuIcon} />
                <Text style={styles.menuText}>History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress("Most Recent")}>
                <Ionicons name="list-outline" size={20} color="#FFF" style={styles.menuIcon} />
                <Text style={styles.menuText}>Most Recent</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress("Account Info")}>
                <Ionicons name="person-outline" size={20} color="#FFF" style={styles.menuIcon} />
                <Text style={styles.menuText}>Account Info</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuItemPress("Privacy")}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" style={styles.menuIcon} />
                <Text style={styles.menuText}>Privacy</Text>
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={() => handleMenuItemPress("Logout")}>
                <Ionicons name="log-out-outline" size={20} color="#FF4D4D" style={styles.menuIcon} />
                <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>

        {/* ── Top Banner ── */}
        <View style={styles.topBanner}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="scan-helper" size={70} color="white" />
          </View>
        </View>

        {/* ── Loading Indicator ── */}
        {loading && (
          <View style={styles.resultsWrapper}>
            <ActivityIndicator size="large" color="#00A8FF" />
            <Text style={styles.loadingText}>Processing image with YOLO v11...</Text>
          </View>
        )}

        {/* ── Annotated Image with Bounding Boxes ── */}
        {annotatedImage && (
          <View style={styles.resultsWrapper}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${annotatedImage}` }}
              style={styles.annotatedImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* ── Detection Data Cards — one per detected object ── */}
        {detections.length > 0 && (
          <View style={styles.resultsWrapper}>

            {/* Count badge */}
            <Text style={styles.detectionCountText}>
              {detections.length} object{detections.length > 1 ? "s" : ""} detected
            </Text>

            {detections.map((det, i) => (
              <View key={i} style={[styles.outputCard, { marginBottom: 12 }]}>

                {/* Object name */}
                <Text style={styles.outputHeading}>Object : {det.object}</Text>

                {/* Confidence */}
                <Text style={styles.outputDetails}>
                  Confidence : {det.confidence.toFixed(2)}
                </Text>

                <View style={styles.cardLineDivider} />

                {/* Section label */}
                <Text style={styles.coordinateLabel}>
                  Object Coordinates (Camera Frame)
                </Text>

                {/* XYZ — matches terminal output format exactly */}
                <Text style={styles.coordinateText}>X = {det.X.toFixed(3)} meters</Text>
                <Text style={styles.coordinateText}>Y = {det.Y.toFixed(3)} meters</Text>
                <Text style={styles.coordinateText}>Z = {det.Z.toFixed(3)} meters</Text>

              </View>
            ))}
          </View>
        )}

        {/* ── Action Cards ── */}
        <View style={styles.cardsContainer}>

          <TouchableOpacity style={styles.card} onPress={handleOpenCamera} activeOpacity={0.8}>
            <Ionicons name="camera" size={50} color="#FF8C42" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Open Camera</Text>
            <Text style={styles.cardSubtitle}>Live object detection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={handlePickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images" size={50} color="#4CD964" style={styles.cardIcon} />
            <Text style={styles.cardTitle}>Pick from Gallery</Text>
            <Text style={styles.cardSubtitle}>Image object detection</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06142E",
  },
  topBanner: {
    backgroundColor: "#2575FC",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    gap: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#102244",
    borderRadius: 20,
    paddingVertical: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3668",
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#B8C1CC",
    marginTop: 4,
  },

  // Results section
  resultsWrapper: {
    paddingHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  detectionCountText: {
    color: "#00A8FF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 10,
    alignSelf: "flex-start",
  },

  // ✅ New: annotated image with bounding boxes
  annotatedImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A3668",
    backgroundColor: "#102244",
  },

  // Detection data card
  outputCard: {
    width: "100%",
    backgroundColor: "#102244",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1A3668",
  },
  outputHeading: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 4,
  },
  outputDetails: {
    color: "#B8C1CC",
    fontSize: 16,
    marginBottom: 8,
  },
  cardLineDivider: {
    height: 1,
    backgroundColor: "#1A3668",
    marginVertical: 10,
  },
  coordinateLabel: {
    color: "#00A8FF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  coordinateText: {
    color: "#4CD964",
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 2,
    fontFamily: "monospace",
  },
  loadingText: {
    color: "#B8C1CC",
    marginTop: 10,
    fontSize: 15,
  },

  // Header avatar
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#06142E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Modal menu
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  menuDropdown: {
    position: "absolute",
    top: 60,
    left: 15,
    backgroundColor: "#102244",
    borderRadius: 16,
    width: 220,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1A3668",
    elevation: 10,
  },
  menuHeader: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#718096",
    paddingHorizontal: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  menuText: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#1A3668",
    marginVertical: 6,
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutText: {
    color: "#FF4D4D",
    fontWeight: "bold",
  },
});
