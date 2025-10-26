import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Card, Title, Snackbar, RadioButton, ActivityIndicator, HelperText, Text, Menu } from 'react-native-paper';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import HomeScreen from './Home_screen';

// List of Indian States
const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh"
];
const cropList = ["Wheat", "Rice", "Cotton", "Soybean", "Sugarcane", "Maize", "Pulses"];
const cropSeasons = ["Kharif", "Rabi", "Zaid"];

const FarmerRegistrationScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    aadhaar_no: '',
    mobile_no: '',
    village: '',
    tehsil: '',
    district: '',
    state: '',
    crop_name: '',
    crop_season: '',
    land_area_acres: '',
    land_area_hectares: '',
    land_record_khasra: '',
    land_record_khatauni: '',
    survey_number: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    loan_status: 'No',
    insurance_linked: 'No',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [stateMenuVisible, setStateMenuVisible] = useState(false);
  const [cropMenuVisible, setCropMenuVisible] = useState(false);
  const [seasonMenuVisible, setSeasonMenuVisible] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const err = {};
    if (!form.name) err.name = 'Name is required';
    if (!form.aadhaar_no || !/^\d{12}$/.test(form.aadhaar_no)) err.aadhaar_no = 'Aadhaar must be 12 digits';
    if (!form.mobile_no || !/^\d{10}$/.test(form.mobile_no)) err.mobile_no = 'Mobile Number must be 10 digits';
    if (!form.village) err.village = 'Village is required';
    if (!form.tehsil) err.tehsil = 'Tehsil is required';
    if (!form.district) err.district = 'District is required';
    if (!form.state) err.state = 'Select a state';
    if (!form.crop_name) err.crop_name = 'Select crop';
    if (!form.crop_season) err.crop_season = 'Select season';
    if (form.land_area_acres !== '' && isNaN(Number(form.land_area_acres))) err.land_area_acres = 'Enter valid number';
    if (form.land_area_hectares !== '' && isNaN(Number(form.land_area_hectares))) err.land_area_hectares = 'Enter valid number';
    if (!form.bank_name) err.bank_name = 'Bank name is required';
    if (!form.bank_account_no || !/^\d+$/.test(form.bank_account_no)) err.bank_account_no = 'Account no. must be digits only';
    if (!form.bank_ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(form.bank_ifsc)) err.bank_ifsc = 'IFSC must be 11 chars (e.g., ABCD0123456)';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      const response = await fetch('http://10.0.2.2/backend/register_farmer.php', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      if (json.status === 'success') {
        setSnackbar({ show: true, message: 'Registration Successful!', type: 'success' });
        navigation.navigate(HomeScreen, { farmer: form });
      } else {
        setSnackbar({ show: true, message: json.message || 'Registration failed!', type: 'error' });
      }
    } catch (err) {
      setSnackbar({ show: true, message: err.message, type: 'error' });
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Title style={styles.title}>Farmer Registration</Title>
        <TextInput
          label="Name"
          placeholder="Enter farmer name"
          value={form.name}
          onChangeText={v => handleChange('name', v)}
          mode="outlined"
          left={<TextInput.Icon icon="account-circle" />}
          error={!!errors.name}
        />
        <HelperText type="error" visible={!!errors.name}>{errors.name}</HelperText>
        <TextInput
          label="Aadhaar Number"
          placeholder="12 digit Aadhaar"
          value={form.aadhaar_no}
          onChangeText={v => handleChange('aadhaar_no', v.replace(/[^0-9]/g, ''))}
          mode="outlined"
          keyboardType="numeric"
          left={<TextInput.Icon icon={() => <MaterialIcons name="fingerprint" size={24} />} />}
          error={!!errors.aadhaar_no}
        />
        <HelperText type="error" visible={!!errors.aadhaar_no}>{errors.aadhaar_no}</HelperText>
        <TextInput
          label="Mobile Number"
          placeholder="10 digit mobile"
          value={form.mobile_no}
          onChangeText={v => handleChange('mobile_no', v.replace(/[^0-9]/g, ''))}
          mode="outlined"
          keyboardType="numeric"
          left={<TextInput.Icon icon={() => <FontAwesome name="mobile" size={24} />} />}
          error={!!errors.mobile_no}
        />
        <HelperText type="error" visible={!!errors.mobile_no}>{errors.mobile_no}</HelperText>
        <TextInput
          label="Village"
          placeholder="Village name"
          value={form.village}
          onChangeText={v => handleChange('village', v)}
          mode="outlined"
          left={<TextInput.Icon icon="home" />}
          error={!!errors.village}
        />
        <HelperText type="error" visible={!!errors.village}>{errors.village}</HelperText>
        <TextInput
          label="Tehsil"
          placeholder="Tehsil name"
          value={form.tehsil}
          onChangeText={v => handleChange('tehsil', v)}
          mode="outlined"
          error={!!errors.tehsil}
        />
        <HelperText type="error" visible={!!errors.tehsil}>{errors.tehsil}</HelperText>
        <TextInput
          label="District"
          placeholder="District name"
          value={form.district}
          onChangeText={v => handleChange('district', v)}
          mode="outlined"
          error={!!errors.district}
        />
        <HelperText type="error" visible={!!errors.district}>{errors.district}</HelperText>
        <View>
          <Menu
            visible={stateMenuVisible}
            onDismiss={() => setStateMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="map-marker"
                onPress={() => setStateMenuVisible(true)}>
                {form.state || 'Select State'}
              </Button>
            }>
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
          </Menu>
          <HelperText type="error" visible={!!errors.state}>{errors.state}</HelperText>
        </View>
        <View>
          <Menu
            visible={cropMenuVisible}
            onDismiss={() => setCropMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="seed"
                onPress={() => setCropMenuVisible(true)}>
                {form.crop_name || 'Select Crop'}
              </Button>
            }>
            {cropList.map(crop => (
              <Menu.Item
                key={crop}
                onPress={() => {
                  handleChange('crop_name', crop);
                  setCropMenuVisible(false);
                }}
                title={crop}
              />
            ))}
          </Menu>
          <HelperText type="error" visible={!!errors.crop_name}>{errors.crop_name}</HelperText>
        </View>
        <View>
          <Menu
            visible={seasonMenuVisible}
            onDismiss={() => setSeasonMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => setSeasonMenuVisible(true)}>
                {form.crop_season || 'Select Season'}
              </Button>
            }>
            {cropSeasons.map(season => (
              <Menu.Item
                key={season}
                onPress={() => {
                  handleChange('crop_season', season);
                  setSeasonMenuVisible(false);
                }}
                title={season}
              />
            ))}
          </Menu>
          <HelperText type="error" visible={!!errors.crop_season}>{errors.crop_season}</HelperText>
        </View>
        <TextInput
          label="Land Area (acres)"
          placeholder="e.g., 3.5"
          value={form.land_area_acres}
          onChangeText={v => handleChange('land_area_acres', v.replace(/[^0-9.]/g, ''))}
          mode="outlined"
          keyboardType="numeric"
          error={!!errors.land_area_acres}
        />
        <HelperText type="error" visible={!!errors.land_area_acres}>{errors.land_area_acres}</HelperText>
        <TextInput
          label="Land Area (hectares)"
          placeholder="e.g., 1.2"
          value={form.land_area_hectares}
          onChangeText={v => handleChange('land_area_hectares', v.replace(/[^0-9.]/g, ''))}
          mode="outlined"
          keyboardType="numeric"
          error={!!errors.land_area_hectares}
        />
        <HelperText type="error" visible={!!errors.land_area_hectares}>{errors.land_area_hectares}</HelperText>
        <TextInput
          label="Land Record (Khasra)"
          placeholder="Khasra Number"
          value={form.land_record_khasra}
          onChangeText={v => handleChange('land_record_khasra', v)}
          mode="outlined"
        />
        <TextInput
          label="Land Record (Khatauni)"
          placeholder="Khatauni Number"
          value={form.land_record_khatauni}
          onChangeText={v => handleChange('land_record_khatauni', v)}
          mode="outlined"
        />
        <TextInput
          label="Survey Number"
          placeholder="Survey Number"
          value={form.survey_number}
          onChangeText={v => handleChange('survey_number', v)}
          mode="outlined"
        />
        <TextInput
          label="Bank Name"
          placeholder="Bank name"
          value={form.bank_name}
          onChangeText={v => handleChange('bank_name', v)}
          mode="outlined"
          error={!!errors.bank_name}
        />
        <HelperText type="error" visible={!!errors.bank_name}>{errors.bank_name}</HelperText>
        <TextInput
          label="Bank Account Number"
          placeholder="Account Number"
          value={form.bank_account_no}
          onChangeText={v => handleChange('bank_account_no', v.replace(/[^0-9]/g, ''))}
          mode="outlined"
          keyboardType="numeric"
          error={!!errors.bank_account_no}
        />
        <HelperText type="error" visible={!!errors.bank_account_no}>{errors.bank_account_no}</HelperText>
        <TextInput
          label="IFSC Code"
          placeholder="11 character IFSC"
          value={form.bank_ifsc}
          onChangeText={v => handleChange('bank_ifsc', v.toUpperCase())}
          mode="outlined"
          error={!!errors.bank_ifsc}
          maxLength={11}
        />
        <HelperText type="error" visible={!!errors.bank_ifsc}>{errors.bank_ifsc}</HelperText>
        <View style={styles.radioRow}>
          <Text>Loan Status:</Text>
          <RadioButton.Group onValueChange={v => handleChange('loan_status', v)} value={form.loan_status}>
            <RadioButton.Item label="Yes" value="Yes" />
            <RadioButton.Item label="No" value="No" />
          </RadioButton.Group>
        </View>
        <View style={styles.radioRow}>
          <Text>Insurance Linked:</Text>
          <RadioButton.Group onValueChange={v => handleChange('insurance_linked', v)} value={form.insurance_linked}>
            <RadioButton.Item label="Yes" value="Yes" />
            <RadioButton.Item label="No" value="No" />
          </RadioButton.Group>
        </View>
        {loading ? (
          <ActivityIndicator animating={true} color="#388e3c" />
        ) : (
          <Button
            mode="contained"
            icon="check"
            style={styles.submitBtn}
            onPress={handleSubmit}
          >
            Submit Registration
          </Button>
        )}
      </Card>
      <Snackbar
        visible={snackbar.show}
        duration={snackbar.type === 'error' ? 4000 : 2000}
        onDismiss={() => setSnackbar({ ...snackbar, show: false })}
        style={{ backgroundColor: snackbar.type === 'error' ? '#ff5252' : '#388e3c' }}
      >
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f8e9' },
  card: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  title: { color: '#388e3c', fontWeight: 'bold', fontSize: 22, marginBottom: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  submitBtn: { marginTop: 24, backgroundColor: '#388e3c' },
});

export default FarmerRegistrationScreen;
