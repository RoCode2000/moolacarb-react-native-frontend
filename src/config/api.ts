// src/config/api.ts
import { Platform } from 'react-native';

// EMULATOR (Android): 10.0.2.2
export const BASE_URL = 'http://localhost:8080';
//export const BASE_URL = Platform.OS === 'android'
//  ? 'http://10.0.2.2:8080'
//  : 'http://localhost:8080';

// If you’re on a physical phone with ADB reverse:
// adb reverse tcp:8080 tcp:8080
// export const BASE_URL = 'http://localhost:8080';

// If you prefer LAN (no reverse):
// export const BASE_URL = 'http://<YOUR_PC_LAN_IP>:8080';
