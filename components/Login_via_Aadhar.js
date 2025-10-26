
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [aadhar, setAadhar] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const digitsOnly = aadhar.replace(/\s/g, "");
    const valid = /^[0-9]{12}$/.test(digitsOnly);
    setIsValid(valid);
    setError(!valid && aadhar.length > 0 ? "Please enter a valid 12-digit Aadhar number." : "");
  }, [aadhar]);

  const handleLogin = () => {
    if (isValid) {
      triggerFlash();
      Alert.alert("OTP sent on mobile number registered with",`Aadhar Number: ${aadhar}`);
      navigation.navigate("OTP");
    } else {
      Alert.alert("Invalid Input", "Please enter a valid 12-digit Aadhar number.");
    }
  };

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatAadhar = (input) => {
    let cleaned = input.replace(/\D/g, "").slice(0, 12);
    let formatted = cleaned.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
      return [p1, p2, p3].filter(Boolean).join(" ");
    });
    setAadhar(formatted);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 40}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Image */}
          <View style={styles.topImageContainer}>
            <Image
              source={require("../assets/loginBack.jpg")}
              style={styles.topImage}
            />
          </View>

          {/* Login Section */}
          <View style={styles.bottomContainer}>
            <Text style={styles.title}>Login via Aadhaar</Text>
            <Text style={styles.subtitle}>Please enter your 12-digit Aadhaar number</Text>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="XXXX XXXX XXXX"
                placeholderTextColor="#777"
                keyboardType="number-pad"
                maxLength={14}
                value={aadhar}
                onChangeText={formatAadhar}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Continue Button */}
            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.buttonPressed,
                !isValid && styles.disabledButton,
              ]}
              disabled={!isValid}
            >
              <Text style={styles.loginText}>Continue</Text>
            </Pressable>
          </View>

          {/* Flash effect */}
          <Animated.View
            pointerEvents="none"
            style={[styles.flashOverlay, { opacity: flashAnim }]}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5EC", // light green
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topImageContainer: {
    width: "100%",
    height: 280,
    overflow: "hidden",
  },
  topImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#2E7D32", // deep green
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4CAF50", // vibrant green
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F8F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#81C784",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 24,            // Increased from 16
    color: "#333",
    textAlign: "center",     // Centered input text
  },
  errorText: {
    color: "#D32F2F",
    marginBottom: 8,
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: "#388E3C",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
});
