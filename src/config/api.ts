
import { Platform } from 'react-native';

export const BASE_URL = Platform.OS === 'ios'
         ? 'http://127.0.0.1:8080'
         : 'http://10.0.2.2:8080';
// If you’re on a physical phone with ADB reverse:
// adb reverse tcp:8080 tcp:8080
//export const BASE_URL = 'http://localhost:8080';
