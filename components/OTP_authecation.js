import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const OtpVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputs = useRef([]);
  const navigation = useNavigation();

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

  const handleVerify = () => {
    if (otp.includes('') || otp.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits of the OTP.');
      return;
    }
  
    Alert.alert("Success", "Logged in successfully");
  
    setTimeout(() => {
      navigation.navigate('Home');
    }, 2000); // 2 seconds delay before navigation
  };
  

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setTimer(30);
    inputs.current[0].focus();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.infoText}>
          You only have to enter an OTP code we sent via SMS to your registered phone number{'\n'}
        </Text>

        <Text style={styles.label}>OTP <Text style={{ color: 'red' }}>*</Text></Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => (inputs.current[index] = el)}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
            />
          ))}
        </View>

        <View style={styles.timerRow}>
          <Text style={styles.timerText}>
            {timer > 0 ? `00:${timer < 10 ? `0${timer}` : timer}` : ''}
          </Text>
          {timer === 0 && (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Show verify button only when all 6 digits are filled */}
        {otp.some(digit => digit !== '') && (
  <View style={styles.verifyWrapper}>
    <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
      <Text style={styles.verifyButtonText}>Verify</Text>
    </TouchableOpacity>
  </View>
)}

      </View>

      <Image
        source={require('../assets/logo.jpg')}
        style={styles.watermark}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  infoText: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'left',
    marginBottom: 30,
  },
  phoneNumber: {
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: '#2e7d32',
    marginBottom: 8,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderBottomWidth: 2,
    borderColor: '#ccc',
    textAlign: 'center',
    fontSize: 18,
    color: '#333',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: '#2e7d32',
  },
  resendText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '500',
  },
  verifyWrapper: {
    alignItems: 'flex-end',
    marginTop: 25,
  },
    verifyButton: {
      backgroundColor: '#2e7d32',
      paddingVertical: 12,
      paddingHorizontal:30,
      borderRadius: 8,
      alignItems: 'center',
    },
  
  verifyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  watermark: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 260,
    height: 260,
    opacity: 0.18,
    resizeMode: 'contain',
  },
});

export default OtpVerification;










