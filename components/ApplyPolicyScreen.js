import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image, Modal, Platform, StatusBar, Dimensions
} from 'react-native';
import { TextInput, Checkbox, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_ENDPOINTS } from '../config/api.config';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

const { width } = Dimensions.get('window');

const SOIL_TYPES = [
    { id: "Alluvial", name: "Alluvial", icon: "leaf-outline", color: "#4ade80" },
    { id: "Black", name: "Black", icon: "cloud-outline", color: "#334155" },
    { id: "Red", name: "Red", icon: "flame-outline", color: "#ef4444" },
    { id: "Laterite", name: "Laterite", icon: "earth-outline", color: "#b45309" },
    { id: "Arid", name: "Arid", icon: "sunny-outline", color: "#eab308" },
    { id: "Mountain", name: "Mountain", icon: "image-outline", color: "#64748b" },
    { id: "Saline", name: "Saline", icon: "water-outline", color: "#0ea5e9" },
    { id: "Peaty", name: "Peaty", icon: "nutrition-outline", color: "#10b981" }
];

const IRRIGATION_METHODS = [
    { id: "Rain-fed", name: "Rain-fed", icon: "rainy-outline", color: "#3b82f6" },
    { id: "Canal", name: "Canal", icon: "boat-outline", color: "#0ea5e9" },
    { id: "Tube Well", name: "Tube Well", icon: "arrow-down-circle-outline", color: "#6366f1" },
    { id: "Drip", name: "Drip", icon: "water-outline", color: "#06b6d4" },
    { id: "Sprinkler", name: "Sprinkler", icon: "options-outline", color: "#8b5cf6" },
    { id: "Tank", name: "Tank", icon: "cube-outline", color: "#64748b" },
    { id: "Others", name: "Others", icon: "ellipsis-horizontal-circle-outline", color: "#94a3b8" }
];

const CROP_CATEGORIES = [
    { id: "Cereals", name: "Cereals", icon: "nutrition-outline", color: "#eab308" },
    { id: "Pulses", name: "Pulses", icon: "leaf-outline", color: "#22c55e" },
    { id: "Oilseeds", name: "Oilseeds", icon: "water-outline", color: "#f59e0b" },
    { id: "Commercial Crops", name: "Commercial Crops", icon: "cash-outline", color: "#16a34a" },
    { id: "Fruits", name: "Fruits", icon: "nutrition-outline", color: "#ef4444" },
    { id: "Vegetables", name: "Vegetables", icon: "leaf-outline", color: "#10b981" },
    { id: "Spices", name: "Spices", icon: "flame-outline", color: "#f97316" },
    { id: "Others", name: "Others", icon: "ellipsis-horizontal-circle-outline", color: "#64748b" }
];

const SEASONS = [
    { id: "Kharif", name: "Kharif", icon: "rainy-outline", color: "#22c55e" },
    { id: "Rabi", name: "Rabi", icon: "snow-outline", color: "#3b82f6" },
    { id: "Summer/Zaid", name: "Summer/Zaid", icon: "sunny-outline", color: "#eab308" },
    { id: "Perennial", name: "Perennial", icon: "calendar-outline", color: "#8b5cf6" }
];

const CROPS_BY_TYPE = {
    "Cereals": ["Wheat", "Rice", "Maize", "Bajra", "Jowar", "Barley", "Ragi"],
    "Pulses": ["Gram", "Tur (Arhar)", "Moong", "Urad", "Masur", "Peas"],
    "Oilseeds": ["Groundnut", "Mustard", "Soyabean", "Sunflower", "Sesame", "Castor"],
    "Commercial Crops": ["Cotton", "Sugarcane", "Jute", "Tobacco"],
    "Fruits": ["Mango", "Banana", "Citrus", "Apple", "Guava", "Grapes"],
    "Vegetables": ["Potato", "Onion", "Tomato", "Brinjal", "Cabbage", "Cauliflower"],
    "Spices": ["Chilli", "Turmeric", "Garlic", "Ginger", "Coriander"],
    "Others": ["Rubber", "Coffee", "Tea", "Other"]
};

const CROP_ICONS = {
    // Cereals
    "Wheat": "nutrition-outline",
    "Rice": "water-outline",
    "Maize": "leaf-outline",
    "Bajra": "leaf-outline", 
    "Jowar": "nutrition-outline",
    "Barley": "beer-outline",
    "Ragi": "ellipse-outline",

    // Pulses
    "Gram": "radio-button-on-outline",
    "Tur (Arhar)": "radio-button-on-outline",
    "Moong": "radio-button-on-outline",
    "Urad": "radio-button-on-outline",
    "Masur": "radio-button-on-outline",
    "Peas": "radio-button-on-outline",

    // Oilseeds
    "Groundnut": "flower-outline",
    "Mustard": "color-fill-outline", 
    "Soyabean": "water-outline",
    "Sunflower": "sunny-outline",
    "Sesame": "ellipse-outline",
    "Castor": "leaf-outline",

    // Commercial
    "Cotton": "shirt-outline",
    "Sugarcane": "cube-outline",
    "Jute": "briefcase-outline",
    "Tobacco": "flame-outline",

    // Fruits
    "Mango": "nutrition-outline",
    "Banana": "moon-outline",
    "Citrus": "disc-outline",
    "Apple": "heart-outline",
    "Guava": "ellipse-outline",
    "Grapes": "apps-outline",

    // Vegetables
    "Potato": "egg-outline",
    "Onion": "planet-outline",
    "Tomato": "nutrition-outline",
    "Brinjal": "flask-outline",
    "Cabbage": "basketball-outline",
    "Cauliflower": "flower-outline",

    // Spices
    "Chilli": "flame-outline",
    "Turmeric": "color-palette-outline",
    "Garlic": "leaf-outline",
    "Ginger": "hand-left-outline",
    "Coriander": "leaf-outline",

    // Others
    "Rubber": "car-outline",
    "Coffee": "cafe-outline",
    "Tea": "leaf-outline",
    "Other": "help-circle-outline"
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

const ApplyPolicyScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);

    // Form Data
    const [formData, setFormData] = useState({
        insurerId: '',
        cropType: 'Cereals',
        cropName: '',
        cropVariety: '',
        cultivationSeason: '',
        insuredArea: '',
        sumInsured: '',
        sowingDate: new Date().toISOString().split('T')[0],
        requestedStartDate: new Date().toISOString().split('T')[0],
        requestType: 'new',
        existingPolicyId: '',
        surveyNumber: '',
        khewatNumber: '',
        expectedYield: '',
        insuranceUnit: '',
        soilType: '',
        irrigationMethod: '',
        cropDescription: '',
        wildAnimalAttackCoverage: false,
        bankName: '',
        bankAccountNo: '',
        bankIfsc: '',
    });

    // Data Options
    const [insurers, setInsurers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [farmImages, setFarmImages] = useState([]);
    const [documents, setDocuments] = useState([]);
    
    // Insurer Modal State
    const [insurerModalVisible, setInsurerModalVisible] = useState(false);
    
    // Payment Modal State
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [calculatedPremium, setCalculatedPremium] = useState(0);

    // Date Picker State
    const [showSowingPicker, setShowSowingPicker] = useState(false);
    const [policyPeriod, setPolicyPeriod] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Auto-calculate Policy Period based on Season
    useEffect(() => {
        if (formData.cultivationSeason) {
            const year = new Date().getFullYear();
            let start = '', end = '';

            switch (formData.cultivationSeason) {
                case 'Kharif':
                    start = `${year}-06-01`;
                    end = `${year}-11-30`;
                    break;
                case 'Rabi':
                    start = `${year}-10-01`;
                    end = `${year + 1}-03-31`;
                    break;
                case 'Summer/Zaid':
                    start = `${year}-03-01`;
                    end = `${year}-05-31`;
                    break;
                case 'Perennial':
                    const today = new Date();
                    start = today.toISOString().split('T')[0];
                    const next = new Date(today);
                    next.setFullYear(next.getFullYear() + 1);
                    end = next.toISOString().split('T')[0];
                    break;
            }
            setPolicyPeriod({ start, end });
            setFormData(prev => ({ 
                ...prev, 
                requestedStartDate: start 
            }));
        }
    }, [formData.cultivationSeason]);

    const fetchInitialData = async () => {
        try {
            setFetchingData(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Authentication token not found');
                return;
            }

            // 1. Fetch Approved Insurers
            const insurersResponse = await fetch(getApiUrl(API_ENDPOINTS.GET_APPROVED_INSURERS), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (insurersResponse.ok) {
                const insurersData = await insurersResponse.json();
                setInsurers(insurersData);
            }

            // 2. Fetch Farmer Profile for Auto-Fill
            const profileResponse = await fetch(getApiUrl(API_ENDPOINTS.GET_FARMER_DETAILS), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileResponse.ok) {
                const farm = await profileResponse.json();

                setFormData(prev => ({
                    ...prev,
                    bankName: farm.bankName || prev.bankName,
                    bankAccountNo: farm.bankAccountNo || prev.bankAccountNo,
                    bankIfsc: farm.bankIfsc || prev.bankIfsc,
                    cropName: farm.cropName || prev.cropName,
                    cultivationSeason: farm.cropSeason || prev.cultivationSeason,
                    cropVariety: farm.cropVariety || prev.cropVariety,
                    surveyNumber: farm.surveyNumber || prev.surveyNumber,
                    khewatNumber: farm.landRecordKhatauni || prev.khewatNumber,
                    insuranceUnit: farm.insuranceUnit || farm.village || prev.insuranceUnit,
                    wildAnimalAttackCoverage: !!farm.wildAnimalAttackCoverage,
                    insuredArea: farm.landAreaSize ? String(farm.landAreaSize) : prev.insuredArea,
                }));

                Alert.alert('Auto-Fetch', 'Your profile details have been automatically filled in!');
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load initial data');
        } finally {
            setFetchingData(false);
        }
    };

    const filteredInsurers = insurers.filter(ins => 
        ins.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setFarmImages(prev => [...prev, result.assets[0]]);
            }
        } catch (error) {
            console.error('Photo error:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const takeDocument = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setDocuments(prev => [...prev, result.assets[0]]);
            }
        } catch (error) {
            console.error('Document error:', error);
            Alert.alert('Error', 'Failed to capture document photo');
        }
    };

    const removePhoto = (index) => {
        setFarmImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeDocument = (index) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.insurerId) return Alert.alert('Required', 'Please select an Insurer');
        if (!formData.cropName) return Alert.alert('Required', 'Please enter Specific Crop Name');
        if (!formData.cultivationSeason) return Alert.alert('Required', 'Please select Cultivation Season');
        if (!formData.insuredArea || isNaN(parseFloat(formData.insuredArea))) {
            return Alert.alert('Required', 'Please enter a valid Insured Area');
        }
        if (!formData.sumInsured || isNaN(parseFloat(formData.sumInsured))) {
            return Alert.alert('Required', 'Please enter a valid Sum Insured');
        }
        if (farmImages.length === 0) return Alert.alert('Required', 'Please take at least one farm photo');
        if (documents.length === 0) return Alert.alert('Required', 'Please upload at least one document photo (Land records)');

        // Calculate Premium (Example: 2% of Sum Insured)
        const sumVal = parseFloat(formData.sumInsured);
        const premium = sumVal * 0.02;
        setCalculatedPremium(premium);
        setPaymentModalVisible(true);
    };

    const processFinalSubmission = async () => {
        setPaymentModalVisible(false);
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
                setLoading(false);
                return;
            }

            const submitData = new FormData();

            // Append text fields safely
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== null && value !== undefined) {
                    submitData.append(key, String(value));
                }
            });

            // Mock Payment Details with user selected method
            const paymentDetails = {
                transactionId: `TXN-${Date.now()}`,
                status: 'success',
                amount: calculatedPremium,
                method: paymentMethod,
                date: new Date().toISOString()
            };
            submitData.append('paymentDetails', JSON.stringify(paymentDetails));

            // Append Images
            farmImages.forEach((img, index) => {
                const fileToUpload = {
                    uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
                    type: 'image/jpeg',
                    name: `farm_image_${index}.jpg`
                };
                submitData.append('farmImages', fileToUpload);
            });

            // Append Documents
            documents.forEach((doc, index) => {
                const fileToUpload = {
                    uri: Platform.OS === 'android' ? doc.uri : doc.uri.replace('file://', ''),
                    type: 'image/jpeg',
                    name: `document_${index}.jpg`
                };
                submitData.append('documents', fileToUpload);
            });

            const response = await fetch(getApiUrl(API_ENDPOINTS.APPLY_POLICY), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
                body: submitData
            });

            const json = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Success! 🎉',
                    'Policy Application & Payment Successful! The insurer will review your request.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
                );
            } else {
                console.warn('Submission Failed:', json);
                const errorDetail = json.error ? `\n\nDetail: ${json.error}` : '';
                Alert.alert(
                    'Submission Failed', 
                    (json.message || 'The server encountered an error.') + errorDetail
                );
            }

        } catch (error) {
            console.error('Submission Error:', error);
            Alert.alert('Network Error', 'Could not connect to the server. Please check your internet connection and server status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Apply New Policy</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {fetchingData && (
                    <View style={styles.fetchingOverlay}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.fetchingText}>Loading your details...</Text>
                    </View>
                )}

                {/* Insurer Selection */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="business" size={22} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>1. Select Insurer</Text>
                    </View>
                    
                    <Text style={styles.label}>Insurance Provider</Text>
                    <TouchableOpacity 
                        style={[
                            styles.dropdownTrigger,
                            formData.insurerId ? styles.dropdownTriggerActive : null
                        ]}
                        onPress={() => setInsurerModalVisible(true)}
                    >
                        <View style={styles.dropdownTriggerLeft}>
                            <View style={[
                                styles.dropdownIconCircle,
                                formData.insurerId ? { backgroundColor: Colors.primary } : { backgroundColor: '#f1f5f9' }
                            ]}>
                                <Ionicons 
                                    name="business" 
                                    size={20} 
                                    color={formData.insurerId ? '#FFF' : Colors.primary} 
                                />
                            </View>
                            <View>
                                <Text style={[
                                    styles.dropdownValue,
                                    !formData.insurerId && styles.dropdownPlaceholder
                                ]}>
                                    {formData.insurerId 
                                        ? insurers.find(i => i.id === formData.insurerId)?.name 
                                        : 'Choose an insurance provider'}
                                </Text>
                                {formData.insurerId && (
                                    <Text style={styles.dropdownSubValue}>
                                        {insurers.find(i => i.id === formData.insurerId)?.serviceType || 'General Insurance'}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Ionicons 
                            name="chevron-down" 
                            size={20} 
                            color={formData.insurerId ? Colors.primary : Colors.textMuted} 
                        />
                    </TouchableOpacity>

                    {formData.insurerId ? (
                        <View style={styles.selectedInsurerInfo}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.selectedInsurerText}>
                                Provider successfully selected
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.helperText}>Tap above to select from approved providers</Text>
                    )}
                </View>

                {/* Crop Details */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="leaf" size={22} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>2. Crop Details</Text>
                    </View>

                    <CustomPicker
                        label="Crop Category"
                        items={CROP_CATEGORIES}
                        selectedValue={formData.cropType}
                        onValueChange={(val) => setFormData({ ...formData, cropType: val, cropName: '' })}
                        placeholder="Select Category"
                        icon="leaf-outline"
                    />

                    <CustomPicker
                        label="Specific Crop Name"
                        items={formData.cropType ? CROPS_BY_TYPE[formData.cropType].map(c => ({ 
                            id: c, 
                            name: c, 
                            icon: CROP_ICONS[c] || 'flower-outline', // Use specific icon or fallback
                            color: Colors.text 
                        })) : []}
                        selectedValue={formData.cropName}
                        onValueChange={(val) => setFormData({ ...formData, cropName: val })}
                        placeholder={formData.cropType ? "Select Crop" : "Select Category first"}
                        icon="flower-outline"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Variety</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.cropVariety}
                                onChangeText={t => setFormData({ ...formData, cropVariety: t })}
                                placeholder="e.g. Sharbati"
                                left={<TextInput.Icon icon={props => <Ionicons name="color-filter-outline" {...props} />} />}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <CustomPicker
                                label="Season"
                                items={SEASONS}
                                selectedValue={formData.cultivationSeason}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, cultivationSeason: val }))}
                                placeholder="Select"
                                icon="calendar-outline"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Sowing Date</Text>
                            <TouchableOpacity 
                                style={styles.dateTrigger} 
                                onPress={() => setShowSowingPicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                                <Text style={styles.dateValue}>{formData.sowingDate}</Text>
                            </TouchableOpacity>
                            {showSowingPicker && (
                                <DateTimePicker
                                    value={new Date(formData.sowingDate)}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => {
                                        setShowSowingPicker(false);
                                        if (selectedDate) {
                                            setFormData({ 
                                                ...formData, 
                                                sowingDate: selectedDate.toISOString().split('T')[0] 
                                            });
                                        }
                                    }}
                                />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Policy Period</Text>
                            <View style={styles.disabledInputGroup}>
                                <Text style={{ fontSize: 10, color: Colors.primaryDark, fontWeight: '700' }}>
                                    {policyPeriod.start ? `${policyPeriod.start} to` : 'Select Season'}
                                </Text>
                                <Text style={{ fontSize: 10, color: Colors.primaryDark, fontWeight: '700' }}>
                                    {policyPeriod.end || ''}
                                </Text>
                            </View>
                            <Text style={{fontSize: 10, color: Colors.primary, marginTop: 4}}>* Based on Season</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Area (Hectares)</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.insuredArea}
                                onChangeText={t => setFormData({ ...formData, insuredArea: t })}
                                keyboardType="numeric"
                                placeholder="0.0"
                                left={<TextInput.Icon icon={props => <Ionicons name="resize-outline" {...props} />} />}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Sum Insured (₹)</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.sumInsured}
                                onChangeText={t => setFormData({ ...formData, sumInsured: t })}
                                keyboardType="numeric"
                                placeholder="₹ 0.00"
                                left={<TextInput.Icon icon={props => <Ionicons name="cash-outline" {...props} />} />}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Survey / Khasra No.</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.surveyNumber}
                                onChangeText={t => setFormData({ ...formData, surveyNumber: t })}
                                placeholder="e.g. 124/A-1"
                                left={<TextInput.Icon icon={props => <Ionicons name="document-text-outline" {...props} />} />}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Khewat Number</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.khewatNumber}
                                onChangeText={t => setFormData({ ...formData, khewatNumber: t })}
                                placeholder="e.g. 45"
                                left={<TextInput.Icon icon={props => <Ionicons name="list-outline" {...props} />} />}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Expected Yield (kg/ha)</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.expectedYield}
                                onChangeText={t => setFormData({ ...formData, expectedYield: t })}
                                placeholder="e.g. 2500"
                                keyboardType="numeric"
                                left={<TextInput.Icon icon={props => <Ionicons name="trending-up-outline" {...props} />} />}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Insurance Unit</Text>
                            <TextInput
                                mode="outlined"
                                style={styles.inputPaper}
                                value={formData.insuranceUnit}
                                onChangeText={t => setFormData({ ...formData, insuranceUnit: t })}
                                placeholder="e.g. Village"
                                left={<TextInput.Icon icon={props => <Ionicons name="location-outline" {...props} />} />}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <CustomPicker
                                label="Soil Type"
                                items={SOIL_TYPES}
                                selectedValue={formData.soilType}
                                onValueChange={(val) => setFormData({ ...formData, soilType: val })}
                                placeholder="Select"
                                icon="earth-outline"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <CustomPicker
                                label="Irrigation"
                                items={IRRIGATION_METHODS}
                                selectedValue={formData.irrigationMethod}
                                onValueChange={(val) => setFormData({ ...formData, irrigationMethod: val })}
                                placeholder="Select"
                                icon="water-outline"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Crop Description</Text>
                    <TextInput
                        mode="outlined"
                        style={[styles.inputPaper, { height: 80 }]}
                        value={formData.cropDescription}
                        onChangeText={t => setFormData({ ...formData, cropDescription: t })}
                        placeholder="Additional details about the crop"
                        multiline
                        numberOfLines={3}
                        left={<TextInput.Icon icon={props => <Ionicons name="information-circle-outline" {...props} />} />}
                    />

                    <TouchableOpacity 
                        style={styles.checkboxContainer}
                        onPress={() => setFormData({ ...formData, wildAnimalAttackCoverage: !formData.wildAnimalAttackCoverage })}
                    >
                        <Checkbox
                            status={formData.wildAnimalAttackCoverage ? 'checked' : 'unchecked'}
                            onPress={() => setFormData({ ...formData, wildAnimalAttackCoverage: !formData.wildAnimalAttackCoverage })}
                            color={Colors.primary}
                        />
                        <Text style={styles.checkboxLabel}>Coverage for Wild Animal Attack?</Text>
                    </TouchableOpacity>
                </View>

                {/* Bank Details */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="card" size={22} color={Colors.warning} />
                        <Text style={styles.sectionTitle}>3. Bank Account (Auto-Filled)</Text>
                    </View>
                    <View style={styles.disabledInputGroup}>
                        <View style={styles.disabledInputItem}>
                            <Ionicons name="business-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.disabledInputText}>{formData.bankName || 'No bank linked'}</Text>
                        </View>
                        <View style={styles.disabledInputItem}>
                            <Ionicons name="card-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.disabledInputText}>{formData.bankAccountNo || 'XXXX-XXXX-XXXX'}</Text>
                        </View>
                        <View style={styles.disabledInputItem}>
                            <Ionicons name="barcode-outline" size={16} color={Colors.textMuted} />
                            <Text style={styles.disabledInputText}>{formData.bankIfsc || 'IFSC CODE'}</Text>
                        </View>
                    </View>
                    <Text style={styles.autoFillNote}>* Bank details are fetched from your profile</Text>
                </View>

                {/* Farm Images */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="images" size={22} color={Colors.secondary} />
                        <Text style={styles.sectionTitle}>4. Farm Documentation</Text>
                    </View>
                    <Text style={styles.helperText}>Take clear photos of your farm area for verification.</Text>

                    <View style={styles.imageGrid}>
                        {farmImages.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removePhoto(index)}
                                >
                                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                            <View style={styles.addPhotoIconCircle}>
                                <Ionicons name="camera" size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.addPhotoText}>Add Farm Photo</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Additional Documents */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-attach" size={22} color={Colors.accent} />
                        <Text style={styles.sectionTitle}>5. Land Records / Documents</Text>
                    </View>
                    <Text style={styles.helperText}>Upload land ownership records or sowing certificates (Photos).</Text>

                    <View style={styles.imageGrid}>
                        {documents.map((img, index) => (
                            <View key={index} style={styles.imageWrapper}>
                                <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                                <TouchableOpacity
                                    style={styles.removeBtn}
                                    onPress={() => removeDocument(index)}
                                >
                                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                                </TouchableOpacity>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addPhotoBtn} onPress={takeDocument}>
                            <View style={styles.addPhotoIconCircle}>
                                <Ionicons name="document" size={32} color={Colors.primary} />
                            </View>
                            <Text style={styles.addPhotoText}>Add Document</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? ['#94a3b8', '#64748b'] : [Colors.primary, Colors.primaryDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.submitBtnText}>Submit Application</Text>
                                <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Payment Gateway Modal */}
            <Modal
                visible={paymentModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setPaymentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Secure Payment</Text>
                            <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.paymentSummary}>
                            <Text style={styles.summaryLabel}>Premium Amount to Pay</Text>
                            <Text style={styles.summaryAmount}>₹ {calculatedPremium.toFixed(2)}</Text>
                            <Divider style={styles.summaryDivider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryRowLabel}>Policy Type</Text>
                                <Text style={styles.summaryRowValue}>{formData.cropName} Insurance</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryRowLabel}>Insured Area</Text>
                            <Text style={styles.summaryRowValue}>{formData.insuredArea} Hectares</Text>
                        </View>
                        </View>

                        <Text style={styles.paymentMethodTitle}>Select Payment Method</Text>
                        <View style={styles.paymentMethods}>
                            {[
                                { id: 'UPI', label: 'UPI / PhonePe / GPay', icon: 'phone-portrait-outline' },
                                { id: 'CARD', label: 'Debit / Credit Card', icon: 'card-outline' },
                                { id: 'NETBANKING', label: 'Net Banking', icon: 'business-outline' },
                            ].map(method => (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.paymentMethodItem,
                                        paymentMethod === method.id && styles.paymentMethodActive
                                    ]}
                                    onPress={() => setPaymentMethod(method.id)}
                                >
                                    <Ionicons 
                                        name={method.icon} 
                                        size={22} 
                                        color={paymentMethod === method.id ? Colors.primary : Colors.textMuted} 
                                    />
                                    <Text style={[
                                        styles.paymentMethodLabel,
                                        paymentMethod === method.id && styles.paymentMethodLabelActive
                                    ]}>
                                        {method.label}
                                    </Text>
                                    {paymentMethod === method.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={[styles.payButton, loading && { opacity: 0.7 }]}
                            onPress={processFinalSubmission}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#94a3b8', '#64748b'] : [Colors.primary, Colors.primaryDark]}
                                style={styles.payGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.payButtonText}>Pay Now & Submit</Text>
                                        <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <Text style={styles.secureText}>
                            <Ionicons name="lock-closed" size={12} color={Colors.textMuted} /> Secure 256-bit SSL Encrypted Payment
                        </Text>
                    </View>
                </View>
            </Modal>
            
            {/* Insurer Selection Modal */}
            <Modal
                visible={insurerModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setInsurerModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Select Provider</Text>
                                <Text style={styles.modalSubtitle}>Approved Insurance Companies</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.modalCloseBtn}
                                onPress={() => setInsurerModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            mode="outlined"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            style={styles.modalSearchInput}
                            left={<TextInput.Icon icon="magnify" color={Colors.primary} />}
                            theme={{ colors: { primary: Colors.primary } }}
                        />

                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalList}
                        >
                            {filteredInsurers.length === 0 ? (
                                <View style={styles.modalEmptyState}>
                                    <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                                    <Text style={styles.modalEmptyText}>No insurers found for "{searchTerm}"</Text>
                                </View>
                            ) : (
                                filteredInsurers.map(ins => (
                                    <TouchableOpacity
                                        key={ins.id}
                                        style={[
                                            styles.modalItem,
                                            formData.insurerId === ins.id && styles.modalItemActive
                                        ]}
                                        onPress={() => {
                                            setFormData({ ...formData, insurerId: ins.id });
                                            setInsurerModalVisible(false);
                                        }}
                                    >
                                        <View style={[
                                            styles.modalItemIconCircle,
                                            formData.insurerId === ins.id ? { backgroundColor: Colors.primary } : { backgroundColor: '#f1f5f9' }
                                        ]}>
                                            <Ionicons 
                                                name="business" 
                                                size={22} 
                                                color={formData.insurerId === ins.id ? '#FFF' : Colors.primary} 
                                            />
                                        </View>
                                        <View style={styles.modalItemContent}>
                                            <Text style={[
                                                styles.modalItemName,
                                                formData.insurerId === ins.id && styles.modalItemNameActive
                                            ]}>
                                                {ins.name}
                                            </Text>
                                            <Text style={styles.modalItemType}>
                                                {ins.serviceType || 'General Insurance'}
                                            </Text>
                                        </View>
                                        {formData.insurerId === ins.id && (
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
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
    fetchingOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.primaryLight,
        gap: 12,
    },
    fetchingText: {
        fontSize: 14,
        color: Colors.primaryDark,
        fontWeight: '700',
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
    disabledInputGroup: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    disabledInputItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    disabledInputText: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600',
    },
    autoFillNote: {
        fontSize: 11,
        color: Colors.textMuted,
        marginTop: 10,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
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
    dropdownTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    dropdownTriggerActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.surface,
    },
    dropdownTriggerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    dropdownIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    dropdownPlaceholder: {
        color: Colors.textMuted,
        fontWeight: '600',
    },
    dropdownSubValue: {
        fontSize: 11,
        color: Colors.primaryDark,
        fontWeight: '600',
        opacity: 0.7,
    },
    modalSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSearchInput: {
        backgroundColor: '#f8fafc',
        marginBottom: 20,
        height: 50,
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
    modalItemIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalItemContent: {
        flex: 1,
    },
    modalItemName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    modalItemNameActive: {
        color: Colors.primaryDark,
    },
    modalItemType: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    modalEmptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    modalEmptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        fontStyle: 'italic',
    },
    selectedInsurerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: Colors.surface,
        padding: 8,
        borderRadius: 10,
        gap: 6,
    },
    selectedInsurerText: {
        fontSize: 12,
        color: Colors.primaryDark,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 13,
        color: Colors.textMuted,
        marginBottom: 16,
        lineHeight: 18,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageWrapper: {
        position: 'relative',
        width: (width - 100) / 3,
        aspectRatio: 1,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    removeBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        elevation: 2,
    },
    addPhotoBtn: {
        width: (width - 100) / 3,
        aspectRatio: 1,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    addPhotoIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    addPhotoText: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primaryDark,
        textAlign: 'center',
    },
    submitBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    submitBtnDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 4,
    },
    checkboxLabel: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
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
    paymentSummary: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryLabel: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 4,
    },
    summaryAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.primaryDark,
        textAlign: 'center',
        marginBottom: 16,
    },
    summaryDivider: {
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryRowLabel: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    summaryRowValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    paymentMethodTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    paymentMethods: {
        gap: 12,
        marginBottom: 24,
    },
    paymentMethodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        gap: 12,
    },
    paymentMethodActive: {
        borderColor: Colors.primary,
        backgroundColor: '#f0fdf4',
    },
    paymentMethodLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    paymentMethodLabelActive: {
        color: Colors.primaryDark,
        fontWeight: '700',
    },
    payButton: {
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 16,
    },
    payGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
    },
    payButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    secureText: {
        fontSize: 12,
        color: Colors.textMuted,
        textAlign: 'center',
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
});

export default ApplyPolicyScreen;
