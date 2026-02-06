import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import { getImageUrl } from '../utils/image-utils';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('home');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Header animations
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });
  const [userData, setUserData] = useState(null);
  const [farmerData, setFarmerData] = useState(null);
  const [statsData, setStatsData] = useState([
    { label: 'Active Policies', value: '0', icon: 'shield-checkmark-outline', color: '#16a34a' },
    { label: 'Pending Claims', value: '0', icon: 'time-outline', color: '#eab308' },
    { label: 'Total Coverage', value: '₹0', icon: 'cash-outline', color: '#2563eb' },
    { label: 'Approved Claims', value: '0', icon: 'checkmark-circle-outline', color: '#059669' },
  ]);
  const [weatherData, setWeatherData] = useState({
    temperature: 32,
    condition: 'Partly Cloudy',
    humidity: 65,
    rainfall: 12,
    forecast: 'Scattered thunderstorms expected. Good for rice.'
  });
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
    
    // Fetch actual data from server
    fetchDashboardData();
    // Fetch unread notifications count
    fetchUnreadNotifications();
  }, []);
  
  // Function to fetch actual data from the server
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Fetch user profile data
      const userProfileUrl = getApiUrl(API_ENDPOINTS.GET_USER_PROFILE);
      const userResponse = await fetch(userProfileUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (userResponse.ok) {
        const userProfile = await userResponse.json();
        // Backend returns the user object directly
        setUserData(userProfile);
      }
      
      // Fetch farmer details
      const farmerDetailsUrl = getApiUrl(API_ENDPOINTS.GET_FARMER_DETAILS);
      const farmerResponse = await fetch(farmerDetailsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (farmerResponse.ok) {
        const farmerDetails = await farmerResponse.json();
        setFarmerData(farmerDetails);
      }
      
      // Fetch quick stats from the unified dashboard endpoint
      try {
        const statsUrl = getApiUrl(API_ENDPOINTS.GET_FARMER_QUICK_STATS);
        const statsResponse = await fetch(statsUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          // Map backend stats to UI stats
          const mappedStats = stats.map(stat => ({
            label: stat.title,
            value: stat.value,
            icon: getIconForStat(stat.iconName),
            color: getColorForStat(stat.title)
          }));
          setStatsData(mappedStats);
        }
      } catch (statsErr) {
        console.error('Error fetching quick stats:', statsErr);
        // Fallback or keep defaults
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userData');
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginSelect' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getIconForStat = (iconName) => {
    switch (iconName) {
      case 'Shield': return 'shield-checkmark-outline';
      case 'Clock': return 'time-outline';
      case 'PlusCircle': return 'add-circle-outline';
      case 'CheckCircle2': return 'checkmark-circle-outline';
      case 'FileText': return 'document-text-outline';
      default: return 'stats-chart-outline';
    }
  };

  const getColorForStat = (title) => {
    if (title.includes('Policy')) return '#16a34a';
    if (title.includes('Pending')) return '#eab308';
    if (title.includes('Approved')) return '#059669';
    if (title.includes('Total') || title.includes('Coverage')) return '#2563eb';
    return '#16a34a';
  };

  // Function to fetch unread notifications count
  const fetchUnreadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const notificationsUrl = getApiUrl(API_ENDPOINTS.GET_NOTIFICATIONS);
      const notificationsResponse = await fetch(notificationsUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        const notificationsArray = Array.isArray(notificationsData) 
          ? notificationsData 
          : notificationsData.notifications || [];
        const unreadCount = notificationsArray.filter(notification => !notification.read).length;
        setUnreadNotifications(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const quickActions = [
    { id: 1, icon: '🌾', label: 'Crop Info', route: 'CropInfo', color: ['#66BB6A', '#4CAF50'] },
    { id: 2, icon: '🛡️', label: 'New Policy', route: 'ApplyPolicy', color: ['#42A5F5', '#2196F3'] },
    { id: 3, icon: '⚠️', label: 'File Claim', route: 'FloodClaimScreen', color: ['#FF9800', '#F57C00'] },
    { id: 4, icon: '📚', label: 'Resources', route: 'Resources', color: ['#AB47BC', '#9C27B0'] },
  ];

  const handleQuickAction = (route) => {
    // Check if the route exists in navigation
    if (navigation.getState().routeNames.includes(route)) {
      navigation.navigate(route);
    } else {
      // If route doesn't exist, show alert or handle gracefully
      console.log(`Navigating to ${route} - Route not found in navigator`);
      Alert.alert(
        'Feature Coming Soon',
        `${route} is currently under development and will be available in a future update.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Layer 1: Fixed Top Bar (Always on top) */}
      <View style={styles.topBarFixed}>
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          style={styles.topBarGradient}
        >
          <View style={styles.topBar}>
            <View style={styles.brandContainer}>
              <Text style={styles.brandTitle}>ClaimEasy</Text>
              <View style={styles.brandDot} />
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLogout}
                accessibilityLabel="Logout"
                accessibilityRole="button"
                accessible={true}
              >
                <Ionicons name="log-out-outline" size={26} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Alert.alert('Help', 'Support feature coming soon!')}
              >
                <Ionicons name="help-circle-outline" size={26} color="#FFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
                accessibilityLabel={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
                accessibilityRole="button"
                accessibilityState={{ busy: loading }}
                accessible={true}
              >
                <Ionicons name="notifications-outline" size={26} color="#FFF" />
                {unreadNotifications > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Layer 2: Fixed Background Welcome Section (Goes behind on scroll) */}
      <Animated.View style={[
        styles.welcomeSectionFixed,
        {
          opacity: headerOpacity,
          transform: [
            { translateY: scrollY.interpolate({
                inputRange: [0, 200],
                outputRange: [0, -50],
                extrapolate: 'clamp',
              }) 
            },
            { scale: scrollY.interpolate({
                inputRange: [0, 200],
                outputRange: [1, 0.9],
                extrapolate: 'clamp',
              })
            }
          ]
        }
      ]}>
        <LinearGradient
          colors={['#2E7D32', '#388E3C']}
          style={styles.welcomeGradient}
        >
          {loading ? (
            <View style={styles.welcomeContent}>
              <View style={styles.userInfo}>
                <View style={styles.skeletonGreeting} />
                <View style={styles.skeletonName} />
              </View>
              <View style={styles.skeletonAvatar} />
            </View>
          ) : (
            <View style={styles.welcomeContent}>
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>Namaste,</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {userData?.name || 'Farmer'}
                  </Text>
                  <Text style={styles.wave}>👋</Text>
                </View>
                <View style={styles.farmerIdBadge}>
                  <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.9)" style={{ marginRight: 6 }} />
                  <Text style={styles.farmerIdText}>ID: {userData?.farmerId || userData?.id || 'FRM-0000-0000'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.profilePicContainer}
                onPress={() => navigation.navigate('FarmerProfile')}
                accessibilityLabel="Profile"
                accessibilityRole="button"
                accessible={true}
              >
                {(userData?.profilePhoto || farmerData?.profilePhoto) && (
                  <Image
                    source={{
                      uri: getImageUrl(userData?.profilePhoto || farmerData?.profilePhoto)
                    }}
                    style={styles.profilePic}
                    accessibilityLabel="Profile picture"
                    accessible={true}
                  />
                )}
                <View style={styles.onlineIndicator} />
              </TouchableOpacity>
            </View>
          )}

          {/* Integrated Stats Matrix - Grid Layout */}
          <View style={styles.statsGrid}>
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <View key={index} style={styles.statCardCompact}>
                  <View style={styles.skeletonStatIconSmall} />
                  <View style={styles.skeletonStatValueSmall} />
                </View>
              ))
            ) : (
              statsData.slice(0, 4).map((stat, index) => (
                <View key={index} style={styles.statCardCompact}>
                  <View style={styles.statIconWrapper}>
                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValueCompact}>{stat.value}</Text>
                    <Text style={styles.statLabelCompact} numberOfLines={1}>{stat.label}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Layer 3: Scrollable Content (Slides over the background) */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Spacer for the fixed header and welcome section */}
        <View style={styles.scrollSpacer} />

        {/* Weather & Insights */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weather & Insights</Text>
            <Ionicons name="cloud-outline" size={20} color="#666" />
          </View>
          <View style={styles.weatherCard}>
            <View style={styles.weatherMain}>
              <View>
                <Text style={styles.weatherTemp}>{weatherData.temperature}°C</Text>
                <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
              </View>
              <Ionicons name="sunny" size={48} color="#f59e0b" />
            </View>
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="water-outline" size={16} color="#3b82f6" />
                <Text style={styles.weatherDetailText}>{weatherData.humidity}% Humidity</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Ionicons name="rainy-outline" size={16} color="#3b82f6" />
                <Text style={styles.weatherDetailText}>{weatherData.rainfall}mm Rainfall</Text>
              </View>
            </View>
            <View style={styles.weatherForecast}>
              <Ionicons name="information-circle-outline" size={16} color="#16a34a" />
              <Text style={styles.weatherForecastText}>{weatherData.forecast}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {loading ? (
              Array(4).fill(0).map((_, index) => (
                <View key={index} style={styles.quickActionCard}>
                  <View style={styles.skeletonQuickAction}>
                    <View style={styles.skeletonQuickActionIcon} />
                    <View style={styles.skeletonQuickActionLabel} />
                  </View>
                </View>
              ))
            ) : (
              quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={() => handleQuickAction(action.route)}
                  activeOpacity={0.7}
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading }}
                  accessible={true}
                >
                  <LinearGradient
                    colors={['#ffffff', '#f8fafc']}
                    style={styles.quickActionGradient}
                  >
                    <Text style={styles.quickActionIconEmoji}>{action.icon}</Text>
                    <Text style={styles.quickActionLabelText}>{action.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            )}
          </View>
        </Animated.View>

        {/* Farm Health Overview */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Farm Health Overview</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthImagePlaceholder}>
              <Ionicons name="pulse-outline" size={40} color="#16a34a" />
              <Text style={styles.healthImageText}>Satellite imagery analysis processing...</Text>
            </View>
            <View style={styles.healthMetrics}>
              <View style={styles.healthMetricItem}>
                <Text style={styles.healthMetricLabel}>NDVI Index</Text>
                <View style={[styles.healthBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.healthBadgeText, { color: '#16a34a' }]}>Good</Text>
                </View>
              </View>
              <View style={styles.healthMetricItem}>
                <Text style={styles.healthMetricLabel}>Crop Health</Text>
                <View style={[styles.healthBadge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.healthBadgeText, { color: '#16a34a' }]}>Healthy</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Main Services */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Insurance Services</Text>

          {/* New Claim Card */}
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => navigation.navigate('ClaimSubmissionScreen')}
            activeOpacity={0.9}
            accessibilityLabel="File New Claim. Start a new insurance claim process. Quick Process."
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            accessible={true}
          >
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.serviceCardGradient}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceIconContainer}>
                  <Text style={styles.serviceIcon}>📝</Text>
                </View>
                <View style={styles.serviceTextContainer}>
                  <Text style={styles.serviceTitle}>File New Claim</Text>
                  <Text style={styles.serviceSubtitle}>
                    Start a new insurance claim process
                  </Text>
                  <View style={styles.serviceTagContainer}>
                    <View style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>Quick Process</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.serviceArrow}>
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Previous Claims Card */}
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => navigation.navigate('PreviousClaims')}
            activeOpacity={0.9}
            accessibilityLabel="Previous Claims. View and track your claim history. 2 Active."
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            accessible={true}
          >
            <LinearGradient
              colors={['#2196F3', '#1565C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.serviceCardGradient}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceIconContainer}>
                  <Text style={styles.serviceIcon}>📂</Text>
                </View>
                <View style={styles.serviceTextContainer}>
                  <Text style={styles.serviceTitle}>Previous Claims</Text>
                  <Text style={styles.serviceSubtitle}>
                    View and track your claim history
                  </Text>
                  <View style={styles.serviceTagContainer}>
                    <View style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>2 Active</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.serviceArrow}>
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Policy Details Card */}
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => navigation.navigate('MyPolicies')}
            activeOpacity={0.9}
            accessibilityLabel="Policy Details. View your insurance coverage details. Active."
            accessibilityRole="button"
            accessibilityState={{ disabled: loading }}
            accessible={true}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.serviceCardGradient}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceIconContainer}>
                  <Text style={styles.serviceIcon}>🛡️</Text>
                </View>
                <View style={styles.serviceTextContainer}>
                  <Text style={styles.serviceTitle}>Policy Details</Text>
                  <Text style={styles.serviceSubtitle}>
                    View your insurance coverage details
                  </Text>
                  <View style={styles.serviceTagContainer}>
                    <View style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>Active</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.serviceArrow}>
                  <Ionicons name="arrow-forward" size={24} color="white" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Help Section */}
        <Animated.View
          style={[
            styles.helpCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.helpContent}>
            <Text style={styles.helpIcon}>💬</Text>
            <View style={styles.helpText}>
              <Text style={styles.helpTitle}>Need Help?</Text>
              <Text style={styles.helpSubtitle}>
                Chat with our AI assistant for instant support
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* ChatBot Floating Button */}
      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.8}
        accessibilityLabel="AI Chatbot"
        accessibilityRole="button"
        accessible={true}
      >
        <LinearGradient
          colors={['#66BB6A', '#4CAF50']}
          style={styles.chatbotGradient}
        >
          <Ionicons name="chatbubbles" size={28} color="white" />
        </LinearGradient>
        <View style={styles.chatbotBadge}>
          <Text style={styles.chatbotBadgeText}>AI</Text>
        </View>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.navBarContainer}>
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          style={styles.navBar}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('home');
              navigation.navigate('Home');
            }}
            accessibilityLabel="Home"
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'home' }}
            accessible={true}
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeTab === 'home' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'home' && styles.navLabelActive
            ]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('claims');
              navigation.navigate('PreviousClaims');
            }}
            accessibilityLabel="Claims"
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'claims' }}
            accessible={true}
          >
            <Ionicons
              name={activeTab === 'claims' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={activeTab === 'claims' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'claims' && styles.navLabelActive
            ]}>
              Claims
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('profile');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Profile"
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'profile' }}
            accessible={true}
          >
            <Ionicons
              name={activeTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeTab === 'profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'profile' && styles.navLabelActive
            ]}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveTab('settings');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === 'settings' }}
            accessible={true}
          >
            <Ionicons
              name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={activeTab === 'settings' ? '#FFFFFF' : '#B0BEC5'}
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'settings' && styles.navLabelActive
            ]}>
              Settings
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
  topBarGradient: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  welcomeSectionFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  welcomeGradient: {
    paddingTop: 90,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollSpacer: {
    height: 330,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  statCardCompact: {
    width: (width - 50) / 2,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statInfo: {
    flex: 1,
  },
  statValueCompact: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabelCompact: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFC107',
    marginLeft: 4,
    marginTop: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  welcomeSection: {
    marginBottom: 10,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 8,
    maxWidth: width * 0.6,
  },
  wave: {
    fontSize: 26,
  },
  farmerIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  farmerIdText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  profilePicContainer: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  skeletonAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statCard: {
    width: 110,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased to ensure visibility
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  weatherCondition: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 2,
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherDetailText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  weatherForecast: {
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherForecastText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 18,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionIconEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickActionLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  healthImagePlaceholder: {
    height: 120,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbf7d0',
  },
  healthImageText: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  healthMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthMetricItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  healthMetricLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  healthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  serviceCard: {
    marginBottom: 18,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1 }],
    transition: 'transform 0.2s ease',
  },
  serviceCardGradient: {
    padding: 24,
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    fontSize: 36,
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  serviceSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 10,
    lineHeight: 20,
  },
  serviceTagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  serviceArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  helpCard: {
    marginTop: 24,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 4,
  },
  helpSubtitle: {
    fontSize: 13,
    color: '#1976D2',
  },
  chatbotButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatbotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatbotBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF5252',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatbotBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skeletonGreeting: { width: 100, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8, marginBottom: 8 },
  skeletonName: { width: 150, height: 26, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 12, marginBottom: 12 },
  skeletonIdBadge: { width: 120, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 14 },
  skeletonStatIconSmall: { width: 36, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 10, marginRight: 10 },
  skeletonStatValueSmall: { width: 60, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 },
  skeletonQuickAction: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20 },
  skeletonQuickActionIcon: { width: 36, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 12, marginBottom: 12 },
  skeletonQuickActionLabel: { width: 70, height: 15, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8 },
  skeletonServiceCard: { padding: 24, backgroundColor: 'rgba(76, 175, 80, 0.8)', borderRadius: 24, flexDirection: 'row', alignItems: 'center' },
  skeletonServiceIcon: { width: 72, height: 72, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 20, marginRight: 20 },
  skeletonServiceText: { flex: 1 },
  skeletonServiceTitle: { width: 120, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8, marginBottom: 8 },
  skeletonServiceSubtitle: { width: 180, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 8, marginBottom: 12 },
  skeletonServiceTag: { width: 80, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 12 },
  skeletonServiceArrow: { width: 48, height: 48, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 24 },
});

export default HomeScreen;