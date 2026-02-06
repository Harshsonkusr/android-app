import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  StatusBar,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import { getImageUrl } from '../utils/image-utils';
import Colors from '../constants/Colors';
import FarmBoundaryMap from './FarmBoundaryMap';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [activeNavTab, setActiveNavTab] = useState('profile');
  const [farmerData, setFarmerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Scroll animations
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const profileScale = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

  const profileOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchFarmerData();

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
  }, []);

  // Function to fetch farmer data from server
  const fetchFarmerData = async () => {
    try {
      setLoading(true);

      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
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
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (image, gps) => {
    setSelectedImage({ uri: image, gps });
    setImageModalVisible(true);
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

  // Show loading state while fetching data
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  // Handle case where no data is available
  if (!farmerData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>No Profile Data Available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFarmerData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const documents = [
    { name: 'Satbara 7/12', image: farmerData.satbaraImage, icon: 'document-text-outline' },
    { name: 'Patwari Map', image: farmerData.patwariMapImage, icon: 'map-outline' },
    { name: 'Aadhar Card', image: farmerData.aadhaarCardImage, icon: 'card-outline' },
    { name: 'Bank Passbook', image: farmerData.bankPassbookImage, icon: 'book-outline' },
    { name: 'Sowing Certificate', image: farmerData.sowingCertificate, icon: 'ribbon-outline' },
  ];

  const landPhotos = [1, 2, 3, 4, 5, 6, 7, 8]
    .filter(i => farmerData[`landImage${i}`])
    .map(i => ({
      uri: farmerData[`landImage${i}`],
      gps: farmerData[`landImage${i}Gps`]
    }));

  const boundaryCoordinates = landPhotos
    .filter(photo => photo.gps)
    .map(photo => {
      let gpsData = photo.gps;
      if (!gpsData) return null;

      if (typeof gpsData === 'string') {
        // Try parsing as JSON first (from mobile app)
        if (gpsData.trim().startsWith('{')) {
          try {
            gpsData = JSON.parse(gpsData);
          } catch (e) {
            console.error('Failed to parse JSON GPS data:', photo.gps);
            return null;
          }
        } else if (gpsData.includes(',')) {
          // Fallback to comma-separated string (from web signup)
          const [latStr, lngStr] = gpsData.split(',');
          const lat = parseFloat(latStr.trim());
          const lng = parseFloat(lngStr.trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            return { latitude: lat, longitude: lng };
          }
          console.error('Failed to parse comma-separated GPS data:', photo.gps);
          return null;
        }
      }

      if (gpsData && typeof gpsData === 'object' && 
          (gpsData.latitude || gpsData.lat) && 
          (gpsData.longitude || gpsData.lng)) {
        return {
          latitude: parseFloat(gpsData.latitude || gpsData.lat),
          longitude: parseFloat(gpsData.longitude || gpsData.lng),
        };
      }
      return null;
    })
    .filter(coord => coord !== null);

  // Add fallback logic for manually entered coordinates during registration
  if (boundaryCoordinates.length === 0 && farmerData.latitude && farmerData.longitude) {
    const lat = parseFloat(farmerData.latitude);
    const lng = parseFloat(farmerData.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      boundaryCoordinates.push({ latitude: lat, longitude: lng });
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed Top Bar for Navigation */}
      <View style={styles.fixedTopBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon.')}
        >
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]} // Make tabs sticky if desired
      >
        {/* Profile Header Section - Now part of ScrollView */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary, Colors.primaryLight]}
          style={styles.profileHeaderSection}
        >
          <View style={styles.headerSpacer} />

          <Animated.View style={[
            styles.profileCard,
            {
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [-100, 0, 100],
                  outputRange: [50, 0, 0],
                  extrapolate: 'clamp'
                })
              }]
            }
          ]}>
            <View style={styles.avatarContainer}>
              {farmerData.profilePhoto && (
                <Image
                  source={{ uri: getImageUrl(farmerData.profilePhoto) }}
                  style={styles.avatar}
                />
              )}
              {farmerData.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={28} color={Colors.primary} />
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{farmerData.name || 'Farmer'}</Text>
            <View style={styles.idBadge}>
              <Text style={styles.idText}>Farmer ID: {farmerData.farmerId || farmerData.id || 'N/A'}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{farmerData.landAreaSize || '0'}</Text>
                <Text style={styles.statLabel}>Hectares</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{farmerData.cropName || 'N/A'}</Text>
                <Text style={styles.statLabel}>Crop</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{farmerData.insuranceLinked ? 'Linked' : 'No'}</Text>
                <Text style={styles.statLabel}>Insurance</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Tab Navigation - Scrolls with profile or stays sticky */}
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
            {[
              { id: 'personal', label: 'Personal', icon: 'person-outline' },
              { id: 'land', label: 'Land & Crop', icon: 'leaf-outline' },
              { id: 'banking', label: 'Banking', icon: 'card-outline' },
              { id: 'documents', label: 'Documents', icon: 'documents-outline' },
              { id: 'photos', label: 'Photos', icon: 'images-outline' }
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={activeTab === tab.id ? '#FFFFFF' : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingBottom: 100 // Space for nav bar
          }}
        >
          {/* Tab Content... */}
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="person" size={22} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Personal Information</Text>
                </View>
                <View style={styles.infoCard}>
                  <InfoRow icon="person-outline" label="Full Name" value={farmerData.name} />
                  <InfoRow icon="card-outline" label="Aadhaar Number" value={farmerData.aadhaarNumber} />
                  <InfoRow icon="call-outline" label="Mobile Number" value={`+91 ${farmerData.mobileNumber || 'N/A'}`} />
                  <InfoRow icon="calendar-outline" label="Date of Birth" value={farmerData.dob || 'N/A'} />
                  <InfoRow icon="transgender-outline" label="Gender" value={farmerData.gender || 'N/A'} />
                  <InfoRow icon="people-outline" label="Caste Category" value={farmerData.casteCategory || 'N/A'} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location" size={22} color={Colors.secondary} />
                  <Text style={styles.sectionTitle}>Address Details</Text>
                </View>
                <View style={styles.infoCard}>
                  <InfoRow icon="home-outline" label="Village" value={farmerData.village} />
                  <InfoRow icon="map-outline" label="Tehsil" value={farmerData.tehsil} />
                  <InfoRow icon="business-outline" label="District" value={farmerData.district} />
                  <InfoRow icon="flag-outline" label="State" value={farmerData.state} />
                  <InfoRow icon="location-outline" label="Pincode" value={farmerData.pincode || 'N/A'} />
                  <InfoRow icon="document-text-outline" label="Full Address" value={farmerData.fullAddress || 'N/A'} multiline />
                  <InfoRow icon="location" label="Latitude" value={farmerData.latitude || 'N/A'} />
                  <InfoRow icon="location" label="Longitude" value={farmerData.longitude || 'N/A'} />
                </View>
              </View>
            </View>
          )}

          {/* Land & Crop Tab */}
          {activeTab === 'land' && (
            <View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="leaf" size={22} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Crop & Farmer Information</Text>
                </View>
                <View style={styles.infoCard}>
                  <InfoRow icon="nutrition-outline" label="Crop Name" value={farmerData.cropName} />
                  <InfoRow icon="leaf-outline" label="Crop Variety" value={farmerData.cropVariety || 'N/A'} />
                  <InfoRow icon="calendar-outline" label="Season" value={farmerData.cropSeason} />
                  <InfoRow icon="layers-outline" label="Crop Type" value={farmerData.cropType} />
                  <InfoRow icon="shield-checkmark-outline" label="Insurance Unit" value={farmerData.insuranceUnit || 'N/A'} />
                  <InfoRow icon="person-outline" label="Farmer Type" value={farmerData.farmerType || 'N/A'} />
                  <InfoRow icon="briefcase-outline" label="Farmer Category" value={farmerData.farmerCategory || 'N/A'} />
                  <InfoRow icon="cash-outline" label="Loanee Status" value={farmerData.loaneeStatus || 'N/A'} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="earth" size={22} color="#795548" />
                  <Text style={styles.sectionTitle}>Land Details</Text>
                </View>
                <View style={styles.infoCard}>
                  <InfoRow icon="resize-outline" label="Land Area Size (Hectares)" value={`${farmerData.landAreaSize || 0} Hectares`} />
                  <InfoRow icon="home-outline" label="Farm Size (Hectares)" value={`${farmerData.farmSize || 0} Hectares`} />
                  <InfoRow icon="document-text-outline" label="Khasra Number" value={farmerData.landRecordKhasra} />
                  <InfoRow icon="document-text-outline" label="Khatauni Number" value={farmerData.landRecordKhatauni || 'N/A'} />
                  <InfoRow icon="clipboard-outline" label="Survey Number" value={farmerData.surveyNumber || 'N/A'} />
                  <InfoRow icon="globe-outline" label="Soil Type" value={farmerData.soilType || 'N/A'} />
                  <InfoRow icon="water-outline" label="Irrigation Method" value={farmerData.irrigationMethod || 'N/A'} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="map" size={22} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Farm Boundary Map (GIS)</Text>
                </View>
                <FarmBoundaryMap coordinates={boundaryCoordinates} />
              </View>
            </View>
          )}

          {/* Banking Tab */}
          {activeTab === 'banking' && (
            <View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="card" size={22} color={Colors.warning} />
                  <Text style={styles.sectionTitle}>Bank Account Details</Text>
                </View>
                <View style={styles.infoCard}>
                  <InfoRow icon="business-outline" label="Bank Name" value={farmerData.bankName} />
                  <InfoRow icon="location-outline" label="Branch Name" value={farmerData.branchName || 'N/A'} />
                  <InfoRow icon="card-outline" label="Account Number" value={farmerData.bankAccountNo} />
                  <InfoRow icon="barcode-outline" label="IFSC Code" value={farmerData.bankIfsc} />
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="shield-checkmark" size={22} color={Colors.secondary} />
                  <Text style={styles.sectionTitle}>Account Status</Text>
                </View>
                <View style={styles.statusCard}>
                  <View style={[styles.statusChip, farmerData.insuranceLinked ? styles.statusSuccess : styles.statusInfo]}>
                    <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.statusText}>
                      Insurance Status: {farmerData.insuranceLinked ? 'Linked' : 'Not Linked'}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, farmerData.isVerified ? styles.statusSuccess : styles.statusWarning]}>
                    <Ionicons name={farmerData.isVerified ? 'checkmark-circle' : 'time-outline'} size={20} color="#FFFFFF" />
                    <Text style={styles.statusText}>
                      Verification: {farmerData.isVerified ? 'Verified Account' : 'Pending Verification'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="documents" size={22} color="#9C27B0" />
                <Text style={styles.sectionTitle}>Land Documents</Text>
              </View>
              <View style={styles.documentsGrid}>
                {documents.map((doc, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.documentCard}
                    onPress={() => openImageModal(doc.image)}
                  >
                    <LinearGradient
                      colors={['#9C27B0', '#7B1FA2']}
                      style={styles.documentIconContainer}
                    >
                      <Ionicons name={doc.icon} size={28} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={styles.documentName}>{doc.name}</Text>
                    <View style={styles.viewBadge}>
                      <Ionicons name="eye-outline" size={16} color="#9C27B0" />
                      <Text style={styles.viewText}>View</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Land Photos Tab */}
          {activeTab === 'photos' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="images" size={22} color="#FF5722" />
                <Text style={styles.sectionTitle}>Land Photographs</Text>
                <Text style={styles.photoCount}>{landPhotos.length} photos</Text>
              </View>
              <View style={styles.photosGrid}>
                {landPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoCard}
                    onPress={() => openImageModal(photo.uri, photo.gps)}
                  >
                    <Image source={{ uri: getImageUrl(photo.uri) }} style={styles.landPhoto} />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={styles.photoOverlay}
                    >
                      <View style={styles.photoInfo}>
                        <Ionicons name="location" size={14} color="#FFFFFF" />
                        <Text style={styles.gpsText} numberOfLines={1}>
                          {photo.gps ? (typeof photo.gps === 'string' ? photo.gps : `${photo.gps.latitude.toFixed(4)}, ${photo.gps.longitude.toFixed(4)}`) : 'No GPS'}
                        </Text>
                      </View>
                      <Text style={styles.photoNumber}>Land Image {index + 1}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Registration Info */}
          <View style={styles.section}>
            <View style={styles.registrationCard}>
              <Ionicons name="time-outline" size={20} color="#757575" />
              <Text style={styles.registrationText}>
                Registered on {new Date(farmerData.registeredDate || farmerData.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navBarContainer}>
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          style={styles.navBar}
        >
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('home');
              navigation.navigate('Home');
            }}
            accessibilityLabel="Home"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'home' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'home' ? 'home' : 'home-outline'}
              size={22}
              color={activeNavTab === 'home' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'home' && styles.navLabelActive
            ]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('claims');
              navigation.navigate('PreviousClaims');
            }}
            accessibilityLabel="Claims"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'claims' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'claims' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={activeNavTab === 'claims' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'claims' && styles.navLabelActive
            ]}>
              Claims
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('profile');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Profile"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'profile' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'profile' ? 'person' : 'person-outline'}
              size={22}
              color={activeNavTab === 'profile' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'profile' && styles.navLabelActive
            ]}>
              Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              setActiveNavTab('settings');
              navigation.navigate('FarmerProfile');
            }}
            accessibilityLabel="Settings"
            accessibilityRole="button"
            accessibilityState={{ selected: activeNavTab === 'settings' }}
            accessible={true}
          >
            <Ionicons
              name={activeNavTab === 'settings' ? 'settings' : 'settings-outline'}
              size={22}
              color={activeNavTab === 'settings' ? '#FFFFFF' : '#B0BEC5'}
            />
            <Text style={[
              styles.navLabel,
              activeNavTab === 'settings' && styles.navLabelActive
            ]}>
              Settings
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.modalContent}>
              <Image source={{ uri: selectedImage.uri }} style={styles.modalImage} />
              {selectedImage.gps && (
                <View style={styles.gpsCard}>
                  <Ionicons name="location" size={24} color="#4CAF50" />
                  <Text style={styles.gpsModalText}>{selectedImage.gps}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={20} color="#757575" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  fixedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 15,
  },
  profileHeaderSection: {
    paddingBottom: 30,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerSpacer: {
    height: 110, // Space for fixed top bar
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    elevation: 2,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  idBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f1f5f9',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabScrollContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#f8fafc',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  photoCount: {
    fontSize: 11,
    color: Colors.primaryDark,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    gap: 10,
  },
  statusSuccess: {
    backgroundColor: Colors.success,
  },
  statusWarning: {
    backgroundColor: Colors.warning,
  },
  statusInfo: {
    backgroundColor: Colors.secondary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  documentCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  documentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff', // Light purple
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  viewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9333ea', // Purple-600
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: (width - 52) / 2,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  landPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  gpsText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  photoNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  registrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 10,
  },
  registrationText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  logoutButton: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalContent: {
    width: '90%',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: height * 0.6,
    borderRadius: 24,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 20,
    gap: 10,
  },
  gpsModalText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  navBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    paddingBottom: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 5,
    flex: 1,
  },
  navLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});