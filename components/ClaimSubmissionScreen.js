import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, ScrollView, Alert, ActivityIndicator, Modal, Platform, StatusBar, Dimensions
} from 'react-native';
import { TextInput } from 'react-native-paper';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

// Claim categories matching web perils
const CLAIM_CATEGORIES = [
  { id: 'Flood', name: 'Flood/Inundation', icon: 'water-outline', color: '#16a34a' },
  { id: 'Drought', name: 'Drought', icon: 'sunny-outline', color: '#eab308' },
  { id: 'Cyclone', name: 'Cyclone/Cyclonic Rain', icon: 'thunderstorm-outline', color: '#2563eb' },
  { id: 'Hailstorm', name: 'Hailstorm', icon: 'snow-outline', color: '#9333ea' },
  { id: 'Landslide', name: 'Landslide', icon: 'trending-down-outline', color: '#94a3b8' },
  { id: 'Pests', name: 'Pests/Diseases', icon: 'bug-outline', color: '#dc2626' },
  { id: 'Fire', name: 'Natural Fire/Lightning', icon: 'flame-outline', color: '#f97316' },
  { id: 'Cloudburst', name: 'Cloudburst', icon: 'cloud-download-outline', color: '#0ea5e9' },
  { id: 'WildAnimalAttack', name: 'Wild Animal Attack', icon: 'paw-outline', color: '#8b5cf6' },
  { id: 'Other', name: 'Other Damage', icon: 'help-circle-outline', color: '#64748b' },
];

const CROP_STAGES = [
  { id: 'Sowing', name: 'Sowing/Germination', icon: 'leaf-outline', color: '#4ade80' },
  { id: 'Vegetative', name: 'Vegetative Stage', icon: 'nutrition-outline', color: '#22c55e' },
  { id: 'Flowering', name: 'Flowering Stage', icon: 'flower-outline', color: '#f472b6' },
  { id: 'Maturity', name: 'Maturity/Grain Filling', icon: 'stats-chart-outline', color: '#eab308' },
  { id: 'Harvested', name: 'Harvested', icon: 'cut-outline', color: '#f97316' },
];

// Helper function to generate plus code
const getPlusCode = (latitude, longitude) => {
  const lat = Math.abs(latitude);
  const lng = Math.abs(longitude);
  const latCode = Math.floor(lat * 8000).toString(36).toUpperCase();
  const lngCode = Math.floor(lng * 8000).toString(36).toUpperCase();
  return `${latCode.slice(-3)}${lngCode.slice(-3)}+${latCode.slice(-2)}${lngCode.slice(-2)}`;
};

const CustomPicker = ({ label, items, selectedValue, onValueChange, placeholder, icon }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedItem = items.find(i => i.id === selectedValue);

    return (
        <View style={{ marginBottom: 16 }}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TouchableOpacity 
                style={styles.pickerWrapper} 
                onPress={() => setModalVisible(true)}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {icon && <Ionicons name={icon} size={20} color={Colors.primary} />}
                    {selectedItem ? (
                        <Text style={styles.pickerValue}>{selectedItem.name}</Text>
                    ) : (
                        <Text style={styles.pickerPlaceholder}>{placeholder || 'Select option'}</Text>
                    )}
                </View>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {items.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.modalItem,
                                        selectedValue === item.id && styles.modalItemActive
                                    ]}
                                    onPress={() => {
                                        onValueChange(item.id);
                                        setModalVisible(false);
                                    }}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: item.color ? item.color + '20' : '#e2e8f0' }]}>
                                        <Ionicons name={item.icon || 'ellipse'} size={22} color={item.color || Colors.textMuted} />
                                    </View>
                                    <Text style={[
                                        styles.modalItemText,
                                        selectedValue === item.id && styles.modalItemTextSelected
                                    ]}>
                                        {item.name}
                                    </Text>
                                    {selectedValue === item.id && (
                                        <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const ClaimSubmissionScreen = ({ route }) => {
  const navigation = useNavigation();
  
  // Form State
  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [fetchingPolicies, setFetchingPolicies] = useState(false);
  
  const [dateOfIncident, setDateOfIncident] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Time Picker State
  const [timeOfIncident, setTimeOfIncident] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeString, setTimeString] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState(CLAIM_CATEGORIES[0].id);
  const [cropGrowthStage, setCropGrowthStage] = useState(CROP_STAGES[1].id);
  const [affectedArea, setAffectedArea] = useState('');
  const [estimatedLossPercentage, setEstimatedLossPercentage] = useState('');
  const [amountClaimed, setAmountClaimed] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Handle initial params
  useEffect(() => {
    if (route?.params?.category) {
      const catName = route.params.category;
      const matched = CLAIM_CATEGORIES.find(c => c.name === catName || c.id === catName.toLowerCase());
      if (matched) setSelectedCategory(matched.id);
    }
  }, [route?.params]);

  useEffect(() => {
    fetchPolicies();
    fetchFarmerProfile();
  }, []);

  const fetchFarmerProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const API_URL = getApiUrl(API_ENDPOINTS.GET_FARMER_DETAILS);
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const farm = await response.json();
        if (farm.landAreaSize || farm.area) {
          setAffectedArea(String(farm.landAreaSize || farm.area));
        }
      }
    } catch (error) {
      console.error('Error fetching farmer profile for claim:', error);
    }
  };

  const fetchPolicies = async () => {
    setFetchingPolicies(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const API_URL = getApiUrl(API_ENDPOINTS.GET_MY_POLICIES);
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const activePolicies = data.filter(p => 
          p.status === 'Active' || p.status === 'active' || p.viewStatus === 'Active' ||
          (!p.status && (!p.type || p.type === 'policy'))
        );
        setPolicies(activePolicies);
        if (activePolicies.length > 0) {
          setSelectedPolicy(activePolicies[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setFetchingPolicies(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfIncident(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTimeOfIncident(selectedTime);
      const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTimeString(formattedTime);
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to fetch current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = location.coords;
      setLocationAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to fetch location. Please enter manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  const takePhoto = async () => {
    setLoading(true);
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const locationPerm = await Location.requestForegroundPermissionsAsync();
      
      if (cameraPerm.status !== 'granted' || locationPerm.status !== 'granted') {
        Alert.alert('Permissions Required', 'Camera and location permissions are required.');
        setLoading(false);
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!cameraResult.canceled && cameraResult.assets?.length > 0) {
        const locationResult = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = locationResult.coords;
        
        const now = new Date();
        const newPhoto = {
          uri: cameraResult.assets[0].uri,
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: now.toISOString(),
          readableTimestamp: now.toLocaleString('en-IN'),
          plusCode: getPlusCode(coords.latitude, coords.longitude),
          id: Date.now().toString(),
        };

        setPhotos(prev => [...prev, newPhoto]);
        
        // Auto-fill location if empty
        if (!locationAddress) {
          setLocationAddress(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
        }
      }
    } catch (error) {
      console.error('Photo error:', error);
      Alert.alert('Error', 'Failed to capture photo.');
    } finally {
      setLoading(false);
    }
  };

  const takeDocument = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setDocuments(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Document error:', error);
    }
  };

  const removePhoto = (id) => setPhotos(prev => prev.filter(p => p.id !== id));
  const removeDocument = (index) => setDocuments(prev => prev.filter((_, i) => i !== index));

  const validateAndSubmit = async () => {
    if (!selectedPolicy) return Alert.alert('Required', 'Please select a policy.');
    if (!selectedCategory) return Alert.alert('Required', 'Please select a type of peril.');
    if (!affectedArea) return Alert.alert('Required', 'Please enter affected area.');
    if (!estimatedLossPercentage) return Alert.alert('Required', 'Please enter loss percentage.');
    if (!amountClaimed) return Alert.alert('Required', 'Please enter estimated loss amount.');
    if (!locationAddress) return Alert.alert('Required', 'Please provide location.');
    if (!claimDescription || claimDescription.length < 10) return Alert.alert('Required', 'Please provide a valid description.');
    if (photos.length < 1) return Alert.alert('Required', 'Please provide at least 1 evidence photo.');

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();

      formData.append('policyId', selectedPolicy.id || selectedPolicy._id || '');
      formData.append('chosenPolicyId', selectedPolicy.id || selectedPolicy._id || '');
      formData.append('dateOfIncident', dateOfIncident.toISOString().split('T')[0]);
      formData.append('timeOfIncident', timeString || timeOfIncident.toLocaleTimeString());
      formData.append('typeOfPeril', selectedCategory);
      formData.append('description', claimDescription);
      formData.append('affectedArea', affectedArea);
      formData.append('estimatedLossPercentage', estimatedLossPercentage);
      formData.append('amountClaimed', amountClaimed);
      formData.append('cropGrowthStage', cropGrowthStage);
      formData.append('location', locationAddress);

      photos.forEach((photo, index) => {
        formData.append('images', {
          uri: photo.uri,
          name: `claim_image_${index}.jpg`,
          type: 'image/jpeg'
        });
      });

      documents.forEach((doc, index) => {
        formData.append('documents', {
          uri: doc.uri,
          name: `claim_doc_${index}.jpg`,
          type: 'image/jpeg'
        });
      });

      const API_URL = getApiUrl(API_ENDPOINTS.SUBMIT_CLAIM);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      const json = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Claim submitted successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        Alert.alert('Failed', json.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Network error or server timeout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>File New Claim</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Step 1: Policy Selection */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>1. Select Policy</Text>
          </View>
          
          {fetchingPolicies ? (
            <ActivityIndicator color={Colors.primary} />
          ) : policies.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.policyScroll}>
              {policies.map(policy => (
                <TouchableOpacity
                  key={policy.id}
                  style={[styles.policyChip, selectedPolicy?.id === policy.id && styles.policyChipSelected]}
                  onPress={() => setSelectedPolicy(policy)}
                >
                  <Ionicons 
                    name={selectedPolicy?.id === policy.id ? "checkmark-circle" : "ellipse-outline"} 
                    size={18} 
                    color={selectedPolicy?.id === policy.id ? Colors.primary : Colors.textMuted} 
                  />
                  <Text style={[styles.policyText, selectedPolicy?.id === policy.id && styles.policyTextSelected]}>
                    {policy.policyNumber} - {policy.cropName || policy.cropType}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.errorText}>No active policies found.</Text>
          )}

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Date of Incident *</Text>
              <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                  <Text style={styles.dateValue}>{dateOfIncident.toLocaleDateString()}</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfIncident}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Time (Approx)</Text>
              <TouchableOpacity style={styles.dateTrigger} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={20} color={Colors.primary} />
                  <Text style={styles.dateValue}>{timeString || 'Select Time'}</Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={timeOfIncident}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          </View>
        </View>

        {/* Step 2: Incident Details */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={22} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>2. Incident Details</Text>
          </View>

          <CustomPicker
            label="Type of Peril *"
            items={CLAIM_CATEGORIES}
            selectedValue={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="Select Peril"
            icon="alert-circle-outline"
          />

          <CustomPicker
            label="Crop Growth Stage *"
            items={CROP_STAGES}
            selectedValue={cropGrowthStage}
            onValueChange={setCropGrowthStage}
            placeholder="Select Stage"
            icon="leaf-outline"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
                <Text style={styles.label}>Affected Area (Ha) *</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={affectedArea}
                onChangeText={setAffectedArea}
                activeOutlineColor={Colors.primary}
                style={styles.inputPaper}
                placeholder="0.0"
              />
            </View>
            <View style={styles.halfInput}>
                <Text style={styles.label}>Loss % *</Text>
              <TextInput
                mode="outlined"
                keyboardType="numeric"
                value={estimatedLossPercentage}
                onChangeText={setEstimatedLossPercentage}
                activeOutlineColor={Colors.primary}
                style={styles.inputPaper}
                placeholder="0-100"
              />
            </View>
          </View>

          <Text style={styles.label}>Est. Loss Amount (₹) *</Text>
          <TextInput
            mode="outlined"
            keyboardType="numeric"
            value={amountClaimed}
            onChangeText={setAmountClaimed}
            activeOutlineColor={Colors.primary}
            style={styles.inputPaper}
            placeholder="Enter amount"
            left={<TextInput.Icon icon="currency-inr" />}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                mode="outlined"
                value={locationAddress}
                onChangeText={setLocationAddress}
                activeOutlineColor={Colors.primary}
                style={[styles.inputPaper, { marginBottom: 0 }]}
                placeholder="Lat, Long"
                left={<TextInput.Icon icon="map-marker" />}
                />
            </View>
            <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation} disabled={locationLoading}>
                {locationLoading ? <ActivityIndicator color="#FFF" /> : <Ionicons name="locate" size={24} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <View style={{ height: 16 }} />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={3}
            value={claimDescription}
            onChangeText={setClaimDescription}
            activeOutlineColor={Colors.primary}
            style={[styles.inputPaper, styles.textArea]}
            placeholder="Describe damage..."
          />
        </View>

        {/* Step 3: Evidence */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={22} color={Colors.primary} />
            <Text style={styles.sectionTitle}>3. Evidence</Text>
          </View>

          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} disabled={loading}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.cameraGradient}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
              <Text style={styles.cameraButtonText}>Add Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.photosContainer}>
            {photos.map(photo => (
              <View key={photo.id} style={styles.photoThumbnail}>
                <TouchableOpacity onPress={() => setSelectedImageUri(photo.uri)}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeIcon} onPress={() => removePhoto(photo.id)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={[styles.cameraButton, { marginTop: 10, backgroundColor: Colors.secondary }]} onPress={takeDocument}>
            <View style={[styles.cameraGradient, { backgroundColor: Colors.secondary }]}>
              <Ionicons name="document-text" size={24} color="#FFFFFF" />
              <Text style={styles.cameraButtonText}>Add Document</Text>
            </View>
          </TouchableOpacity>
          
          <View style={styles.photosContainer}>
            {documents.map((doc, index) => (
              <View key={index} style={styles.photoThumbnail}>
                <Image source={{ uri: doc.uri }} style={styles.photo} />
                <TouchableOpacity style={styles.removeIcon} onPress={() => removeDocument(index)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={validateAndSubmit} disabled={loading}>
          <LinearGradient colors={['#16a34a', '#15803d']} style={styles.submitGradient}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>Submit Claim</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal visible={!!selectedImageUri} transparent onRequestClose={() => setSelectedImageUri(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImageUri(null)} />
          <View style={styles.fullscreenImageWrapper}>
            {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.fullImage} />}
          </View>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setSelectedImageUri(null)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
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
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputPaper: {
        backgroundColor: '#f8fafc',
        marginBottom: 16,
    },
    textArea: {
        minHeight: 80,
    },
    dateTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        gap: 10,
    },
    dateValue: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    halfInput: {
        flex: 1,
    },
    pickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        padding: 14,
    },
    pickerValue: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
    pickerPlaceholder: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    modalList: {
        gap: 12,
        paddingBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#FFF',
        gap: 12,
    },
    modalItemActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.surface,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 16,
        color: '#334155',
        flex: 1,
    },
    modalItemTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    policyScroll: {
        paddingRight: 20,
        gap: 10,
    },
    policyChip: {
        padding: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    policyChipSelected: {
        backgroundColor: '#f0fdf4',
        borderColor: '#16a34a',
    },
    policyText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    policyTextSelected: {
        color: '#16a34a',
    },
    locationButton: {
        backgroundColor: '#2563eb',
        borderRadius: 14,
        width: 48,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 26, // align with input
    },
    cameraButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    cameraGradient: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    cameraButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 12,
    },
    photoThumbnail: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    photo: {
        width: '100%',
        height: '100%',
    },
    removeIcon: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    submitButton: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 6,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
    },
    submitGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    modalCloseArea: {
        flex: 1,
        width: '100%',
    },
    fullscreenImageWrapper: {
        width: width * 0.9,
        height: width * 1.2,
    },
    fullImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    errorText: {
        color: '#ef4444',
        fontStyle: 'italic',
        marginBottom: 10,
    }
});

export default ClaimSubmissionScreen;
