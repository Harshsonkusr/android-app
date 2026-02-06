import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Image, 
  Platform, 
  KeyboardAvoidingView, 
  Keyboard,
  Dimensions,
  Animated
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Snackbar,
  RadioButton,
  ActivityIndicator,
  HelperText,
  Text,
  Menu,
  Divider,
  Chip,
  Surface,
  IconButton,
  DataTable
} from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import LandMapMarker from '../components/LandMapMarker';
import { getApiUrl, API_ENDPOINTS, testServerConnection } from '../config/api.config';
import Colors from '../constants/Colors';

const { width, height } = Dimensions.get('window');

// Utility function to validate GPS coordinates
const validateGPSCoordinates = (lat, lon) => {
  const validLat = typeof lat === 'number' && lat >= -90 && lat <= 90;
  const validLon = typeof lon === 'number' && lon >= -180 && lon <= 180;
  return validLat && validLon;
};

// Function to process and compress image
const processImage = async (imageUri) => {
  try {
    const processedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1920 } }],
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    console.log('✅ Image processed:', processedImage.uri);
    return processedImage.uri;
  } catch (error) {
    console.error('❌ Image processing error:', error);
    return imageUri;
  }
};

// List of Indian States
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh"
];

// Crop list
const cropList = [
  "Wheat", "Rice", "Cotton", "Soybean", "Sugarcane", "Maize",
  "Pulses", "Bajra", "Jowar", "Barley", "Groundnut", "Mustard",
  "Sunflower", "Potato", "Onion", "Tomato", "Other"
];

// Crop seasons
const cropSeasons = [
  "Kharif",
  "Rabi",
  "Zaid",
  "Perennial"
];

// Soil Types
const SOIL_TYPES = [
  "Alluvial Soil",
  "Black Soil",
  "Red Soil",
  "Laterite Soil",
  "Desert Soil",
  "Mountain Soil",
  "Saline Soil",
  "Peaty Soil"
];

// Irrigation Methods
const IRRIGATION_METHODS = [
  "Rainfed",
  "Canal Irrigation",
  "Well Irrigation",
  "Tube Well Irrigation",
  "Tank Irrigation",
  "Drip Irrigation",
  "Sprinkler Irrigation",
  "River Lift Irrigation"
];

// List of Indian Banks
export const INDIAN_BANKS = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Bank of Baroda",
  "Punjab National Bank",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "IDBI Bank",
  "Yes Bank",
  "UCO Bank",
  "Federal Bank",
  "IDFC FIRST Bank",
  "Standard Chartered Bank",
  "South Indian Bank",
  "RBL Bank",
  "Bandhan Bank",
  "Dhanlaxmi Bank",
  "Karnataka Bank",
  "Karur Vysya Bank",
  "Tamilnad Mercantile Bank",
  "DCB Bank",
  "City Union Bank",
  "J&K Bank",
  "DBS Bank India",
  "Airtel Payments Bank",
  "Paytm Payments Bank",
  "Jio Payments Bank",
  "India Post Payments Bank",
  "Fino Payments Bank",
  "NSDL Payments Bank",
].sort();

const FarmerRegistrationScreen = ({ navigation }) => {
  const scrollViewRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    aadhaarNumber: '',
    mobileNumber: '',
    dob: '',
    gender: 'Male',
    casteCategory: 'General',
    farmerType: 'Small',
    farmerCategory: 'Owner',
    loaneeStatus: 'No',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    pincode: '',
    fullAddress: '',
    cropName: '',
    cropVariety: '',
    cropSeason: '',
    soilType: '',
    irrigationMethod: '',
    landRecordKhasra: '',
    landRecordKhatauni: '',
    surveyNumber: '',
    insuranceUnit: '',
    landAreaSize: '',
    farmSize: '',
    bankName: '',
    branchName: '',
    bankAccountNo: '',
    bankIfsc: '',
    insuranceLinked: 'No',
    satbaraImage: null,
    patwariMapImage: null,
    aadhaarCardImage: null,
    bankPassbookImage: null,
    sowingCertificate: null,
    landImage1: null,
    landImage2: null,
    landImage3: null,
    landImage4: null,
    landImage5: null,
    landImage6: null,
    landImage7: null,
    landImage8: null,
  });

  // GPS Queue for captured images
  const [gpsQueue, setGpsQueue] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [stateMenuVisible, setStateMenuVisible] = useState(false);
  const [districtMenuVisible, setDistrictMenuVisible] = useState(false);
  const [tehsilMenuVisible, setTehsilMenuVisible] = useState(false);
  const [villageMenuVisible, setVillageMenuVisible] = useState(false);
  const [cropMenuVisible, setCropMenuVisible] = useState(false);
  const [seasonMenuVisible, setSeasonMenuVisible] = useState(false);
  const [soilTypeMenuVisible, setSoilTypeMenuVisible] = useState(false);
  const [irrigationMenuVisible, setIrrigationMenuVisible] = useState(false);
  const [bankMenuVisible, setBankMenuVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Location data state
  const [states, setStates] = useState(indianStates);
  const [districts, setDistricts] = useState([]);
  const [tehsils, setTehsils] = useState([]);
  const [villages, setVillages] = useState([]);
  const [tehsilVillageMap, setTehsilVillageMap] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);

  // Fetch districts when state changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!form.state) {
        setDistricts([]);
        setTehsils([]);
        setVillages([]);
        setTehsilVillageMap({});
        return;
      }

      try {
        const response = await fetch('https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json');
        const data = await response.json();
        const stateData = data.states.find(s => s.state === form.state);
        setDistricts(stateData ? stateData.districts : []);
        setTehsils([]);
        setVillages([]);
        setTehsilVillageMap({});
      } catch (error) {
        console.error('Error fetching districts:', error);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [form.state]);

  // Fetch tehsils and villages when district changes
  useEffect(() => {
    const fetchTehsilsAndVillages = async () => {
      if (!form.district) {
        setTehsils([]);
        setVillages([]);
        setTehsilVillageMap({});
        return;
      }

      setLocationLoading(true);
      try {
        const response = await fetch(`https://api.postalpincode.in/postoffice/${form.district}`);
        const data = await response.json();

        if (data[0] && data[0].Status === 'Success') {
          const postOffices = data[0].PostOffice;
          const tehsilSet = new Set();
          const tehsilVillageMap = {};

          postOffices.forEach(po => {
            const tehsil = po.Block || po.Taluk || 'Unknown';
            const village = po.Name;

            tehsilSet.add(tehsil);

            if (!tehsilVillageMap[tehsil]) {
              tehsilVillageMap[tehsil] = [];
            }
            if (!tehsilVillageMap[tehsil].includes(village)) {
              tehsilVillageMap[tehsil].push(village);
            }
          });

          setTehsils(Array.from(tehsilSet).sort());
          setTehsilVillageMap(tehsilVillageMap);
          setVillages([]);
        } else {
          setTehsils([]);
          setVillages([]);
          setTehsilVillageMap({});
        }
      } catch (error) {
        console.error('Error fetching tehsils and villages:', error);
        setTehsils([]);
        setVillages([]);
        setTehsilVillageMap({});
      } finally {
        setLocationLoading(false);
      }
    };

    fetchTehsilsAndVillages();
  }, [form.district]);

  // Update villages when tehsil changes
  useEffect(() => {
    if (form.tehsil && tehsilVillageMap[form.tehsil]) {
      setVillages(tehsilVillageMap[form.tehsil].sort());
    } else {
      setVillages([]);
    }
  }, [form.tehsil, tehsilVillageMap]);

  // Update location from pincode
  const handlePincodeChange = async (value) => {
    setForm(prev => ({ ...prev, pincode: value }));

    if (value.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await response.json();

        if (data[0] && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setForm(prev => ({
            ...prev,
            state: postOffice.State,
            district: postOffice.District,
            tehsil: postOffice.Block,
            village: postOffice.Name
          }));
        }
      } catch (error) {
        console.error('Error fetching location by pincode:', error);
      }
    }
  };

  const [showCamera, setShowCamera] = useState(false);
  const [currentCaptureField, setCurrentCaptureField] = useState(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const cameraRef = useRef(null);

  // Map marker state
  const [showMapMarker, setShowMapMarker] = useState(false);
  const [landAreaData, setLandAreaData] = useState(null);


  useEffect(() => {
    (async () => {
      const locationStatus = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(locationStatus.status === 'granted');
    })();
  }, []);

  // Auto scroll when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Function to get captured images for map
  // Add this function after your existing state declarations
  // Add this function after your existing state declarations
  const getCapturedImagesForMap = () => {
    const images = {};
    for (let i = 1; i <= 8; i++) {
      if (form[`landImage${i}`]) {
        images[`landImage${i}`] = form[`landImage${i}`];
        images[`landImage${i}Gps`] = form[`landImage${i}Gps`];
      }
    }
    return images;
  };

  const pickImage = async (field, useCamera = false) => {
    try {
      let result;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled) {
        setForm(prev => ({ ...prev, [field]: result.assets[0].uri }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      console.error(error);
    }
  };

  const captureLandImage = async (imageIndex) => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture land images.');
        return;
      }
    }

    if (!locationPermission) {
      Alert.alert('Permission Denied', 'Location permission is required for geo-tagging land images.');
      return;
    }

    if (!form.name || !form.village || !form.tehsil || !form.district || !form.state) {
      Alert.alert(
        'Information Required',
        'Please complete Step 1 (Personal Info) and Step 2 (Address Info) before capturing land images.'
      );
      return;
    }

    setCurrentCaptureField(`landImage${imageIndex}`);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);

      let location;
      let latitude, longitude, accuracy;

      // Check if location permission is granted
      if (!locationPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to capture GPS coordinates for your land images.',
          [{ text: 'OK', onPress: () => console.log('User acknowledged location permission requirement') }]
        );
        setLoading(false);
        return;
      }

      // Check if location services are enabled on the device
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [{ text: 'OK', onPress: () => console.log('User acknowledged location services disabled') }]
        );
        setLoading(false);
        return;
      }

      // Try to get location with proper error handling
      try {
        console.log('📍 Acquiring GPS location...');
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Changed from Highest to fix timeout issues
          timeout: 15000, // Longer timeout for better GPS acquisition
          maximumAge: 0 // Don't use cached location
        });

        latitude = location.coords.latitude;
        longitude = location.coords.longitude;
        accuracy = location.coords.accuracy;
        
        console.log(`✅ GPS Lock: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy}m)`);

        if (!latitude || !longitude) {
          throw new Error('Failed to acquire GPS coordinates');
        }
      } catch (locationError) {
        console.error('❌ Location error:', locationError);
        // Show user-friendly error message
        if (locationError.message.includes('unavailable')) {
          Alert.alert(
            'Location Unavailable', 
            'Unable to get current location. Please make sure location services are enabled and you have a clear view of the sky.',
            [{ text: 'OK', onPress: () => console.log('User acknowledged location error') }]
          );
        } else if (locationError.message.includes('permission')) {
          Alert.alert(
            'Permission Denied', 
            'Location permission was denied. Please enable it in your device settings.',
            [{ text: 'OK', onPress: () => console.log('User acknowledged permission error') }]
          );
        } else if (locationError.message.includes('timeout')) {
          Alert.alert(
            'Location Timeout', 
            'Took too long to get location. Please try again with better GPS signal.',
            [{ text: 'OK', onPress: () => console.log('User acknowledged location timeout') }]
          );
        } else {
          Alert.alert(
            'Location Error', 
            `Failed to get location: ${locationError.message}`,
            [{ text: 'OK', onPress: () => console.log('User acknowledged location error') }]
          );
        }
        setLoading(false);
        return;
      }

      console.log('📸 Capturing photo...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        throw new Error('Failed to capture photo');
      }

      console.log('✅ Photo captured:', photo.uri);

      const timestamp = new Date();

      console.log('🖼️ Processing image...');
      const processedUri = await processImage(photo.uri);

      if (!processedUri) {
        throw new Error('Failed to process image');
      }

      const gpsFieldName = `${currentCaptureField}Gps`;

      setForm(prev => ({
        ...prev,
        [currentCaptureField]: processedUri,
        [gpsFieldName]: {
          latitude,
          longitude,
          accuracy,
          timestamp: timestamp.toISOString(),
        },
      }));

      // Add to GPS Queue
      // currentCaptureField is like 'landImage1'
      const imageNum = currentCaptureField.replace('landImage', '');
      setGpsQueue(prev => [
        ...prev.filter(item => item.image !== `Image ${imageNum}`), // Remove if exists
        {
          image: `Image ${imageNum}`,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          accuracy: `±${accuracy.toFixed(1)}m`,
          timestamp: timestamp.toLocaleString('en-IN')
        }
      ].sort((a, b) => parseInt(a.image.split(' ')[1]) - parseInt(b.image.split(' ')[1])));

      setErrors(prev => ({ ...prev, landImages: undefined }));
      setShowCamera(false);
      setCurrentCaptureField(null);

      setSnackbar({
        show: true,
        message: `✅ Land Image ${imageNum} captured with GPS!`,
        type: 'success',
      });

      // Calculate image count including the current image
      const currentImageIndex = parseInt(imageNum);
      const existingImageCount = [1, 2, 3, 4, 5, 6, 7, 8].filter(
        i => i !== currentImageIndex && form[`landImage${i}`] != null && form[`landImage${i}`] !== ''
      ).length;
      const totalImageCount = existingImageCount + 1; // +1 for the current image

      // Auto-open map marker when 4+ images are captured
      if (totalImageCount >= 4 && !landAreaData) {
        setTimeout(() => {
          Alert.alert(
            '🎉 Images Captured!',
            `You have captured ${totalImageCount} images with GPS data. Would you like to automatically draw the land boundary on the map?`,
            [
              {
                text: 'Later',
                style: 'cancel',
              },
              {
                text: 'Draw Now',
                onPress: () => {
                  setShowMapMarker(true);
                },
              },
            ],
            { cancelable: false }
          );
        }, 1000);
      }

      console.log('🎉 SUCCESS! Geo-tagged image saved');

    } catch (error) {
      console.error('❌ Capture failed:', error);
      Alert.alert(
        'Capture Failed',
        error.message || 'Failed to capture geo-tagged image. Please ensure GPS is enabled and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));

    // Clear crop/season errors immediately when value is selected
    if (field === 'cropName') {
      setErrors(prev => ({ ...prev, cropName: undefined }));
    }
    if (field === 'cropSeason') {
      setErrors(prev => ({ ...prev, cropSeason: undefined }));
    }
  };

  // Step-specific validation function
  const validateCurrentStep = () => {
    const errs = {};

    // Step 1: Personal Information
    if (currentStep === 1) {
      if (!form.name || form.name.trim().length < 3) {
        errs.name = 'Name must be at least 3 characters';
      }
      if (!form.aadhaarNumber || !/^\d{12}$/.test(form.aadhaarNumber)) {
        errs.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
      }
      if (!form.mobileNumber || !/^[6-9]\d{9}$/.test(form.mobileNumber)) {
        errs.mobileNumber = 'Enter valid 10-digit mobile number';
      }
      if (!form.dob || !/^\d{2}\/\d{2}\/\d{4}$/.test(form.dob)) {
        errs.dob = 'Enter valid DOB (DD/MM/YYYY)';
      }
    }

    // Step 2: Address Information
    else if (currentStep === 2) {
      if (!form.village || form.village.trim().length < 2) {
        errs.village = 'Village name is required';
      }
      if (!form.tehsil || form.tehsil.trim().length < 2) {
        errs.tehsil = 'Tehsil name is required';
      }
      if (!form.district || form.district.trim().length < 2) {
        errs.district = 'District name is required';
      }
      if (!form.state) {
        errs.state = 'Please select a state';
      }
      if (!form.pincode || !/^\d{6}$/.test(form.pincode)) {
        errs.pincode = 'Enter valid 6-digit Pincode';
      }
    }

    // Step 3: Crop Information
    else if (currentStep === 3) {
      if (!form.cropName || form.cropName.trim().length === 0) {
        errs.cropName = 'Please select a crop';
      }
      if (!form.cropSeason || form.cropSeason.trim().length === 0) {
        errs.cropSeason = 'Please select crop season';
      }
      if (!form.soilType || form.soilType.trim().length === 0) {
        errs.soilType = 'Please select soil type';
      }
      if (!form.irrigationMethod || form.irrigationMethod.trim().length === 0) {
        errs.irrigationMethod = 'Please select irrigation method';
      }
      if (!form.landRecordKhasra || form.landRecordKhasra.trim().length < 1) {
        errs.landRecordKhasra = 'Khasra number is required';
      }
    }

    // Step 4: Banking Information
    else if (currentStep === 4) {
      if (!form.bankName || form.bankName.trim().length < 3) {
        errs.bankName = 'Bank name is required';
      }
      if (!form.branchName || form.branchName.trim().length < 2) {
        errs.branchName = 'Branch name is required';
      }
      if (!form.bankAccountNo || !/^\d{9,18}$/.test(form.bankAccountNo)) {
        errs.bankAccountNo = 'Account number must be 9-18 digits';
      }
      if (!form.bankIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.bankIfsc)) {
        errs.bankIfsc = 'Invalid IFSC code (e.g., SBIN0001234)';
      }
    }

    // Step 5: Documents and Land Images
    else if (currentStep === 5) {
      const docFields = [
        'satbaraImage', 
        'patwariMapImage', 
        'aadhaarCardImage', 
        'bankPassbookImage', 
        'sowingCertificate'
      ];
      let missingDocs = 0;
      docFields.forEach(field => {
        if (!form[field]) missingDocs++;
      });

      if (missingDocs > 0) {
        errs.documents = `Please upload all ${missingDocs} required document(s)`;
      }

      const landImageCount = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => form[`landImage${i}`]).length;

      if (landImageCount < 4) {
        errs.landImages = `At least 4 land images are required (${landImageCount}/4 captured)`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Validate and move to next step
  const validateAndNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    } else {
      setSnackbar({
        show: true,
        message: 'Please fix all errors in the current section before proceeding',
        type: 'error'
      });
      // Scroll to top to show errors
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const validate = () => {
    const errs = {};

    if (!form.name || form.name.trim().length < 3) {
      errs.name = 'Name must be at least 3 characters';
    }
    if (!form.aadhaarNumber || !/^\d{12}$/.test(form.aadhaarNumber)) {
      errs.aadhaarNumber = 'Aadhaar must be exactly 12 digits';
    }
    if (!form.mobileNumber || !/^[6-9]\d{9}$/.test(form.mobileNumber)) {
      errs.mobileNumber = 'Enter valid 10-digit mobile number';
    }
    if (!form.dob || !/^\d{2}\/\d{2}\/\d{4}$/.test(form.dob)) {
      errs.dob = 'Enter valid DOB (DD/MM/YYYY)';
    }

    if (!form.village || form.village.trim().length < 2) {
      errs.village = 'Village name is required';
    }
    if (!form.tehsil || form.tehsil.trim().length < 2) {
      errs.tehsil = 'Tehsil name is required';
    }
    if (!form.district || form.district.trim().length < 2) {
      errs.district = 'District name is required';
    }
    if (!form.state) {
      errs.state = 'Please select a state';
    }
    if (!form.pincode || !/^\d{6}$/.test(form.pincode)) {
      errs.pincode = 'Enter valid 6-digit Pincode';
    }

    if (!form.cropName || form.cropName.trim().length === 0) {
      errs.cropName = 'Please select a crop';
    }
    if (!form.cropSeason || form.cropSeason.trim().length === 0) {
      errs.cropSeason = 'Please select crop season';
    }
    if (!form.soilType || form.soilType.trim().length === 0) {
      errs.soilType = 'Please select soil type';
    }
    if (!form.irrigationMethod || form.irrigationMethod.trim().length === 0) {
      errs.irrigationMethod = 'Please select irrigation method';
    }

    if (!form.landRecordKhasra || form.landRecordKhasra.trim().length < 1) {
      errs.landRecordKhasra = 'Khasra number is required';
    }

    if (!form.bankName || form.bankName.trim().length < 3) {
      errs.bankName = 'Bank name is required';
    }
    if (!form.branchName || form.branchName.trim().length < 2) {
      errs.branchName = 'Branch name is required';
    }
    if (!form.bankAccountNo || !/^\d{9,18}$/.test(form.bankAccountNo)) {
      errs.bankAccountNo = 'Account number must be 9-18 digits';
    }
    if (!form.bankIfsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.bankIfsc)) {
      errs.bankIfsc = 'Invalid IFSC code (e.g., SBIN0001234)';
    }

    const docFields = [
      'satbaraImage', 
      'patwariMapImage', 
      'aadhaarCardImage', 
      'bankPassbookImage', 
      'sowingCertificate'
    ];
    let missingDocs = 0;
    docFields.forEach(field => {
      if (!form[field]) missingDocs++;
    });

    if (missingDocs > 0) {
      errs.documents = `Please upload all ${missingDocs} required document(s)`;
    }

    const landImageCount = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => form[`landImage${i}`]).length;

    if (landImageCount < 4) {
      errs.landImages = `At least 4 land images are required (${landImageCount}/4 captured)`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbar({
        show: true,
        message: 'Please fix all errors before submitting',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      if (__DEV__) {
        testServerConnection().catch(err => {
          console.warn('⚠️ Server connection test failed (non-blocking):', err.message);
        });
      }

      const formData = new FormData();

      // Explicit mapping to Backend camelCase fields
      formData.append('name', form.name);
      formData.append('mobileNumber', form.mobileNumber);
      formData.append('aadhaarNumber', form.aadhaarNumber);
      formData.append('dob', form.dob);
      formData.append('gender', form.gender);
      formData.append('casteCategory', form.casteCategory);
      formData.append('farmerType', form.farmerType);
      formData.append('farmerCategory', form.farmerCategory);
      formData.append('loaneeStatus', form.loaneeStatus);

      formData.append('village', form.village);
      formData.append('tehsil', form.tehsil);
      formData.append('district', form.district);
      formData.append('state', form.state);
      formData.append('pincode', form.pincode);
      formData.append('fullAddress', form.fullAddress);

      formData.append('cropName', form.cropName);
      formData.append('cropVariety', form.cropVariety);
      formData.append('cropSeason', form.cropSeason);
      formData.append('cropType', 'Agriculture'); // Default value

      formData.append('soilType', form.soilType);
      formData.append('irrigationMethod', form.irrigationMethod);

      formData.append('insuranceUnit', form.insuranceUnit);
      formData.append('farmSize', String(form.farmSize));

      formData.append('landRecordKhasra', form.landRecordKhasra);
      formData.append('landRecordKhatauni', form.landRecordKhatauni || '');
      formData.append('surveyNumber', form.surveyNumber || '');

      // Append manual land area size if no map data is available
      if (!landAreaData && form.landAreaSize) {
        formData.append('landAreaSize', form.landAreaSize);
      }

      formData.append('bankName', form.bankName);
      formData.append('branchName', form.branchName);
      formData.append('bankAccountNo', form.bankAccountNo);
      formData.append('bankIfsc', form.bankIfsc);

      formData.append('insuranceLinked', form.insuranceLinked === 'Yes');
      formData.append('consentGranted', 'true'); // Implicit consent

      // Images
      if (form.satbaraImage) {
        formData.append('satbaraImage', {
          uri: form.satbaraImage,
          name: 'satbara.jpg',
          type: 'image/jpeg'
        });
      }

      if (form.patwariMapImage) {
        formData.append('patwariMapImage', {
          uri: form.patwariMapImage,
          name: 'patwari.jpg',
          type: 'image/jpeg'
        });
      }

      if (form.aadhaarCardImage) {
        formData.append('aadhaarCardImage', {
          uri: form.aadhaarCardImage,
          name: 'aadhaar.jpg',
          type: 'image/jpeg'
        });
      }

      if (form.bankPassbookImage) {
        formData.append('bankPassbookImage', {
          uri: form.bankPassbookImage,
          name: 'passbook.jpg',
          type: 'image/jpeg'
        });
      }

      if (form.sowingCertificate) {
        formData.append('sowingCertificate', {
          uri: form.sowingCertificate,
          name: 'sowing_cert.jpg',
          type: 'image/jpeg'
        });
      }

      // Land Images & GPS
      for (let i = 1; i <= 8; i++) {
        const key = `landImage${i}`;
        const gpsKey = `landImage${i}Gps`;

        if (form[key]) {
          formData.append(`landImage${i}`, {
            uri: form[key],
            name: `landImage${i}.jpg`,
            type: 'image/jpeg'
          });
        }

        if (form[gpsKey]) {
          formData.append(`landImage${i}Gps`, JSON.stringify(form[gpsKey]));
        }
      }

      // Removed gps_queue since backend doesn't use it

      // Append land area data if exists
      if (landAreaData) {
        formData.append('landAreaSize', landAreaData.area.toString());
        formData.append('latitude', landAreaData.coordinates?.[0]?.[0]?.toString() || '');
        formData.append('longitude', landAreaData.coordinates?.[0]?.[1]?.toString() || '');
      }

      // Get API URL
      const API_URL = getApiUrl(API_ENDPOINTS.REGISTER_FARMER);

      console.log('🌐 Making request to:', API_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // 60s timeout for slower networks/emulators

      console.log('📤 Sending request to:', API_URL);
      console.log('📤 Request method:', 'POST');
      console.log('📤 FormData details: Has files:', !!form.satbaraImage || !!form.patwariMapImage);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Let fetch auto-set Content-Type with boundary
          // 'Content-Type': 'multipart/form-data'
        }
      });

      clearTimeout(timeoutId);

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      const json = await response.json();
      console.log('📡 Response data:', json);

      if (response.ok) {
        // Backend returns success message and instructions
        setSnackbar({
          show: true,
          message: 'Registration successful! Please login to continue.',
          type: 'success'
        });

        // Navigate to Login Option after delay
        setTimeout(() => {
          navigation.navigate('LoginviaMobile'); // Or LoginSelect
        }, 1500);
      } else {
        setSnackbar({
          show: true,
          message: json.message || 'Registration failed. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('❌ Registration error type:', typeof error);
      console.error('❌ Registration error:', error);
      console.error('❌ Registration error message:', error.message);
      console.error('❌ Registration error stack:', error.stack);
      console.error('❌ Registration error name:', error.name);
      
      // Check for specific error types
      if (error.name === 'AbortError') {
        console.error('❌ Request aborted due to timeout');
        setSnackbar({
          show: true,
          message: 'Request timed out. Please check your network connection and try again.',
          type: 'error'
        });
      } else if (error.name === 'TypeError') {
        console.error('❌ TypeError - likely network connectivity issue');
        setSnackbar({
          show: true,
          message: 'Network request failed. Please check your internet connection and try again.',
          type: 'error'
        });
      } else {
        setSnackbar({
          show: true,
          message: error.message || 'Network error during registration.',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4, 5].map((step, index) => (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[
                styles.stepCircle, 
                currentStep >= step && styles.stepCircleActive,
                currentStep === step && styles.stepCircleCurrent
              ]}>
                {currentStep > step ? (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                    {step}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepLabel, 
                currentStep >= step && styles.stepLabelActive
              ]}>
                {step === 1 ? 'Personal' : step === 2 ? 'Address' : step === 3 ? 'Crop' : step === 4 ? 'Bank' : 'Land'}
              </Text>
            </View>
            {index < 4 && (
              <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View>
      <Text style={styles.sectionTitle}>📋 Personal Information</Text>

      <TextInput
        label="Full Name *"
        placeholder="Enter your full name"
        value={form.name}
        onChangeText={v => handleChange('name', v)}
        mode="outlined"
        error={!!errors.name}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="person-outline" {...props} />} />}
      />
      <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>

      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TextInput
            label="Aadhaar Number *"
            placeholder="12-digit Aadhaar"
            value={form.aadhaarNumber}
            onChangeText={v => handleChange('aadhaarNumber', v.replace(/[^0-9]/g, '').slice(0, 12))}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.aadhaarNumber}
            style={styles.input}
            left={<TextInput.Icon icon={props => <Ionicons name="card-outline" {...props} />} />}
            maxLength={12}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            label="Mobile Number *"
            placeholder="10-digit mobile"
            value={form.mobileNumber}
            onChangeText={v => handleChange('mobileNumber', v.replace(/[^0-9]/g, '').slice(0, 10))}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.mobileNumber}
            style={styles.input}
            left={<TextInput.Icon icon={props => <Ionicons name="call-outline" {...props} />} />}
            maxLength={10}
          />
        </View>
      </View>
      <View style={styles.row}>
        <HelperText type="error" visible={!!errors.aadhaarNumber} style={{ flex: 1 }}>{errors.aadhaarNumber}</HelperText>
        <HelperText type="error" visible={!!errors.mobileNumber} style={{ flex: 1 }}>{errors.mobileNumber}</HelperText>
      </View>

      <TextInput
        label="Date of Birth (DD/MM/YYYY) *"
        placeholder="DD/MM/YYYY"
        value={form.dob}
        onChangeText={v => handleChange('dob', v)}
        mode="outlined"
        error={!!errors.dob}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="calendar-outline" {...props} />} />}
      />
      <HelperText type="error" visible={!!errors.dob}>{errors.dob}</HelperText>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Gender *</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('gender', v)}
          value={form.gender}
        >
          <View style={styles.radioRow}>
            <View style={styles.radioItem}>
              <RadioButton value="Male" color={Colors.primary} />
              <Text>Male</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="Female" color={Colors.primary} />
              <Text>Female</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="Other" color={Colors.primary} />
              <Text>Other</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Caste Category *</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('casteCategory', v)}
          value={form.casteCategory}
        >
          <View style={styles.radioRowWrap}>
            {['General', 'OBC', 'SC', 'ST'].map(caste => (
              <View key={caste} style={styles.radioItem}>
                <RadioButton value={caste} color={Colors.primary} />
                <Text>{caste}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
      </View>
    </View>
  );

  const renderAddressInfo = () => (
    <View>
      <Text style={styles.sectionTitle}>📍 Address Information</Text>

      <Menu
        visible={stateMenuVisible}
        onDismiss={() => setStateMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setStateMenuVisible(!stateMenuVisible)}>
            <Surface style={[styles.menuButton, errors.state && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="location" size={20} color={Colors.primaryDark} style={{ marginRight: 12 }} />
                <Text style={styles.menuButtonText}>
                  {form.state || 'Select State *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {indianStates.map(state => (
            <Menu.Item
              key={state}
              onPress={() => {
                handleChange('state', state);
                setStateMenuVisible(false);
              }}
              title={state}
            />
          ))}
        </ScrollView>
      </Menu>

      <HelperText type="error" visible={!!errors.state}>{errors.state}</HelperText>

      {/* District Dropdown */}
      <Menu
        visible={districtMenuVisible}
        onDismiss={() => setDistrictMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setDistrictMenuVisible(true)}>
            <Surface style={[styles.menuButton, errors.district && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="business-outline" size={20} color={Colors.primaryDark} style={{ marginRight: 12 }} />
                <Text style={styles.menuButtonText}>
                  {form.district || 'Select District *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {districts.map(district => (
            <Menu.Item
              key={district}
              onPress={() => {
                handleChange('district', district);
                setDistrictMenuVisible(false);
              }}
              title={district}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.district}>{errors.district}</HelperText>

      {/* Tehsil Dropdown */}
      <Menu
        visible={tehsilMenuVisible}
        onDismiss={() => setTehsilMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setTehsilMenuVisible(true)}>
            <Surface style={[styles.menuButton, errors.tehsil && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="map-outline" size={20} color={Colors.primaryDark} style={{ marginRight: 12 }} />
                <Text style={styles.menuButtonText}>
                  {form.tehsil || 'Select Tehsil *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {tehsils.map(tehsil => (
            <Menu.Item
              key={tehsil}
              onPress={() => {
                handleChange('tehsil', tehsil);
                setTehsilMenuVisible(false);
              }}
              title={tehsil}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.tehsil}>{errors.tehsil}</HelperText>

      {/* Village Dropdown */}
      <Menu
        visible={villageMenuVisible}
        onDismiss={() => setVillageMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setVillageMenuVisible(true)}>
            <Surface style={[styles.menuButton, errors.village && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="home-outline" size={20} color={Colors.primaryDark} style={{ marginRight: 12 }} />
                <Text style={styles.menuButtonText}>
                  {form.village || 'Select Village *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {villages.map(village => (
            <Menu.Item
              key={village}
              onPress={() => {
                handleChange('village', village);
                setVillageMenuVisible(false);
              }}
              title={village}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.village}>{errors.village}</HelperText>

      {/* Pincode with auto-location */}
      <TextInput
        label="Pincode *"
        placeholder="6-digit Pincode"
        value={form.pincode}
        onChangeText={v => handlePincodeChange(v.replace(/[^0-9]/g, '').slice(0, 6))}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.pincode}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="location-outline" {...props} />} />}
        maxLength={6}
      />
      <HelperText type="error" visible={!!errors.pincode}>{errors.pincode}</HelperText>

      <TextInput
        label="Full Address"
        placeholder="Enter complete address including house number, street, etc."
        value={form.fullAddress}
        onChangeText={v => handleChange('fullAddress', v)}
        mode="outlined"
        error={!!errors.fullAddress}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="document-text-outline" {...props} />} />}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
      <HelperText type="error" visible={!!errors.fullAddress}>{errors.fullAddress}</HelperText>

      <TextInput
        label="Khasra Number *"
        placeholder="Enter Khasra number"
        value={form.landRecordKhasra}
        onChangeText={v => handleChange('landRecordKhasra', v)}
        mode="outlined"
        error={!!errors.landRecordKhasra}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="document-text-outline" {...props} />} />}
      />
      <HelperText type="error" visible={!!errors.landRecordKhasra}>{errors.landRecordKhasra}</HelperText>
    </View>
  );

  const renderCropInfo = () => (
    <View>
      <Text style={styles.sectionTitle}>🌾 Crop & Farmer Information</Text>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Farmer Type *</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('farmerType', v)}
          value={form.farmerType}
        >
          <View style={styles.radioRow}>
            {['Small', 'Marginal', 'Others'].map(type => (
              <View key={type} style={styles.radioItem}>
                <RadioButton value={type} color={Colors.primary} />
                <Text>{type}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
      </View>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Farmer Category *</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('farmerCategory', v)}
          value={form.farmerCategory}
        >
          <View style={styles.radioRow}>
            {['Owner', 'Tenant', 'Sharecropper'].map(cat => (
              <View key={cat} style={styles.radioItem}>
                <RadioButton value={cat} color={Colors.primary} />
                <Text style={{ fontSize: 12 }}>{cat}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
      </View>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Loanee Status *</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('loaneeStatus', v)}
          value={form.loaneeStatus}
        >
          <View style={styles.radioRow}>
            <View style={styles.radioItem}>
              <RadioButton value="Yes" color={Colors.primary} />
              <Text>Yes (Loanee)</Text>
            </View>
            <View style={styles.radioItem}>
              <RadioButton value="No" color={Colors.primary} />
              <Text>No (Non-Loanee)</Text>
            </View>
          </View>
        </RadioButton.Group>
      </View>

      <Divider style={{ marginVertical: 10 }} />

      <Menu
        visible={cropMenuVisible}
        onDismiss={() => setCropMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={() => {
              setCropMenuVisible(true);
              setSeasonMenuVisible(false);
            }}
          >
            <Surface style={[styles.menuButton, errors.cropName && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="leaf" size={20} color={Colors.primary} style={{ marginRight: 12 }} />
                <Text style={[
                  styles.menuButtonText,
                  !form.cropName && styles.menuButtonPlaceholder
                ]}>
                  {form.cropName || 'Select Crop *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {cropList.map(crop => (
            <Menu.Item
              key={crop}
              onPress={() => {
                handleChange('cropName', crop);
                setCropMenuVisible(false);
              }}
              title={crop}
              titleStyle={form.cropName === crop ? styles.selectedMenuItem : null}
            />
          ))}
        </ScrollView>
      </Menu>

      <HelperText type="error" visible={!!errors.cropName}>{errors.cropName}</HelperText>

      <Menu
        visible={seasonMenuVisible}
        onDismiss={() => setSeasonMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={() => {
              setSeasonMenuVisible(true);
              setCropMenuVisible(false);
            }}
          >
            <Surface style={[styles.menuButton, errors.cropSeason && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="calendar" size={20} color={Colors.secondary} style={{ marginRight: 12 }} />
                <Text style={[
                  styles.menuButtonText,
                  !form.cropSeason && styles.menuButtonPlaceholder
                ]}>
                  {form.cropSeason || 'Select Crop Season *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {cropSeasons.map(season => (
            <Menu.Item
              key={season}
              onPress={() => {
                handleChange('cropSeason', season);
                setSeasonMenuVisible(false);
              }}
              title={season}
              titleStyle={form.cropSeason === season ? styles.selectedMenuItem : null}
            />
          ))}
        </ScrollView>
      </Menu>

      <HelperText type="error" visible={!!errors.cropSeason}>{errors.cropSeason}</HelperText>

      {/* Soil Type Dropdown */}
      <Menu
        visible={soilTypeMenuVisible}
        onDismiss={() => setSoilTypeMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={() => {
              setSoilTypeMenuVisible(true);
              setCropMenuVisible(false);
              setSeasonMenuVisible(false);
              setIrrigationMenuVisible(false);
            }}
          >
            <Surface style={[styles.menuButton, errors.soilType && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="earth" size={20} color={Colors.primary} style={{ marginRight: 12 }} />
                <Text style={[
                  styles.menuButtonText,
                  !form.soilType && styles.menuButtonPlaceholder
                ]}>
                  {form.soilType || 'Select Soil Type *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {SOIL_TYPES.map(soil => (
            <Menu.Item
              key={soil}
              onPress={() => {
                handleChange('soilType', soil);
                setSoilTypeMenuVisible(false);
              }}
              title={soil}
              titleStyle={form.soilType === soil ? styles.selectedMenuItem : null}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.soilType}>{errors.soilType}</HelperText>

      {/* Irrigation Method Dropdown */}
      <Menu
        visible={irrigationMenuVisible}
        onDismiss={() => setIrrigationMenuVisible(false)}
        anchor={
          <TouchableOpacity
            onPress={() => {
              setIrrigationMenuVisible(true);
              setSoilTypeMenuVisible(false);
              setCropMenuVisible(false);
              setSeasonMenuVisible(false);
            }}
          >
            <Surface style={[styles.menuButton, errors.irrigationMethod && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="water" size={20} color={Colors.secondary} style={{ marginRight: 12 }} />
                <Text style={[
                  styles.menuButtonText,
                  !form.irrigationMethod && styles.menuButtonPlaceholder
                ]}>
                  {form.irrigationMethod || 'Select Irrigation Method *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {IRRIGATION_METHODS.map(method => (
            <Menu.Item
              key={method}
              onPress={() => {
                handleChange('irrigationMethod', method);
                setIrrigationMenuVisible(false);
              }}
              title={method}
              titleStyle={form.irrigationMethod === method ? styles.selectedMenuItem : null}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.irrigationMethod}>{errors.irrigationMethod}</HelperText>

      <TextInput
        label="Crop Variety"
        placeholder="Enter crop variety (e.g., Pusa 1121)"
        value={form.cropVariety}
        onChangeText={v => handleChange('cropVariety', v)}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="leaf-outline" {...props} />} />}
      />

      <TextInput
        label="Insurance Unit"
        placeholder="Enter insurance unit"
        value={form.insuranceUnit}
        onChangeText={v => handleChange('insuranceUnit', v)}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="shield-checkmark-outline" {...props} />} />}
      />

      <TextInput
        label="Land Area Size (in hectares)"
        placeholder="Enter land area size"
        value={form.landAreaSize}
        onChangeText={v => handleChange('landAreaSize', v.replace(/[^0-9.]/g, ''))}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="map-outline" {...props} />} />}
      />

      <TextInput
        label="Farm Size (in hectares)"
        placeholder="Enter farm size"
        value={form.farmSize}
        onChangeText={v => handleChange('farmSize', v.replace(/[^0-9.]/g, ''))}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="home-outline" {...props} />} />}
      />

      <TextInput
        label="Khatauni Number (Optional)"
        placeholder="Enter Khatauni number"
        value={form.landRecordKhatauni}
        onChangeText={v => handleChange('landRecordKhatauni', v)}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="document-outline" {...props} />} />}
      />

      <TextInput
        label="Survey Number (Optional)"
        placeholder="Enter Survey number"
        value={form.surveyNumber}
        onChangeText={v => handleChange('surveyNumber', v)}
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="locate-outline" {...props} />} />}
      />
    </View>
  );

  const renderBankingInfo = () => (
    <View>
      <Text style={styles.sectionTitle}>🏦 Banking Information</Text>

      <Menu
        visible={bankMenuVisible}
        onDismiss={() => setBankMenuVisible(false)}
        anchor={
          <TouchableOpacity onPress={() => setBankMenuVisible(true)}>
            <Surface style={[styles.menuButton, errors.bankName && styles.menuButtonError]}>
              <View style={styles.menuButtonContent}>
                <Ionicons name="business-outline" size={20} color={Colors.primaryDark} style={{ marginRight: 12 }} />
                <Text style={styles.menuButtonText}>
                  {form.bankName || 'Select Bank *'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
              </View>
            </Surface>
          </TouchableOpacity>
        }
        contentStyle={styles.menuContent}
      >
        <ScrollView style={styles.menuScroll}>
          {INDIAN_BANKS.map(bank => (
            <Menu.Item
              key={bank}
              onPress={() => {
                handleChange('bankName', bank);
                setBankMenuVisible(false);
              }}
              title={bank}
            />
          ))}
        </ScrollView>
      </Menu>
      <HelperText type="error" visible={!!errors.bankName}>{errors.bankName}</HelperText>

      <TextInput
        label="Branch Name *"
        placeholder="Enter branch name"
        value={form.branchName}
        onChangeText={v => handleChange('branchName', v)}
        mode="outlined"
        error={!!errors.branchName}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="location-outline" {...props} />} />}
      />
      <HelperText type="error" visible={!!errors.branchName}>{errors.branchName}</HelperText>

      <TextInput
        label="Account Number *"
        placeholder="Enter account number"
        value={form.bankAccountNo}
        onChangeText={v => handleChange('bankAccountNo', v.replace(/[^0-9]/g, ''))}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.bankAccountNo}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="card-outline" {...props} />} />}
      />
      <HelperText type="error" visible={!!errors.bankAccountNo}>{errors.bankAccountNo}</HelperText>

      <TextInput
        label="IFSC Code *"
        placeholder="e.g., SBIN0001234"
        value={form.bankIfsc}
        onChangeText={v => handleChange('bankIfsc', v.toUpperCase())}
        mode="outlined"
        error={!!errors.bankIfsc}
        style={styles.input}
        left={<TextInput.Icon icon={props => <Ionicons name="barcode-outline" {...props} />} />}
        maxLength={11}
        autoCapitalize="characters"
      />
      <HelperText type="error" visible={!!errors.bankIfsc}>{errors.bankIfsc}</HelperText>

      <View style={styles.radioSection}>
        <Text style={styles.radioLabel}>Is crop insurance linked to your account?</Text>
        <RadioButton.Group
          onValueChange={v => handleChange('insuranceLinked', v)}
          value={form.insuranceLinked}
        >
          <View style={styles.radioRow}>
            <RadioButton.Item label="Yes" value="Yes" mode="android" />
            <RadioButton.Item label="No" value="No" mode="android" />
          </View>
        </RadioButton.Group>
      </View>
    </View>
  );

  const renderDocuments = () => (
    <View>
      <Text style={styles.sectionTitle}>📄 Land Documents</Text>
      <HelperText type="info" visible={true}>
        Upload clear photos of your land documents. Both documents are required.
      </HelperText>

      {errors.documents && (
        <Surface style={styles.errorSurface}>
          <Text style={styles.errorText}>{errors.documents}</Text>
        </Surface>
      )}

      {[
        { label: '7/12 Extract (Satbara)', field: 'satbaraImage', icon: 'file-document-outline' },
        { label: 'Patwari Map (Signed)', field: 'patwariMapImage', icon: 'map-outline' },
        { label: 'Aadhar Card Photo', field: 'aadhaarCardImage', icon: 'card-account-details-outline' },
        { label: 'Bank Passbook Photo', field: 'bankPassbookImage', icon: 'book-open-outline' },
        { label: 'Sowing Certificate', field: 'sowingCertificate', icon: 'certificate-outline' },
      ].map(({ label, field, icon }) => (
        <Surface key={field} style={styles.documentCard} elevation={1}>
          <View style={styles.documentHeader}>
            <View style={styles.documentIconWrapper}>
              <MaterialCommunityIcons name={icon} size={24} color={Colors.primary} />
            </View>
            <Text style={styles.documentLabel}>{label}</Text>
          </View>

          {form[field] ? (
            <View style={styles.uploadedContainer}>
              <Chip icon="check-circle" mode="flat" style={styles.uploadedChip}>
                Uploaded
              </Chip>
              <Button
                mode="outlined"
                icon="refresh"
                onPress={() => pickImage(field, false)}
                compact
              >
                Change
              </Button>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                icon="camera"
                onPress={() => pickImage(field, true)}
                style={styles.uploadButton}
                compact
              >
                Camera
              </Button>
              <Button
                mode="contained-tonal"
                icon="folder-image"
                onPress={() => pickImage(field, false)}
                style={styles.uploadButton}
                compact
              >
                Gallery
              </Button>
            </View>
          )}
        </Surface>
      ))}
    </View>
  );

  const renderGPSQueue = () => {
    if (gpsQueue.length === 0) return null;

    return (
      <Surface style={styles.gpsQueueCard} elevation={2}>
        <View style={styles.gpsQueueHeader}>
          <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#2e7d32" />
          <Text style={styles.gpsQueueTitle}>GPS Location Queue</Text>
        </View>

        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.tableCell1}>Image</DataTable.Title>
            <DataTable.Title style={styles.tableCell2}>Latitude</DataTable.Title>
            <DataTable.Title style={styles.tableCell3}>Longitude</DataTable.Title>
          </DataTable.Header>

          {gpsQueue.map((item, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell style={styles.tableCell1}>{item.image}</DataTable.Cell>
              <DataTable.Cell style={styles.tableCell2}>{item.latitude}</DataTable.Cell>
              <DataTable.Cell style={styles.tableCell3}>{item.longitude}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        <HelperText type="info" visible={true} style={styles.queueHelperText}>
          Total: {gpsQueue.length} images with GPS data captured
        </HelperText>
      </Surface>
    );
  };

  const renderLandImages = () => {
    const landImageCount = [1, 2, 3, 4, 5, 6, 7, 8].filter(i => form[`landImage${i}`]).length;

    return (
      <View>
        <Text style={styles.sectionTitle}>📸 Geo-Tagged Land Images</Text>
        <HelperText type="info" visible={true}>
          Capture 4-8 photos of your land with GPS location. Minimum 4 required.
        </HelperText>

        {/* Map-based Land Marking Button */}
        <Surface style={styles.mapMarkingCard} elevation={3}>
          <View style={styles.mapMarkingHeader}>
            <View style={styles.mapIconWrapper}>
              <MaterialCommunityIcons name="map-marker-radius" size={28} color="#1976d2" />
            </View>
            <View style={styles.mapMarkingContent}>
              <Text style={styles.mapMarkingTitle}>Mark Your Land on Map</Text>
              <Text style={styles.mapMarkingDescription}>
                Draw the exact boundary of your land using GPS coordinates
              </Text>
            </View>
          </View>

          {landAreaData && (
            <Chip
              icon="check-decagram"
              style={styles.mapMarkedChip}
              textStyle={styles.mapMarkedText}
            >
              Land Area Marked ✓
            </Chip>
          )}

          <Button
            mode={landAreaData ? "outlined" : "contained"}
            icon={landAreaData ? "pencil" : "map-marker-plus"}
            onPress={() => setShowMapMarker(true)}
            style={styles.openMapButton}
          >
            {landAreaData ? "Edit Land Boundary" : "Open Map & Mark Land"}
          </Button>
        </Surface>

        <Surface style={styles.landImageInfoCard} elevation={2}>
            <View style={styles.landImageInfoHeader}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.landImageInfoTitle}>Geo-Tag Camera</Text>
          </View>
          <Text style={styles.landImageInfoText}>
            Each photo will automatically include:
          </Text>
          <Text style={styles.landImageInfoBullet}>• GPS Coordinates (Lat/Lon)</Text>
          <Text style={styles.landImageInfoBullet}>• Date & Time Stamp</Text>
          <Text style={styles.landImageInfoBullet}>• Location Accuracy</Text>
        </Surface>

        {errors.landImages && (
          <Surface style={styles.errorSurface}>
            <Text style={styles.errorText}>{errors.landImages}</Text>
          </Surface>
        )}

        {renderGPSQueue()}

        <View style={styles.landImagesGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(index => (
            <Surface key={index} style={styles.landImageCard} elevation={1}>
              <View style={styles.landImageHeader}>
                <Text style={styles.landImageNumber}>Land Image {index}</Text>
                {index <= 4 && (
                  <Chip
                    icon={form[`landImage${index}`] ? "check-circle" : "alert-circle"}
                    style={[styles.landImageChip, !form[`landImage${index}`] && styles.requiredChip]}
                    compact
                  >
                    {form[`landImage${index}`] ? "Captured" : "Required"}
                  </Chip>
                )}
                {index > 4 && form[`landImage${index}`] && (
                  <Chip icon="check-circle" style={styles.landImageChip} compact>
                    Captured
                  </Chip>
                )}
              </View>

              {form[`landImage${index}`] ? (
                <View>
                  <Image
                    source={{ uri: form[`landImage${index}`] }}
                    style={styles.landImagePreview}
                    resizeMode="cover"
                  />
                  {form[`landImage${index}Gps`] && (
                    <View style={styles.gpsInfo}>
                      <Text style={styles.gpsText}>
                        📍 {form[`landImage${index}Gps`].latitude.toFixed(6)}, {form[`landImage${index}Gps`].longitude.toFixed(6)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.landImageActions}>
                    <Button
                      mode="outlined"
                      icon="camera-retake"
                      onPress={() => captureLandImage(index)}
                      compact
                      style={styles.retakeButton}
                    >
                      Retake
                    </Button>
                    <IconButton
                      icon="delete"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => {
                        setForm(prev => ({
                          ...prev,
                          [`landImage${index}`]: null,
                          [`landImage${index}Gps`]: null
                        }));
                        setGpsQueue(prev => prev.filter(item => item.image !== `Image ${index}`));
                      }}
                      iconColor="#d32f2f"
                    />
                  </View>
                </View>
              ) : (
                <Button
                  mode="contained"
                  icon="camera-plus"
                  onPress={() => captureLandImage(index)}
                  style={styles.captureButton}
                >
                  Capture with GPS
                </Button>
              )}
            </Surface>
          ))}
        </View>

        <Surface style={styles.landImageSummary} elevation={1}>
          <View style={styles.summaryIconWrapper}>
            <MaterialCommunityIcons name="image-multiple" size={24} color={Colors.primary} />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.landImageSummaryText}>
              {landImageCount} of 8 images captured
            </Text>
            <Text style={styles.landImageSummarySubtext}>
              Minimum 4 required • {landImageCount >= 4 ? '✓ Requirement met' : `${4 - landImageCount} more needed`}
            </Text>
          </View>
        </Surface>
      </View>
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="back"
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <View>
              <Text style={styles.cameraTitle}>
                {currentCaptureField ? currentCaptureField.replace(/_/g, ' ').toUpperCase() : 'Camera'}
              </Text>
              <Text style={styles.cameraSubtitle}>GPS Geo-Tagging Active</Text>
            </View>
            <IconButton
              icon="close"
              iconColor="#fff"
              size={28}
              onPress={() => {
                setShowCamera(false);
                setCurrentCaptureField(null);
              }}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.cameraInfo}>
            <Text style={styles.cameraInfoText}>Position camera to capture land photo</Text>
            <Text style={styles.cameraInfoText}>GPS location will be added automatically</Text>
            <Text style={styles.cameraInfoHighlight}>
              📍 High accuracy GPS tracking enabled
            </Text>
          </View>

          <View style={styles.cameraControls}>
            <Button
              mode="contained"
              icon="camera"
              onPress={takePicture}
              style={styles.captureBtn}
              labelStyle={styles.captureBtnLabel}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Capturing with GPS...' : 'Capture Photo'}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Text style={styles.title}>Farmer Registration</Text>
              <Text style={styles.subtitle}>Fill all required details carefully</Text>
            </View>

            {renderStepIndicator()}
            <Divider style={styles.divider} />

            {currentStep === 1 && renderPersonalInfo()}
            {currentStep === 2 && renderAddressInfo()}
            {currentStep === 3 && renderCropInfo()}
            {currentStep === 4 && renderBankingInfo()}
            {currentStep === 5 && (
              <>
                {renderDocuments()}
                {renderLandImages()}
              </>
            )}

            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <Button
                  mode="outlined"
                  onPress={() => setCurrentStep(prev => prev - 1)}
                  style={styles.navButton}
                  icon="chevron-left"
                >
                  Previous
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  mode="contained"
                  onPress={validateAndNextStep}
                  style={[styles.navButton, styles.nextButton]}
                  icon="chevron-right"
                  contentStyle={styles.nextButtonContent}
                >
                  Next
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={[styles.navButton, styles.submitButton]}
                  icon="check-circle"
                  disabled={loading}
                  loading={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Map Marker Modal */}
      {/* Map Marker Modal */}
      {/* Map Marker Modal */}
      {/* Map Marker Modal - ONLY OPENS WHEN BUTTON IS CLICKED */}
      <LandMapMarker
        visible={showMapMarker}
        onClose={() => setShowMapMarker(false)}
        onSave={(data) => {
          setLandAreaData(data);
          setShowMapMarker(false); // ADD THIS LINE
          setSnackbar({
            show: true,
            message: '✅ Land area marked successfully on map!',
            type: 'success',
          });
        }}
        initialData={landAreaData}
        capturedImages={showMapMarker ? getCapturedImagesForMap() : {}} // CHANGE THIS LINE
      />

      <Snackbar
        visible={snackbar.show}
        duration={snackbar.type === 'error' ? 4000 : 2000}
        onDismiss={() => setSnackbar({ ...snackbar, show: false })}
        style={[
          styles.snackbar,
          { backgroundColor: snackbar.type === 'error' ? '#d32f2f' : '#2e7d32' }
        ]}
        action={{
          label: 'Close',
          onPress: () => setSnackbar({ ...snackbar, show: false }),
        }}
      >
        {snackbar.message}
      </Snackbar>

      {loading && !showCamera && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator animating={true} size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 32,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  stepIndicatorContainer: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleCurrent: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },
  stepNumber: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepLabelActive: {
    color: Colors.primaryDark,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginTop: -16, // Align with center of circle
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#f1f5f9',
    height: 1.5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bdbdbd',
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  menuButtonError: {
    borderColor: '#d32f2f',
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
  },
  menuButtonPlaceholder: {
    color: '#9e9e9e',
  },
  menu: {
    marginTop: 50,
  },
  selectedMenuItem: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  menuScroll: {
    maxHeight: 250,
  },
  menuContent: {
    maxHeight: 300,
  },
  radioSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 14,
    color: '#424242',
    marginBottom: 8,
    fontWeight: '500',
  },
  radioRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  documentCard: {
    padding: 16,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentIconWrapper: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  documentLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    borderRadius: 12,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadedChip: {
    backgroundColor: Colors.primaryLight,
  },
  gpsQueueCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  gpsQueueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gpsQueueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 8,
  },
  tableCell1: {
    flex: 1,
  },
  tableCell2: {
    flex: 1.2,
  },
  tableCell3: {
    flex: 1.2,
  },
  queueHelperText: {
    marginTop: 8,
  },
  mapMarkingCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#eff6ff', // Light blue surface
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  mapMarkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapIconWrapper: {
    marginRight: 12,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
  },
  mapMarkingContent: {
    flex: 1,
  },
  mapMarkingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e40af', // Blue-800
    marginBottom: 4,
  },
  mapMarkingDescription: {
    fontSize: 13,
    color: '#3b82f6', // Blue-500
    lineHeight: 18,
    fontWeight: '500',
  },
  mapMarkedChip: {
    backgroundColor: '#dcfce7',
    marginBottom: 16,
    alignSelf: 'flex-start',
    borderRadius: 12,
  },
  mapMarkedText: {
    color: '#166534',
    fontWeight: '700',
  },
  openMapButton: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
  },
  landImageInfoCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  landImageInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconWrapper: {
    marginRight: 12,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  landImageInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  landImageInfoText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  landImageInfoBullet: {
    fontSize: 13,
    color: Colors.textMuted,
    marginLeft: 8,
    marginTop: 4,
    fontWeight: '500',
  },
  landImagesGrid: {
    marginTop: 8,
  },
  landImageCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  landImageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  landImageNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  landImageChip: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
  },
  requiredChip: {
    backgroundColor: '#fff7ed',
  },
  landImagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
  },
  gpsInfo: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gpsText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  landImageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  retakeButton: {
    flex: 1,
    borderRadius: 10,
  },
  captureButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
  },
  landImageSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: '#f1f5f9',
    gap: 12,
  },
  summaryIconWrapper: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    flex: 1,
  },
  landImageSummaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  landImageSummarySubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  errorSurface: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ffebee',
    marginVertical: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  navButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 6,
  },
  nextButton: {
    backgroundColor: Colors.primary,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
    height: 48,
  },
  submitButton: {
    backgroundColor: Colors.primaryDark,
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 16,
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraSubtitle: {
    fontSize: 14,
    color: '#4caf50',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cameraInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 20,
  },
  cameraInfoText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraInfoHighlight: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cameraControls: {
    paddingBottom: 40,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
  },
  captureBtn: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
  },
  captureBtnLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  radioRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
});

export default FarmerRegistrationScreen;
