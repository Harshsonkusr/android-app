import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Language translations
const translations = {
  en: {
    loading: 'Loading weather data...',
    pleaseWait: 'Please wait',
    locationDenied: 'Location permission denied. Please enable location access.',
    error: 'Error',
    retry: '🔄 Retry',
    farmerAdvice: '🌾 Farmer Advisory',
    irrigation: 'Irrigation',
    needed: 'Needed',
    notNeeded: 'Not Needed',
    heat: 'Heat',
    diseaseRisk: 'Disease Risk',
    spray: 'Spray',
    safe: 'Safe',
    unsafe: 'Unsafe',
    forecast7Day: '📅 7-Day Forecast',
    today: 'Today',
    hourlyForecast: '⏰ Hourly Forecast',
    additionalInfo: 'ℹ️ Additional Info',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    windGust: 'Wind Gust',
    maxWind: 'Max Wind',
    lastUpdate: 'Last Updated',
    pullToRefresh: 'Pull down to refresh',
    feelsLike: 'Feels like',
    humidity: 'Humidity',
    wind: 'Wind',
    clouds: 'Clouds',
    high: 'HIGH',
    moderate: 'MODERATE',
    low: 'LOW',
    directions: ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'],
  },
  hi: {
    loading: 'मौसम की जानकारी लोड हो रही है...',
    pleaseWait: 'कृपया प्रतीक्षा करें',
    locationDenied: 'स्थान की अनुमति अस्वीकृत। कृपया स्थान एक्सेस सक्षम करें।',
    error: 'त्रुटि',
    retry: '🔄 पुनः प्रयास करें',
    farmerAdvice: '🌾 किसान सलाह',
    irrigation: 'सिंचाई',
    needed: 'आवश्यक',
    notNeeded: 'नहीं चाहिए',
    heat: 'गर्मी',
    diseaseRisk: 'रोग जोखिम',
    spray: 'छिड़काव',
    safe: 'सुरक्षित',
    unsafe: 'असुरक्षित',
    forecast7Day: '📅 7 दिन का पूर्वानुमान',
    today: 'आज',
    hourlyForecast: '⏰ आज का घंटेवार पूर्वानुमान',
    additionalInfo: 'ℹ️ अतिरिक्त जानकारी',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    windGust: 'हवा का झोंका',
    maxWind: 'अधिकतम हवा',
    lastUpdate: 'अंतिम अपडेट',
    pullToRefresh: 'नीचे खींचें ताज़ा करने के लिए',
    feelsLike: 'महसूस',
    humidity: 'नमी',
    wind: 'हवा',
    clouds: 'बादल',
    high: 'उच्च',
    moderate: 'मध्यम',
    low: 'कम',
    directions: ['उत्तर', 'उत्तर-पूर्व', 'पूर्व', 'दक्षिण-पूर्व', 'दक्षिण', 'दक्षिण-पश्चिम', 'पश्चिम', 'उत्तर-पश्चिम'],
  },
};

const WeatherScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [farmerInsights, setFarmerInsights] = useState(null);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('hi'); // Default Hindi

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sunRotate = useRef(new Animated.Value(0)).current;
  const cloudMove = useRef(new Animated.Value(0)).current;
  const windAnim = useRef(new Animated.Value(0)).current;
  const rainDrop = useRef(new Animated.Value(0)).current;

  const t = translations[language];

  useEffect(() => {
    loadWeatherData();
    startAnimations();
  }, []);

  useEffect(() => {
    if (weatherData) {
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
    }
  }, [weatherData]);

  const startAnimations = () => {
    // Sun rotation animation
    Animated.loop(
      Animated.timing(sunRotate, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Cloud movement animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(cloudMove, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(cloudMove, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Wind animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(windAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(windAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rain drop animation
    Animated.loop(
      Animated.timing(rainDrop, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        throw new Error(t.locationDenied);
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      const { latitude, longitude } = location.coords;

      const address = await reverseGeocode(latitude, longitude);
      setLocationData(address);

      const weather = await fetchWeatherData(latitude, longitude);
      setWeatherData(weather);

      const insights = generateFarmerInsights(weather);
      setFarmerInsights(insights);

    } catch (err) {
      console.error('Weather Error:', err);
      setError(err.message || 'Failed to load weather data');
      Alert.alert(t.error, err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FarmerWeatherApp/1.0',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch address');

      const data = await response.json();
      const addr = data.address || {};

      return {
        latitude: lat,
        longitude: lon,
        village: addr.village || addr.hamlet || null,
        city: addr.city || addr.town || addr.municipality || addr.county || 'Unknown',
        district: addr.county || addr.state_district || 'Unknown',
        state: addr.state || 'Unknown',
        country: addr.country || 'Unknown',
        displayName: addr.village || addr.hamlet || addr.city || addr.town || 'Your Location',
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return {
        latitude: lat,
        longitude: lon,
        displayName: 'Your Location',
        city: 'Unknown',
        district: 'Unknown',
        state: 'Unknown',
        country: 'Unknown',
      };
    }
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,rain,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&timezone=auto`;

      const response = await fetch(url);

      if (!response.ok) throw new Error('Failed to fetch weather data');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Weather fetch error:', error);
      throw error;
    }
  };

  const generateFarmerInsights = (weather) => {
    if (!weather || !weather.current || !weather.daily) return null;

    const current = weather.current;
    const daily = weather.daily;

    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const rain = current.rain || 0;
    const todayRainProb = daily.precipitation_probability_max[0];

    const irrigationNeeded = rain < 2 && todayRainProb < 30 && humidity < 60;
    const heatStress = temp > 35 ? 'HIGH' : temp > 30 ? 'MODERATE' : 'LOW';
    const diseaseRisk = humidity > 80 && temp > 25 && temp < 35 ? 'HIGH' : humidity > 70 ? 'MODERATE' : 'LOW';
    const spraySafe = windSpeed < 10 && rain < 1;

    return {
      irrigationNeeded,
      heatStress,
      diseaseRisk,
      spraySafe,
      summary: generateSummary(weather, irrigationNeeded, heatStress, spraySafe),
    };
  };

  const generateSummary = (weather, irrigation, heatStress, spraySafe) => {
    const current = weather.current;
    const daily = weather.daily;
    const temp = current.temperature_2m;
    const rain = daily.precipitation_sum[0];

    if (language === 'hi') {
      let summary = `आज का तापमान ${Math.round(temp)}°C है। `;

      if (rain > 5) {
        summary += `आज बारिश की संभावना है (${Math.round(rain)}mm)। `;
      } else if (rain > 0) {
        summary += `हल्की बारिश हो सकती है। `;
      } else {
        summary += `आज बारिश नहीं होगी। `;
      }

      if (irrigation) {
        summary += `सिंचाई की आवश्यकता है। `;
      }

      if (heatStress === 'HIGH') {
        summary += `⚠️ गर्मी अधिक है, फसल और जानवरों का ध्यान रखें। `;
      }

      if (!spraySafe) {
        summary += `🌬️ आज कीटनाशक छिड़काव सुरक्षित नहीं है। `;
      } else {
        summary += `✅ आज छिड़काव के लिए उपयुक्त दिन है। `;
      }

      return summary;
    } else {
      let summary = `Today's temperature is ${Math.round(temp)}°C. `;

      if (rain > 5) {
        summary += `Rain expected today (${Math.round(rain)}mm). `;
      } else if (rain > 0) {
        summary += `Light rain possible. `;
      } else {
        summary += `No rain expected today. `;
      }

      if (irrigation) {
        summary += `Irrigation needed. `;
      }

      if (heatStress === 'HIGH') {
        summary += `⚠️ High heat, take care of crops and livestock. `;
      }

      if (!spraySafe) {
        summary += `🌬️ Not safe for pesticide spraying today. `;
      } else {
        summary += `✅ Good day for spraying. `;
      }

      return summary;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const getWeatherIcon = (isDay, rain) => {
    if (rain > 0) return '🌧️';
    if (isDay) return '☀️';
    return '🌙';
  };

  const getWindDirection = (degrees) => {
    const index = Math.round(degrees / 45) % 8;
    return t.directions[index];
  };

  const sunRotateInterpolate = sunRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cloudMoveInterpolate = cloudMove.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  const windOpacity = windAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const rainDropY = rainDrop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  if (loading && !weatherData) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={['#1E88E5', '#1976D2', '#1565C0']} style={styles.loadingGradient}>
          <Animated.View style={{ transform: [{ rotate: sunRotateInterpolate }] }}>
            <Text style={styles.loadingIcon}>☀️</Text>
          </Animated.View>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{t.loading}</Text>
          <Text style={styles.loadingSubtext}>{t.pleaseWait}</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error && !weatherData) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient colors={['#E53935', '#D32F2F', '#C62828']} style={styles.errorGradient}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadWeatherData}>
            <Text style={styles.retryButtonText}>{t.retry}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (!weatherData) return null;

  const current = weatherData.current;
  const daily = weatherData.daily;
  const hourly = weatherData.hourly;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Location and Language Toggle */}
        <LinearGradient colors={['#1E88E5', '#1976D2', '#1565C0']} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
              <Text style={styles.languageText}>{language === 'en' ? '🇬🇧 EN' : '🇮🇳 हिं'}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={24} color="#FFFFFF" />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationName}>{locationData?.displayName}</Text>
                <Text style={styles.locationDetails}>
                  {locationData?.district}, {locationData?.state}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Animated clouds in header */}
          <Animated.View style={[
            styles.animatedCloud,
            { transform: [{ translateX: cloudMoveInterpolate }] }
          ]}>
            <Text style={styles.cloudEmoji}>☁️</Text>
          </Animated.View>
        </LinearGradient>

        {/* Current Weather Card with Animations */}
        <Animated.View style={[styles.currentWeatherCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={['#42A5F5', '#2196F3', '#1E88E5']} style={styles.currentWeatherGradient}>
            <View style={styles.currentWeatherContent}>
              <View style={styles.tempSection}>
                {current.is_day ? (
                  <Animated.Text style={[
                    styles.weatherIcon,
                    { transform: [{ rotate: sunRotateInterpolate }] }
                  ]}>
                    ☀️
                  </Animated.Text>
                ) : (
                  <Text style={styles.weatherIcon}>🌙</Text>
                )}
                {current.rain > 0 && (
                  <Animated.View style={[
                    styles.rainAnimation,
                    { transform: [{ translateY: rainDropY }], opacity: rainDrop }
                  ]}>
                    <Text style={styles.rainDrop}>💧</Text>
                  </Animated.View>
                )}
                <Text style={styles.currentTemp}>{Math.round(current.temperature_2m)}°</Text>
                <Text style={styles.feelsLike}>{t.feelsLike} {Math.round(current.apparent_temperature)}°</Text>
              </View>

              <View style={styles.weatherDetails}>
                <View style={styles.weatherDetailRow}>
                  <Ionicons name="water" size={20} color="#FFFFFF" />
                  <Text style={styles.weatherDetailText}>{t.humidity}: {current.relative_humidity_2m}%</Text>
                </View>
                <View style={styles.weatherDetailRow}>
                  <Animated.View style={{ opacity: windOpacity }}>
                    <Ionicons name="speedometer" size={20} color="#FFFFFF" />
                  </Animated.View>
                  <Text style={styles.weatherDetailText}>{t.wind}: {Math.round(current.wind_speed_10m)} km/h</Text>
                </View>
                <View style={styles.weatherDetailRow}>
                  <Ionicons name="compass" size={20} color="#FFFFFF" />
                  <Text style={styles.weatherDetailText}>{getWindDirection(current.wind_direction_10m)}</Text>
                </View>
                <View style={styles.weatherDetailRow}>
                  <Animated.View style={{ transform: [{ translateX: cloudMoveInterpolate }] }}>
                    <Ionicons name="cloud" size={20} color="#FFFFFF" />
                  </Animated.View>
                  <Text style={styles.weatherDetailText}>{t.clouds}: {current.cloud_cover}%</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Farmer Insights */}
        {farmerInsights && (
          <Animated.View style={[styles.insightsCard, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>{t.farmerAdvice}</Text>
            <Text style={styles.summaryText}>{farmerInsights.summary}</Text>

            <View style={styles.insightsGrid}>
              <View style={[styles.insightItem, {
                backgroundColor: farmerInsights.irrigationNeeded ? '#FF6B6B' : '#4ECDC4'
              }]}>
                <Text style={styles.insightIcon}>💧</Text>
                <Text style={styles.insightLabel}>{t.irrigation}</Text>
                <Text style={styles.insightValue}>
                  {farmerInsights.irrigationNeeded ? t.needed : t.notNeeded}
                </Text>
              </View>

              <View style={[styles.insightItem, {
                backgroundColor: farmerInsights.heatStress === 'HIGH' ? '#FF6B6B' :
                  farmerInsights.heatStress === 'MODERATE' ? '#FFD93D' : '#4ECDC4'
              }]}>
                <Text style={styles.insightIcon}>🌡️</Text>
                <Text style={styles.insightLabel}>{t.heat}</Text>
                <Text style={styles.insightValue}>
                  {farmerInsights.heatStress === 'HIGH' ? t.high :
                    farmerInsights.heatStress === 'MODERATE' ? t.moderate : t.low}
                </Text>
              </View>

              <View style={[styles.insightItem, {
                backgroundColor: farmerInsights.diseaseRisk === 'HIGH' ? '#FF6B6B' :
                  farmerInsights.diseaseRisk === 'MODERATE' ? '#FFD93D' : '#4ECDC4'
              }]}>
                <Text style={styles.insightIcon}>🦠</Text>
                <Text style={styles.insightLabel}>{t.diseaseRisk}</Text>
                <Text style={styles.insightValue}>
                  {farmerInsights.diseaseRisk === 'HIGH' ? t.high :
                    farmerInsights.diseaseRisk === 'MODERATE' ? t.moderate : t.low}
                </Text>
              </View>

              <View style={[styles.insightItem, {
                backgroundColor: farmerInsights.spraySafe ? '#4ECDC4' : '#FF6B6B'
              }]}>
                <Text style={styles.insightIcon}>🌿</Text>
                <Text style={styles.insightLabel}>{t.spray}</Text>
                <Text style={styles.insightValue}>
                  {farmerInsights.spraySafe ? t.safe : t.unsafe}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* 7-Day Forecast */}
        <Animated.View style={[styles.forecastCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t.forecast7Day}</Text>

          {daily.time.slice(0, 7).map((date, index) => {
            const dayName = new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
            return (
              <View key={index} style={styles.dayForecast}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{index === 0 ? t.today : dayName}</Text>
                  <Text style={styles.dayDate}>
                    {new Date(date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                <View style={styles.weatherIconContainer}>
                  <Text style={styles.dayWeatherIcon}>
                    {daily.precipitation_sum[index] > 5 ? '🌧️' :
                      daily.precipitation_sum[index] > 0 ? '⛅' : '☀️'}
                  </Text>
                </View>

                <View style={styles.tempRange}>
                  <Text style={styles.maxTemp}>{Math.round(daily.temperature_2m_max[index])}°</Text>
                  <View style={styles.tempBar}>
                    <View style={[styles.tempBarFill, {
                      width: `${(daily.temperature_2m_max[index] - 15) / 30 * 100}%`
                    }]} />
                  </View>
                  <Text style={styles.minTemp}>{Math.round(daily.temperature_2m_min[index])}°</Text>
                </View>

                <View style={styles.rainInfo}>
                  <Ionicons name="water" size={16} color="#2196F3" />
                  <Text style={styles.rainText}>{Math.round(daily.precipitation_sum[index])}mm</Text>
                  <Text style={styles.rainProb}>{daily.precipitation_probability_max[index]}%</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Hourly Forecast */}
        <Animated.View style={[styles.hourlyCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t.hourlyForecast}</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyScroll}>
            {hourly.time.slice(0, 24).map((time, index) => {
              const hour = new Date(time).getHours();
              return (
                <View key={index} style={styles.hourlyItem}>
                  <Text style={styles.hourTime}>
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </Text>
                  <Text style={styles.hourIcon}>
                    {hourly.precipitation[index] > 0 ? '🌧️' : hour > 6 && hour < 18 ? '☀️' : '🌙'}
                  </Text>
                  <Text style={styles.hourTemp}>{Math.round(hourly.temperature_2m[index])}°</Text>
                  <View style={styles.hourRain}>
                    <Ionicons name="water" size={12} color="#2196F3" />
                    <Text style={styles.hourRainText}>{Math.round(hourly.precipitation[index])}mm</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Additional Info with Animations */}
        <Animated.View style={[styles.additionalInfoCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>{t.additionalInfo}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Animated.View style={{ transform: [{ rotate: sunRotateInterpolate }] }}>
                <Ionicons name="sunny" size={24} color="#FFA726" />
              </Animated.View>
              <Text style={styles.infoLabel}>{t.sunrise}</Text>
              <Text style={styles.infoValue}>
                {new Date(daily.sunrise[0]).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="moon" size={24} color="#7E57C2" />
              <Text style={styles.infoLabel}>{t.sunset}</Text>
              <Text style={styles.infoValue}>
                {new Date(daily.sunset[0]).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Animated.View style={{ opacity: windOpacity }}>
                <Ionicons name="flash" size={24} color="#FF6B6B" />
              </Animated.View>
              <Text style={styles.infoLabel}>{t.windGust}</Text>
              <Text style={styles.infoValue}>{Math.round(current.wind_gusts_10m)} km/h</Text>
            </View>

            <View style={styles.infoItem}>
              <Animated.View style={{ opacity: windOpacity }}>
                <Ionicons name="analytics" size={24} color="#4ECDC4" />
              </Animated.View>
              <Text style={styles.infoLabel}>{t.maxWind}</Text>
              <Text style={styles.infoValue}>{Math.round(daily.wind_speed_10m_max[0])} km/h</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.lastUpdate}: {new Date().toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-US')}</Text>
          <Text style={styles.footerSubtext}>{t.pullToRefresh}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'visible',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  languageToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 12,
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationDetails: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  animatedCloud: {
    position: 'absolute',
    top: 80,
    right: 20,
  },
  cloudEmoji: {
    fontSize: 40,
    opacity: 0.7,
  },
  currentWeatherCard: {
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  currentWeatherGradient: {
    padding: 24,
  },
  currentWeatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tempSection: {
    alignItems: 'center',
    position: 'relative',
  },
  weatherIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  rainAnimation: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  rainDrop: {
    fontSize: 24,
  },
  currentTemp: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  feelsLike: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  weatherDetails: {
    justifyContent: 'space-around',
  },
  weatherDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  weatherDetailText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
    marginBottom: 20,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  insightItem: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  forecastCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dayForecast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dayInfo: {
    width: 80,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  dayDate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  weatherIconContainer: {
    marginHorizontal: 8,
  },
  dayWeatherIcon: {
    fontSize: 28,
  },
  tempRange: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  maxTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    width: 40,
  },
  tempBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  tempBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  minTemp: {
    fontSize: 16,
    color: '#757575',
    width: 40,
    textAlign: 'right',
  },
  rainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  rainText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
  },
  rainProb: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  hourlyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  hourlyScroll: {
    marginTop: 12,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    minWidth: 80,
  },
  hourTime: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginBottom: 8,
  },
  hourIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  hourTemp: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  hourRain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourRainText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
  },
  additionalInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#212121',
    fontWeight: 'bold',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 4,
  },
});

export default WeatherScreen;