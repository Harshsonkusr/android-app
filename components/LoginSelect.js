import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

export default function LoginSelectionScreen({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animations
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  const buttonScale1 = useRef(new Animated.Value(1)).current;
  const buttonScale2 = useRef(new Animated.Value(1)).current;
  const buttonScale3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateButtonPress = (scale) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const colors = isDark ? Colors.dark : {
    background: Colors.background,
    cardBg: Colors.cardBg,
    cardBorder: Colors.border,
    primary: Colors.primary,
    primaryText: Colors.textLight,
    secondaryBg: '#f8fafc',
    secondaryBorder: Colors.border,
    secondaryText: Colors.text,
    muted: Colors.textMuted,
    heading: Colors.text,
    accent: Colors.primaryDark,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background || '#ffffff' }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top area */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: Colors.primaryDark }]}>
            ClaimEasy
          </Text>
          <Text style={[styles.taglineHi, { color: Colors.textMuted }]}>
            किसानों और बीमाकर्ताओं को जोड़ना
          </Text>
          <Text style={[styles.taglineEn, { color: Colors.textMuted }]}>
            Bridging Farmers & Insurers
          </Text>
        </Animated.View>

        {/* Main card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBg || '#ffffff',
              borderColor: colors.cardBorder || '#e5e7eb',
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <Text style={[styles.welcomeTitle, { color: Colors.text }]}>
            Welcome! स्वागत है
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: Colors.textMuted }]}>
            Fast, secure crop insurance claim support for farmers across India.
          </Text>

          {/* Buttons */}
          <View style={styles.buttonColumn}>
            {/* Mobile login */}
            <Animated.View style={{ transform: [{ scale: buttonScale1 }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  animateButtonPress(buttonScale1);
                  navigation.navigate('LoginviaMobile');
                }}
              >
                <View style={styles.btnRow}>
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="phone-portrait-outline" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={[styles.btnMainText, { color: Colors.textLight }]}>
                      Login via Mobile
                    </Text>
                    <Text style={[styles.btnSubText, { color: '#e2e8f0' }]}>
                      मोबाइल से लॉगिन करें
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Aadhaar login */}
            <Animated.View style={{ transform: [{ scale: buttonScale2 }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.outlineButton,
                  {
                    backgroundColor: '#ffffff',
                    borderColor: Colors.border,
                  },
                ]}
                onPress={() => {
                  animateButtonPress(buttonScale2);
                  navigation.navigate('LoginviaAadhar');
                }}
              >
                <View style={styles.btnRow}>
                  <View style={[styles.btnIconCircle, { backgroundColor: '#f1f5f9' }]}>
                    <Ionicons name="card-outline" size={24} color={Colors.text} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={[styles.btnMainText, { color: Colors.text }]}>
                      Login via Aadhaar
                    </Text>
                    <Text style={[styles.btnSubText, { color: Colors.textMuted }]}>
                      आधार से लॉगिन करें
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider text */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { color: Colors.textMuted }]}>या / OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register */}
            <Animated.View style={{ transform: [{ scale: buttonScale3 }] }}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.textButton, { borderColor: Colors.primaryLight, backgroundColor: Colors.surface }]}
                onPress={() => {
                  animateButtonPress(buttonScale3);
                  navigation.navigate('RegisterUser');
                }}
              >
                <View style={styles.btnRow}>
                  <View style={[styles.btnIconCircle, { backgroundColor: '#ffffff' }]}>
                    <Ionicons name="person-add-outline" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={[styles.btnMainText, { color: Colors.primaryDark }]}>
                      Create new account
                    </Text>
                    <Text style={[styles.btnSubText, { color: Colors.textMuted }]}>
                      नया पंजीकरण करें
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Help */}
          <View style={styles.helpBlock}>
            <Text style={[styles.helpLabel, { color: Colors.textMuted }]}>
              Need help? सहायता चाहिए?
            </Text>
            <View style={styles.helpRow}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={[styles.helpNumber, { color: Colors.text }]}>
                1800-XXX-XXXX
              </Text>
            </View>
            <Text style={[styles.helpHint, { color: Colors.textMuted }]}>
              24/7 support • सदैव उपलब्ध
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  taglineHi: {
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },
  taglineEn: {
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
  },
  welcomeSubtitle: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonColumn: {
    gap: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  btnTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  btnMainText: {
    fontSize: 16,
    fontWeight: '700',
  },
  btnSubText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  outlineButton: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  textButton: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  helpBlock: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  helpLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpNumber: {
    fontSize: 18,
    fontWeight: '800',    letterSpacing: 1,
  },
  helpHint: {
    fontSize: 12,
    marginTop: 4,
  },
});
