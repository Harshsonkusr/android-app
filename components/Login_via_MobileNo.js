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
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    const valid = /^[0-9]{10}$/.test(phone.replace(/\s/g, ""));
    setIsValid(valid);
    setError(!valid && phone.length > 0 ? "Please enter a valid 10-digit number." : "");
  }, [phone]);

  // Format phone input
  const formatPhone = (input) => {
    let formatted = input.replace(/\D/g, "");
    if (formatted.length > 5) {
      formatted = formatted.replace(/(\d{5})(\d{1,5})/, "$1 $2");
    }
    setPhone(formatted);
  };

  // Trigger flash animation
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

  // Handle login with DB check
  const handleLogin = async () => {
    if (!isValid) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      // Call PHP backend to check phone number
      const response = await fetch("http://10.0.2.2/backend/check_farmer.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_no: phone.replace(/\s/g, "") }),
      });

      const data = await response.json();

      if (data.status === "success" && data.exists) {
        triggerFlash();
        Alert.alert("OTP sent on", `Phone number: ${phone}`);
        navigation.navigate("OTP");
      } else {
        Alert.alert("Access Denied", "This mobile number is not registered with our system.");
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Unable to connect to server.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <View style={styles.inputSection}>
            <Text style={styles.title}>Login via mobile number</Text>
            <Text style={styles.subtitle}>Please enter your mobile number</Text>

            {/* Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="XXXXX XXXXX"
                placeholderTextColor="#777"
                keyboardType="phone-pad"
                maxLength={11}
                value={phone}
                onChangeText={formatPhone}
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
        </View>

        {/* Flash effect */}
        <Animated.View
          pointerEvents="none"
          style={[styles.flashOverlay, { opacity: flashAnim }]}
        />
      </ScrollView>
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
    paddingVertical: 14,
    marginBottom: 10,
  },
  countryCode: {
    fontSize: 24,
    color: "#388E3C",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: "#333",
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
