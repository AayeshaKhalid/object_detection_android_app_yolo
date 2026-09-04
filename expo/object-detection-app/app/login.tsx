import { Ionicons } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// =====================================================
// In-memory user database (persists during app session)
// =====================================================
const registeredUsersDatabase: {
  fullName: string;
  email: string;
  password: string;
}[] = [];

// =====================================================
// Validation Helpers
// =====================================================
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [fullName, setFullName]               = useState("");
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword]                   = useState(false);
  const [showConfirmPassword, setShowConfirmPassword]     = useState(false);
  const [savePassword, setSavePassword]                   = useState(false);

  // Field-level error messages
  const [nameError, setNameError]                         = useState("");
  const [emailError, setEmailError]                       = useState("");
  const [passwordError, setPasswordError]                 = useState("");
  const [confirmPasswordError, setConfirmPasswordError]   = useState("");

  // =====================================================
  // Clear all errors
  // =====================================================
  const clearErrors = () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
  };

  // =====================================================
  // Tab toggle — resets everything
  // =====================================================
  const toggleTab = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSavePassword(false);
    clearErrors();
  };

  // =====================================================
  // LOGIN Logic
  // =====================================================
  const handleLogin = () => {
    clearErrors();
    let hasError = false;

    const formattedEmail = email.trim().toLowerCase();
    const cleanPassword  = password.trim();

    if (!formattedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!isValidEmail(formattedEmail)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }

    if (!cleanPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) return;

    const existingUser = registeredUsersDatabase.find(
      (user) => user.email === formattedEmail
    );

    if (!existingUser) {
      setEmailError("No account found with this email. Please register first.");
      return;
    }

    if (existingUser.password !== cleanPassword) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    // ✅ Success — navigate to detection screen
    router.replace({
      pathname: "/detection",
      params: {
        name:      existingUser.fullName,
        userEmail: existingUser.email,
        userPass:  existingUser.password,
      },
    });
  };

  // =====================================================
  // REGISTER Logic
  // =====================================================
  const handleRegister = () => {
    clearErrors();
    let hasError = false;

    const cleanName      = fullName.trim();
    const formattedEmail = email.trim().toLowerCase();
    const cleanPassword  = password.trim();
    const cleanConfirm   = confirmPassword.trim();

    if (!cleanName) {
      setNameError("Full name is required.");
      hasError = true;
    } else if (!isValidName(cleanName)) {
      setNameError("Name must be at least 2 characters.");
      hasError = true;
    }

    if (!formattedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    } else if (!isValidEmail(formattedEmail)) {
      setEmailError("Enter a valid email address (e.g. user@example.com).");
      hasError = true;
    }

    if (!cleanPassword) {
      setPasswordError("Password is required.");
      hasError = true;
    } else if (!isValidPassword(cleanPassword)) {
      setPasswordError("Password must be at least 8 characters with letters and numbers.");
      hasError = true;
    }

    if (!cleanConfirm) {
      setConfirmPasswordError("Please confirm your password.");
      hasError = true;
    } else if (cleanPassword !== cleanConfirm) {
      setConfirmPasswordError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    const userExists = registeredUsersDatabase.some(
      (user) => user.email === formattedEmail
    );

    if (userExists) {
      setEmailError("An account with this email already exists. Please login.");
      return;
    }

    // ✅ Register new user
    registeredUsersDatabase.push({
      fullName: cleanName,
      email:    formattedEmail,
      password: cleanPassword,
    });

    Alert.alert(
      "Account Created!",
      `Welcome, ${cleanName}! Your account has been created successfully. Please log in.`,
      [{ text: "Login Now", onPress: () => toggleTab(true) }]
    );
  };

  const handleAuthAction = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#06142E" />

        {/* Top logo section */}
        <View style={styles.topSection}>
          <Image
            source={require("../assets/images/object-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>

          {/* ── Tabs ── */}
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => toggleTab(true)}>
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleTab(false)}>
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heading}>
            {isLogin ? "Login to Your Account" : "Create New Account"}
          </Text>
          <Text style={styles.subHeading}>
            {isLogin
              ? "Welcome back! Please sign in to continue."
              : "Fill in the details below to get started."}
          </Text>

          {/* ── Full Name (register only) ── */}
          {!isLogin && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                placeholder="e.g. Ali Khan"
                placeholderTextColor="#AAA"
                value={fullName}
                onChangeText={(t) => { setFullName(t); setNameError(""); }}
                style={[styles.input, nameError ? styles.inputError : null]}
              />
              {nameError ? <Text style={styles.errorText}>⚠ {nameError}</Text> : null}
            </>
          )}

          {/* ── Email ── */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            placeholder="e.g. user@example.com"
            placeholderTextColor="#AAA"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(""); }}
            style={[styles.input, emailError ? styles.inputError : null]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <Text style={styles.errorText}>⚠ {emailError}</Text> : null}

          {/* ── Password ── */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordRow, passwordError ? styles.inputError : null]}>
            <TextInput
              placeholder={isLogin ? "Enter your password" : "Min 8 chars, letters & numbers"}
              placeholderTextColor="#AAA"
              value={password}
              onChangeText={(t) => { setPassword(t); setPasswordError(""); }}
              secureTextEntry={!showPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#777"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>⚠ {passwordError}</Text> : null}

          {/* ── Confirm Password (register only) ── */}
          {!isLogin && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.passwordRow, confirmPasswordError ? styles.inputError : null]}>
                <TextInput
                  placeholder="Re-enter your password"
                  placeholderTextColor="#AAA"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setConfirmPasswordError(""); }}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError
                ? <Text style={styles.errorText}>⚠ {confirmPasswordError}</Text>
                : null}

              {/* Save password checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setSavePassword(!savePassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={savePassword ? "checkbox" : "square-outline"}
                  size={22}
                  color={savePassword ? "#FF8C42" : "#777"}
                />
                <Text style={styles.checkboxLabel}>Save password for later login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Submit Button ── */}
          <TouchableOpacity style={styles.button} onPress={handleAuthAction}>
            <Text style={styles.buttonText}>
              {isLogin ? "Log In" : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* ── Toggle link ── */}
          <TouchableOpacity onPress={() => toggleTab(!isLogin)}>
            <Text style={styles.bottomText}>
              {isLogin
                ? "Don't have an account? Register Now"
                : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#06142E",
  },
  topSection: {
    height: 230,
    backgroundColor: "#0A1F44",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  logo: {
    width: 150,
    height: 150,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tabText: {
    fontSize: 20,
    color: "#777",
    fontWeight: "600",
    paddingBottom: 5,
  },
  activeTabText: {
    color: "#FF8C42",
    borderBottomWidth: 3,
    borderBottomColor: "#FF8C42",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#06142E",
    textAlign: "center",
    marginBottom: 4,
  },
  subHeading: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 5,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
    fontSize: 15,
    color: "#000",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputError: {
    borderColor: "#E53E3E",
    borderWidth: 1.5,
  },
  errorText: {
    color: "#E53E3E",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#000",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
    paddingLeft: 4,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#4A5568",
    marginLeft: 8,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#FF8C42",
    padding: 17,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  bottomText: {
    marginTop: 18,
    textAlign: "center",
    color: "#06142E",
    fontSize: 14,
    fontWeight: "500",
  },
});
