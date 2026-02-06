import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

import SelectLogin from './components/LoginSelect';
import LoginAadhar from './components/LoginViaAadhar';
import LoginMobile from './components/LoginViaMobileNo';
import OTP_AUTH from './components/OTPAuthentication';
import HomeScreen from './components/HomeScreen';
import ApplyPolicyScreen from './components/ApplyPolicyScreen';
import PreviousClaim from './components/PreviousInsurance';
import ChatBOT from './components/ChatbotHomeScreen';
import FarmerProfile from './components/FarmerProfile';
import RegisterUser from './components/RegisterUser';
import ClaimSubmissionScreen from './components/ClaimSubmissionScreen';
import WeatherScreen from './components/WeatherScreen';
import CropInfo from './components/CropInfo';
import LandMapMarker from './components/LandMapMarker';
import MyPoliciesScreen from './components/MyPoliciesScreen';
import NotificationScreen from './components/NotificationScreen';
// import Subsidies from './components/Subsidies';
// import Resources from './components/Resources';


const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="LoginSelect"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="LoginSelect" component={SelectLogin} />
          <Stack.Screen name="LoginviaAadhar" component={LoginAadhar} />
          <Stack.Screen name="LoginviaMobile" component={LoginMobile} />
          <Stack.Screen name="OTP" component={OTP_AUTH} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ApplyPolicy" component={ApplyPolicyScreen} />
          <Stack.Screen name="PreviousClaims" component={PreviousClaim} />
          <Stack.Screen name="FarmerProfile" component={FarmerProfile} />
          <Stack.Screen name="Chatbot" component={ChatBOT} />
          <Stack.Screen name="RegisterUser" component={RegisterUser} />
          <Stack.Screen name='ClaimSubmissionScreen' component={ClaimSubmissionScreen} />
          <Stack.Screen name="Weather" component={WeatherScreen} />
          <Stack.Screen name="CropInfo" component={CropInfo} />
          <Stack.Screen name="LandMapMarker" component={LandMapMarker} />
          <Stack.Screen name="MyPolicies" component={MyPoliciesScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          {/* <Stack.Screen name="Subsidies" component={Subsidies} options={{ title: 'Subsidies' }} />
          <Stack.Screen name="Resources" component={Resources} options={{ title: 'Resources' }} /> */}
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
