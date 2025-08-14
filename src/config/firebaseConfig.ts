import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCXoCc3R1UWO8XiJmaL_1B8D3yF6g37A3I",
  authDomain: "moolacarb-d4443.firebaseapp.com",
  projectId: "moolacarb-d4443",
  storageBucket: "moolacarb-d4443.firebasestorage.app",
  messagingSenderId: "1040622670050",
  appId: "1:1040622670050:web:fb668ff5cf900be41fcebb",
  measurementId: "G-PKMSG5HSXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
