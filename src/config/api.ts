import { Platform } from 'react-native';

// Development URLs
const DEV_URL_IOS = 'http://127.0.0.1:8080';     // iOS simulator
const DEV_URL_ANDROID = 'http://10.0.2.2:8080';  // Android emulator

// Production URL (your Oracle VM public IP)
const PROD_URL = 'http://4.190.64.83';

// Determine correct DEV URL based on platform
const DEV_URL =
  Platform.OS === 'ios'
    ? DEV_URL_IOS
    : DEV_URL_ANDROID;

// __DEV__ is true when running in debug mode (Metro connected)
export const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

// (Optional) Debug print for sanity check
console.log(`[CONFIG] __DEV__ = ${__DEV__}, Platform = ${Platform.OS}, BASE_URL = ${BASE_URL}`);
