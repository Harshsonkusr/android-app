import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

import SelectLogin from './components/Login_select';
import LoginAadhar from './components/Login_via_Aadhar';
import LoginMobile from './components/Login_via_MobileNo';
import OTP_AUTH from './components/OTP_authecation';
import HomeScreen from './components/Home_screen';
import NewClaimScreen from './components/New_insurance';
import PreviousClaim from './components/Previous_insurance';
import ChatBOT from './components/Chatbot_homescreen';
import FarmerProfile from './components/FarmerProfile';
import RegisterUser from './components/RegisterUser';
import FloodClaims from './components/FloodClaimScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginSelect">
          <Stack.Screen name="LoginSelect" component={SelectLogin} options={{ headerShown: false }} />
          <Stack.Screen name="LoginviaAadhar" component={LoginAadhar} options={{ title: 'Login Aadhar' }} />
          <Stack.Screen name="LoginviaMobile" component={LoginMobile} options={{ title: 'Login Mobile' }} />
          <Stack.Screen name="OTP" component={OTP_AUTH} options={{ title: 'OTP Authentication' }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home Page' }} />
          <Stack.Screen name="NewClaim" component={NewClaimScreen} options={{ title: 'New Insurance Claim' }} />
          <Stack.Screen name="PreviousClaims" component={PreviousClaim} options={{ title: 'Previous Claims' }} />
          <Stack.Screen name="FarmerProfile" component={FarmerProfile} options={{ title: 'Farmer Profile' }} />
          <Stack.Screen name="Chatbot" component={ChatBOT} options={{ title: 'Chatbot' }} />
          <Stack.Screen name="RegisterUser" component={RegisterUser} options={{ title: 'RegisterUser' }} />
          <Stack.Screen name='FloodClaimScreen' component={FloodClaims} options={{title: 'FloodClaimScreen'}}/>
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
