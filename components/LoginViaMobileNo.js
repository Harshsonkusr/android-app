import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import Colors from '../constants/Colors';

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const navigation = useNavigation();
  const phoneInputRef = useRef(null);

  const formatPhone = (input) => {
    // Simplified formatting - just remove non-digits
    let formatted = input.replace(/\D/g, "");
    setPhone(formatted);

    // Validate phone number
    const valid = /^[0-9]{10}$/.test(formatted);
    setIsValid(valid);
    setError(!valid && formatted.length > 0 ? "Please enter a valid 10-digit number" : "");
  };

  const handleLogin = async () => {
    if (!isValid) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const API_URL = getApiUrl(API_ENDPOINTS.SEND_OTP);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber: cleanPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('mobileNumber', cleanPhone);

        // Log OTP if available (development mode)
        if (data.otp) {
          console.log('📱 DEMO OTP:', data.otp);
          Alert.alert("Success", `OTP sent to your mobile number.\nDemo OTP: ${data.otp}`);
        } else {
          Alert.alert("Success", "OTP sent to your mobile number.");
        }

        navigation.navigate("OTP", {
          mobileNumber: cleanPhone,
          otp: data.otp // Pass OTP to OTP screen if available
        });
      } else {
        if (response.status === 404) {
          Alert.alert(
            "Account Not Found",
            "This number is not registered. Please register first."
          );
        } else {
          Alert.alert("Login Failed", data.message || "Something went wrong.");
        }
      }
    } catch (err) {
      console.log(err);
      Alert.alert("Connection Error", "Unable to connect to server. Please check your internet connection.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="phone-portrait" size={40} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.welcomeSubtext}>Sign in with your mobile number</Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <View style={styles.cardContent}>
              <TextInput
                mode="outlined"
                label="Mobile Number"
                placeholder="0000000000"
                value={phone}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                maxLength={10}
                error={!!error}
                style={styles.inputPaper}
                left={<TextInput.Affix text="+91" textStyle={styles.countryCode} />}
                right={isValid ? <TextInput.Icon icon={props => <Ionicons name="checkmark-circle" {...props} color={Colors.success} />} /> : null}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                  !isValid && styles.disabledButton,
                ]}
                disabled={!isValid}
              >
                <LinearGradient
                  colors={isValid ? [Colors.primaryLight, Colors.primary, Colors.primaryDark] : ['#e2e8f0', '#cbd5e1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={[styles.loginText, !isValid && { color: '#94a3b8' }]}>Send OTP</Text>
                  <Ionicons name="arrow-forward" size={20} color={isValid ? "#FFFFFF" : "#94a3b8"} style={{ marginLeft: 8 }} />
                </LinearGradient>
              </Pressable>

              <View style={styles.securityInfo}>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.securityText}>
                  Your data is protected and secure
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Contact Support
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 0,
    padding: 8,
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  loginCard: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    padding: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputWrapperFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  countryCode: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: Colors.text,
    paddingVertical: 14,
    fontWeight: '600',
    height: 54,
  },
  inputPaper: {
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
    gap: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 18,
    marginTop: 24,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loginText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
