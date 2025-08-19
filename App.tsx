// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import { auth } from './src/config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        setIsLoggedIn(!!user);
        setLoading(false);
      });

      return unsubscribe; // cleanup listener on unmount
    }, []);

    if (loading) {
      // You can replace this with a splash screen or loader
      return null;
    }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={() => setIsLoggedIn(true)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
