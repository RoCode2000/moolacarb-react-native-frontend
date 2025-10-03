
import { Platform } from 'react-native';

// export const BASE_URL = 'http://10.0.2.2:8080';

// If you’re on a physical phone with ADB reverse:
// adb reverse tcp:8080 tcp:8080
//export const BASE_URL = 'http://localhost:8080';

const DEV_URL = 'http://10.0.2.2:8080';         // emulator/dev
const PROD_URL = 'http://213.35.111.133';      // VM public IP

// __DEV__ is true when running in debug mode
export const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;