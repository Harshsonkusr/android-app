import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [error, setError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const digitsOnly = aadhaarNumber.replace(/\s/g, "");
    const valid = /^[0-9]{12}$/.test(digitsOnly);
    setIsValid(valid);
    setError(!valid && aadhaarNumber.length > 0 ? "Please enter a valid 12-digit Aadhar number" : "");
  }, [aadhaarNumber]);

  const handleLogin = () => {
    if (isValid) {
      Alert.alert(
        "OTP Sent Successfully 📱", 
        `An OTP has been sent to the mobile number registered with Aadhar: ${aadhar}`
      );
      navigation.navigate("OTP");
    } else {
      Alert.alert("Invalid Input", "Please enter a valid 12-digit Aadhar number.");
    }
  };

  const formatAadhar = (input) => {
    let cleaned = input.replace(/\D/g, "").slice(0, 12);
    let formatted = cleaned.replace(/(\d{4})(\d{0,4})(\d{0,4})/, (_, p1, p2, p3) => {
      return [p1, p2, p3].filter(Boolean).join(" ");
    });
    setAadhaarNumber(formatted);
  };

  // Function to focus input when wrapper is pressed
  const handleWrapperPress = () => {
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
        style={styles.gradientBackground}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View 
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Animated.View 
                style={[
                  styles.aadharLogo,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                <LinearGradient
                  colors={[Colors.accent, '#f59e0b', '#fbbf24']}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoText}>Aadhaar</Text>
                </LinearGradient>
              </Animated.View>
            </View>
            <Text style={styles.welcomeText}>Secure Login</Text>
            <Text style={styles.welcomeSubtext}>Verify your identity with Aadhaar</Text>
          </Animated.View>

          {/* Login Card */}
          <Animated.View 
            style={[
              styles.loginCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color={Colors.primaryDark} />
                <Text style={styles.infoText}>
                  Enter your 12-digit Aadhaar number to receive OTP
                </Text>
              </View>

              <TextInput
                mode="outlined"
                label="Aadhaar Number"
                placeholder="0000 0000 0000"
                value={aadhaarNumber}
                onChangeText={formatAadhar}
                keyboardType="number-pad"
                maxLength={14}
                error={!!error}
                style={styles.inputPaper}
                left={<TextInput.Icon icon={props => <Ionicons name="card-outline" {...props} color={isFocused ? Colors.primary : Colors.textMuted} />} />}
                right={isValid ? <TextInput.Icon icon={props => <Ionicons name="checkmark-circle" {...props} color={Colors.success} />} /> : null}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />

              {error ? (
                <Animated.View 
                  style={styles.errorContainer}
                >
                  <Ionicons name="alert-circle" size={16} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
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
                  <Ionicons name="arrow-forward" size={20} color={isValid ? "#FFFFFF" : "#94a3b8"} style={{marginLeft: 8}} />
                </LinearGradient>
              </Pressable>

              <View style={styles.securityBadges}>
                <View style={styles.badge}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
                  <Text style={styles.badgeText}>Secured</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="globe-outline" size={16} color={Colors.primary} />
                  <Text style={styles.badgeText}>UIDAI Verified</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Info Section */}
          <Animated.View 
            style={[
              styles.infoSection,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.featureRow}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Quick Access</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>100% Secure</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>✨</Text>
                <Text style={styles.featureText}>Easy Login</Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            style={[
              styles.footer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.footerText}>
              Protected by Government of India
            </Text>
          </Animated.View>
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
    marginBottom: 32,
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
  aadharLogo: {
    width: 90,
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
    lineHeight: 18,
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
    minHeight: 56,
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
  inputWrapperValid: {
    borderColor: Colors.success,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: Colors.text,
    paddingVertical: 14,
    fontWeight: '700',
    letterSpacing: 3,
  },
  inputPaper: {
    backgroundColor: '#f8fafc',
    marginBottom: 8,
    fontSize: 20,
    fontWeight: '700',
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
  securityBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  infoSection: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  feature: {
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
});