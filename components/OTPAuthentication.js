import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputs = useRef([]);
  const navigation = useNavigation();
  const route = useRoute(); // Initialize route

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-focus first input
    setTimeout(() => inputs.current[0]?.focus(), 500);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (text, index) => {
    if (text.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < otp.length - 1) {
        inputs.current[index + 1].focus();
      }

      // Auto-verify when all digits are entered
      if (text && index === otp.length - 1 && newOtp.every(digit => digit !== '')) {
        setTimeout(() => handleVerify(), 300);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputs.current[index - 1].focus();
      }
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const triggerSuccess = () => {
    Animated.spring(successAnim, {
      toValue: 1,
      tension: 20,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // Import API Config

  // Check if OTP is passed from login screen
  useEffect(() => {
    if (route.params?.otp) {
      console.log('📱 DEMO OTP from login:', route.params.otp);
      // Auto-fill the OTP input fields
      const otpArray = route.params.otp.split('');
      if (otpArray.length === 6) {
        setOtp(otpArray);
      }
    }
  }, [route.params?.otp]);

  const handleVerify = async () => {
    if (otp.includes('') || otp.length < 6) {
      triggerShake();
      Alert.alert('Invalid OTP', 'Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifying(true);

    try {
      const mobileNumber = route.params?.mobileNumber;

      if (!mobileNumber) {
        Alert.alert("Error", "Mobile number missing. Please login again.");
        return;
      }

      const otpValue = otp.join('');
      const API_URL = getApiUrl(API_ENDPOINTS.VERIFY_OTP);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp: otpValue })
      });

      const data = await response.json();

      if (response.ok) {
        triggerSuccess();

        // Save Token and User Data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));

        Alert.alert("Success! ✅", "You've been logged in successfully");
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { farmer: data.user } }],
          });
        }, 1000);
      } else {
        triggerShake();
        Alert.alert("Verification Failed", data.message || "Invalid OTP");
        setOtp(['', '', '', '', '', '']);
        inputs.current[0].focus();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      const mobileNumber = route.params?.mobileNumber;

      if (!mobileNumber) return;

      const API_URL = getApiUrl(API_ENDPOINTS.SEND_OTP);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });
      const data = await response.json();

      setOtp(['', '', '', '', '', '']);
      setTimer(30);
      inputs.current[0].focus();

      // Log OTP if available (development mode)
      if (data.otp) {
        console.log('📱 DEMO OTP:', data.otp);
        Alert.alert('OTP Resent 📱', `A new OTP has been sent to your registered mobile number.\nDemo OTP: ${data.otp}`);
      } else {
        Alert.alert('OTP Resent 📱', 'A new OTP has been sent to your registered mobile number');
      }
    } catch (error) {
      Alert.alert("Error", "Failed to resend OTP");
    }
  };

  const isFilled = otp.every(digit => digit !== '');
  const filledCount = otp.filter(digit => digit !== '').length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
        style={styles.gradientBackground}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
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
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Verify OTP</Text>
          <Text style={styles.headerSubtitle}>
            We've sent a 6-digit code to your registered mobile number
          </Text>
        </Animated.View>

        {/* OTP Card */}
        <Animated.View
          style={[
            styles.otpCard,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          <View style={styles.cardContent}>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { width: `${(filledCount / 6) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{filledCount}/6 digits entered</Text>
            </View>

            <Text style={styles.otpLabel}>Enter Verification Code</Text>

            {/* OTP Input Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <View key={index} style={styles.inputWrapper}>
                  <TextInput
                    ref={el => (inputs.current[index] = el)}
                    style={[
                      styles.otpInput,
                      digit !== '' && styles.otpInputFilled,
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>

            {/* Timer and Resend */}
            <View style={styles.timerContainer}>
              {timer > 0 ? (
                <View style={styles.timerBox}>
                  <Ionicons name="time-outline" size={18} color={Colors.warning} />
                  <Text style={styles.timerText}>
                    {`00:${timer < 10 ? `0${timer}` : timer}`}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResend}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[Colors.secondary, Colors.secondary]}
                    style={styles.resendGradient}
                  >
                    <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.resendText}>Resend OTP</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            {isFilled && (
              <Animated.View
                style={[
                  styles.verifyButtonContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      scale: successAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.95]
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.verifyButton}
                  onPress={handleVerify}
                  disabled={isVerifying}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isVerifying ? [Colors.primaryLight, Colors.primary] : [Colors.primary, Colors.primaryDark]}
                    style={styles.verifyGradient}
                  >
                    <Text style={styles.verifyButtonText}>
                      {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}

            {/* Security Badge */}
            <View style={styles.securityBadge}>
              <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.securityText}>
                Your session is secure and encrypted
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Help Section */}
        <Animated.View
          style={[
            styles.helpSection,
            { opacity: fadeAnim }
          ]}
        >
          <Text style={styles.helpText}>Didn't receive the code?</Text>
          <TouchableOpacity>
            <Text style={styles.helpLink}>Contact Support</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
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
  iconContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '500',
  },
  otpCard: {
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
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  inputWrapper: {
    position: 'relative',
  },
  otpInput: {
    width: (width - 120) / 6,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    backgroundColor: '#f8fafc',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    gap: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  resendButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  resendGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  resendText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verifyButtonContainer: {
    marginTop: 8,
  },
  verifyButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  verifyButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityBadge: {
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
  helpSection: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 24,
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  helpLink: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default OtpVerification;