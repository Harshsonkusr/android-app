import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';

const { width } = Dimensions.get('window');

const CropInfo = ({ navigation }) => {
  const [selectedCrop, setSelectedCrop] = useState('wheat');
  const [locationData, setLocationData] = useState({ village: 'Shivpur', district: 'Nagpur' });
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
    ]).start();

    // Get location on mount
    getLocation();
    // Fetch crop data from server
    fetchCropData();
  }, []);

  // Function to fetch crop data from server
  const fetchCropData = async () => {
    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Fetch farmer details which should include crop information
      const farmerDetailsUrl = getApiUrl(API_ENDPOINTS.GET_FARMER_DETAILS);
      const farmerResponse = await fetch(farmerDetailsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (farmerResponse.ok) {
        const farmerDetails = await farmerResponse.json();
        // Set crop data based on farmer's actual crop
        if (farmerDetails.cropName) {
          setSelectedCrop(farmerDetails.cropName.toLowerCase());
        }
      }
    } catch (error) {
      console.error('Error fetching crop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address && address.length > 0) {
        setLocationData({
          village: address[0].name || address[0].subLocality || 'Shivpur',
          district: address[0].district || 'Nagpur',
        });
      }
    } catch (error) {
      console.log('Location error:', error);
    }
  };

  const crops = [
    { id: 'wheat', name: 'Wheat', icon: '🌾', nameHindi: 'गेहूं', color: '#F9A825' },
    { id: 'rice', name: 'Rice', icon: '🌾', nameHindi: 'चावल', color: '#8BC34A' },
    { id: 'cotton', name: 'Cotton', icon: '☁️', nameHindi: 'कपास', color: '#42A5F5' },
    { id: 'soybean', name: 'Soybean', icon: '🫘', nameHindi: 'सोयाबीन', color: '#66BB6A' },
  ];

  const cropData = {
    wheat: {
      season: 'Rabi (Winter)',
      duration: '120-150 days',
      soilType: 'Well-drained loamy soil',
      growthStage: 'Vegetative',
      growthProgress: 45,
      weatherImpact: 'Moderate',
      weatherStatus: 'Favorable conditions for growth',
      pestRisk: 'Low',
      diseaseRisk: 'Low',
      fertilizerAdvice: 'Apply Nitrogen (N) and Phosphorus (P) fertilizers',
      irrigationAdvice: 'Irrigate every 7-10 days, maintain soil moisture',
    },
    rice: {
      season: 'Kharif (Monsoon)',
      duration: '120-150 days',
      soilType: 'Clay loam with good water retention',
      growthStage: 'Tillering',
      growthProgress: 35,
      weatherImpact: 'High',
      weatherStatus: 'Adequate rainfall expected',
      pestRisk: 'Medium',
      diseaseRisk: 'Medium',
      fertilizerAdvice: 'Apply Urea and DAP at recommended intervals',
      irrigationAdvice: 'Maintain 5-7 cm standing water in field',
    },
    cotton: {
      season: 'Kharif (Monsoon)',
      duration: '150-180 days',
      soilType: 'Black cotton soil, well-drained',
      growthStage: 'Flowering',
      growthProgress: 60,
      weatherImpact: 'Critical',
      weatherStatus: 'Monitor for excessive rainfall',
      pestRisk: 'High',
      diseaseRisk: 'Medium',
      fertilizerAdvice: 'Apply balanced NPK fertilizers',
      irrigationAdvice: 'Irrigate at flowering and boll formation stage',
    },
    soybean: {
      season: 'Kharif (Monsoon)',
      duration: '90-120 days',
      soilType: 'Well-drained sandy loam',
      growthStage: 'Pod Development',
      growthProgress: 70,
      weatherImpact: 'Moderate',
      weatherStatus: 'Good weather conditions',
      pestRisk: 'Low',
      diseaseRisk: 'Low',
      fertilizerAdvice: 'Apply Rhizobium culture and Phosphorus',
      irrigationAdvice: 'Critical irrigation at flowering and pod filling',
    },
  };

  const currentCrop = cropData[selectedCrop];

  const getRiskColor = (risk) => {
    if (risk === 'Low') return '#4CAF50';
    if (risk === 'Medium') return '#FF9800';
    return '#F44336';
  };

  const getWeatherImpactColor = (impact) => {
    if (impact === 'Favorable' || impact === 'Moderate') return '#4CAF50';
    if (impact === 'High') return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Crop Information</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.locationText}>
                {locationData.village}, {locationData.district}
              </Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crop Selector Cards */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Select Your Crop</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cropSelector}
          >
            {crops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={[
                  styles.cropCard,
                  selectedCrop === crop.id && styles.cropCardSelected,
                ]}
                onPress={() => setSelectedCrop(crop.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedCrop === crop.id
                      ? ['#4CAF50', '#388E3C']
                      : ['#FFFFFF', '#F5F5F5']
                  }
                  style={styles.cropCardGradient}
                >
                  <Text
                    style={[
                      styles.cropIcon,
                      selectedCrop === crop.id && styles.cropIconSelected,
                    ]}
                  >
                    {crop.icon}
                  </Text>
                  <Text
                    style={[
                      styles.cropName,
                      selectedCrop === crop.id && styles.cropNameSelected,
                    ]}
                  >
                    {crop.name}
                  </Text>
                  <Text
                    style={[
                      styles.cropNameHindi,
                      selectedCrop === crop.id && styles.cropNameHindiSelected,
                    ]}
                  >
                    {crop.nameHindi}
                  </Text>
                  {selectedCrop === crop.id && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Crop Overview Card */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoCardHeader}>
                <Ionicons name="leaf" size={24} color="#FFFFFF" />
                <Text style={styles.infoCardTitle}>Crop Overview</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Season</Text>
                  <Text style={styles.infoValue}>{currentCrop.season}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>{currentCrop.duration}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoItem, styles.infoItemFull]}>
                  <Text style={styles.infoLabel}>Soil Type</Text>
                  <Text style={styles.infoValue}>{currentCrop.soilType}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Current Growth Stage Card */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="trending-up" size={24} color="#4CAF50" />
                <Text style={[styles.infoCardTitle, styles.infoCardTitleDark]}>
                  Current Growth Stage
                </Text>
              </View>
              <Text style={styles.growthStageText}>{currentCrop.growthStage}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { width: `${currentCrop.growthProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {currentCrop.growthProgress}% Complete
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Weather Impact Card */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="cloud" size={24} color="#2196F3" />
                <Text style={[styles.infoCardTitle, styles.infoCardTitleDark]}>
                  Weather Impact on Crop
                </Text>
              </View>
              <View style={styles.weatherStatusContainer}>
                <View
                  style={[
                    styles.weatherBadge,
                    { backgroundColor: getWeatherImpactColor(currentCrop.weatherImpact) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.weatherBadgeText,
                      { color: getWeatherImpactColor(currentCrop.weatherImpact) },
                    ]}
                  >
                    {currentCrop.weatherImpact}
                  </Text>
                </View>
              </View>
              <Text style={styles.weatherStatusText}>{currentCrop.weatherStatus}</Text>
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Weather')}
              >
                <Text style={styles.linkButtonText}>View Detailed Weather →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Pest & Disease Alerts Card */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="warning" size={24} color="#FF9800" />
                <Text style={[styles.infoCardTitle, styles.infoCardTitleDark]}>
                  Pest & Disease Alerts
                </Text>
              </View>
              <View style={styles.alertContainer}>
                <View style={styles.alertRow}>
                  <View style={styles.alertItem}>
                    <Ionicons
                      name="bug"
                      size={20}
                      color={getRiskColor(currentCrop.pestRisk)}
                    />
                    <Text style={styles.alertLabel}>Pest Risk</Text>
                    <View
                      style={[
                        styles.alertBadge,
                        { backgroundColor: getRiskColor(currentCrop.pestRisk) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.alertBadgeText,
                          { color: getRiskColor(currentCrop.pestRisk) },
                        ]}
                      >
                        {currentCrop.pestRisk}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.alertItem}>
                    <Ionicons
                      name="medical"
                      size={20}
                      color={getRiskColor(currentCrop.diseaseRisk)}
                    />
                    <Text style={styles.alertLabel}>Disease Risk</Text>
                    <View
                      style={[
                        styles.alertBadge,
                        { backgroundColor: getRiskColor(currentCrop.diseaseRisk) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.alertBadgeText,
                          { color: getRiskColor(currentCrop.diseaseRisk) },
                        ]}
                      >
                        {currentCrop.diseaseRisk}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Fertilizer & Irrigation Advice Card */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="bulb" size={24} color="#FF9800" />
                <Text style={[styles.infoCardTitle, styles.infoCardTitleDark]}>
                  Fertilizer & Irrigation Advice
                </Text>
              </View>
              <View style={styles.adviceContainer}>
                <View style={styles.adviceItem}>
                  <View style={styles.adviceIconContainer}>
                    <Ionicons name="flask" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.adviceContent}>
                    <Text style={styles.adviceTitle}>Fertilizer</Text>
                    <Text style={styles.adviceText}>{currentCrop.fertilizerAdvice}</Text>
                  </View>
                </View>
                <View style={styles.adviceItem}>
                  <View style={styles.adviceIconContainer}>
                    <Ionicons name="water" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.adviceContent}>
                    <Text style={styles.adviceTitle}>Irrigation</Text>
                    <Text style={styles.adviceText}>{currentCrop.irrigationAdvice}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* AI Crop Advice Button */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.aiButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Chatbot')}
          >
            <LinearGradient
              colors={['#66BB6A', '#4CAF50', '#388E3C']}
              style={styles.aiButtonGradient}
            >
              <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
              <Text style={styles.aiButtonText}>AI Crop Advice</Text>
              <View style={styles.aiButtonGlow} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  cropSelector: {
    paddingVertical: 8,
  },
  cropCard: {
    width: 110,
    height: 130,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cropCardSelected: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cropCardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    position: 'relative',
  },
  cropIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  cropIconSelected: {
    transform: [{ scale: 1.1 }],
  },
  cropName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
  },
  cropNameSelected: {
    color: '#FFFFFF',
  },
  cropNameHindi: {
    fontSize: 11,
    fontWeight: '600',
    color: '#616161',
  },
  cropNameHindiSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  infoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  infoCardGradient: {
    padding: 20,
  },
  infoCardContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  infoCardTitleDark: {
    color: '#212121',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    marginRight: 12,
  },
  infoItemFull: {
    flex: 1,
    marginRight: 0,
  },
  infoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  growthStageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#616161',
    fontWeight: '600',
  },
  weatherStatusContainer: {
    marginBottom: 12,
  },
  weatherBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  weatherBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  weatherStatusText: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  alertContainer: {
    marginTop: 8,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  alertLabel: {
    fontSize: 12,
    color: '#616161',
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  adviceContainer: {
    marginTop: 8,
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  adviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adviceContent: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 13,
    color: '#616161',
    lineHeight: 18,
  },
  aiButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  aiButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  aiButtonGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default CropInfo;
