/**
 * API Configuration for React Native App
 * Update the API_BASE_URL to match your backend server
 */

import { Platform } from 'react-native';

// Configuration for different environments
const API_CONFIG = {
  // Production Server IP
  // API_BASE_URL: 'http://103.159.239.34:5000', 
  API_BASE_URL: 'http://192.168.1.5:5000', 

  // Alternative URLs for different scenarios (uncomment and use as needed)
  LOCAL_ANDROID_EMULATOR: 'http://10.0.2.2:5000',  
  LOCAL_IP: 'http://192.168.1.5:5000',  // Works for physical devices on same Wi-Fi
  PRODUCTION: 'http://103.159.239.34:5000',

  // API Endpoints
  ENDPOINTS: {
    // Auth & Registration
    REGISTER_FARMER: '/api/auth/signup/farmer',
    SEND_OTP: '/api/auth/send-otp',
    VERIFY_OTP: '/api/auth/verify-otp',
    LOGIN_FARMER: '/api/auth/verify-otp', // Login is same as verifying OTP

    // User Data
    GET_USER_PROFILE: '/api/auth/me',
    GET_FARMER_DETAILS: '/api/farmer/profile', // Matches Core API unified profile endpoint
    GET_MY_POLICIES: '/api/farmer/policies', // Added for My Policies screen
    SUBMIT_CLAIM: '/api/claims',
    GET_MY_CLAIMS: '/api/claims/my-claims',

    // Policy Application
    GET_APPROVED_INSURERS: '/api/insurers/approved',
    APPLY_POLICY: '/api/policy-requests', // Updated to match Core API path

    // Notifications
    GET_NOTIFICATIONS: '/api/notifications',

    // Dashboard
    GET_FARMER_QUICK_STATS: '/api/dashboard/farmer/quick-stats',

    // Utilities
    HEALTH_CHECK: '/health'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.API_BASE_URL;
  const fullUrl = `${baseUrl}${endpoint}`;

  // Log for debugging (remove in production)
  if (__DEV__) {
    console.log(`🔗 API URL: ${fullUrl}`);
    console.log(`📱 Platform: ${Platform.OS}`);
  }

  return fullUrl;
};

// Helper function to test server connectivity (non-blocking, for logging only)
export const testServerConnection = async () => {
  try {
    const healthUrl = getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_CHECK);
    console.log('🏥 Testing server connection:', healthUrl);

    const controller = new AbortController();
    // Increased timeout to 10 seconds for slower networks
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn('⏱️ Connection test timeout (server may still be reachable)');
    }, 10000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is reachable:', data);
      return true;
    } else {
      console.warn('⚠️ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    // Don't log as error if it's just an abort (timeout)
    if (error.name === 'AbortError') {
      console.warn('⏱️ Connection test timed out (this is normal if server is slow)');
    } else {
      console.warn('⚠️ Server connection test failed:', error.message);
    }
    return false;
  }
};

// Export endpoints
export const API_ENDPOINTS = API_CONFIG.ENDPOINTS;
export const API_BASE_URL = API_CONFIG.API_BASE_URL;

export default API_CONFIG;
