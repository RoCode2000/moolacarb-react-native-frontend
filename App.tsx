// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
// Auth
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Tabs (make sure these are default exports)
import RecipeScreen from './src/screens/RecipeScreen';
import RecipeDetailScreen from "./src/screens/RecipeDetailScreen";
import FoodScanScreen from './src/screens/FoodScanScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SubscriptionTierScreen from './src/screens/SubscriptionTierScreen';
import OnboardingScreen from "./src/screens/OnboardingScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import ChatBotOverlay from './src/components/ChatBotOverlay'; // now used as a full screen

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
MaterialCommunityIcons.loadFont();

import { auth } from './src/config/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

import { UserProvider } from "./src/context/UserContext";
import { RecipeProvider } from './src/context/RecipeContext';

import {Appearance} from 'react-native';

Appearance.setColorScheme?.('light');

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Onboarding: undefined;
  SubscriptionTier: undefined;
};

export type TabParamList = {
  Recipe: undefined;
  FoodScan: undefined;
  Home: undefined;
  Reports: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// AppTabs inside App.tsx
function AppTabs({ onLogout }: { onLogout: () => void }) {
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#0f2b3a',
          tabBarInactiveTintColor: '#425563',
          tabBarLabelStyle: { fontSize: 12 },
          tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8 },
          tabBarIcon: ({ color, size, focused }) => {
            let name: string;
            switch (route.name) {
              case 'Recipe':
                name = 'chef-hat';
                break;
              case 'Home':
                name = focused ? 'home' : 'home-outline';
                break;
              case 'Reports':
                name = 'chart-bar';
                break;
              case 'Chat':
                name = focused ? 'chat' : 'chat-outline';
                break;
              case 'Profile':
                name = focused ? 'account-circle' : 'account-circle-outline';
                break;
              default:
                name = 'circle-outline';
            }
            return <MaterialCommunityIcons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Recipe" component={RecipeScreen} options={{ title: 'Recipe' }} />
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Reports' }} />

        {/* Intercept tab press for Chat */}
        <Tab.Screen
          name="Chat"
          component={View}
          options={{ title: 'Chatbot' }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // prevent navigation
              setChatVisible(true); // open chatbot overlay
            },
          }}
        />

        <Tab.Screen name="Profile" options={{ title: 'Profile' }}>
          {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
        </Tab.Screen>
      </Tab.Navigator>

      {/* ✅ Chat Overlay Modal */}
      <ChatBotOverlay visible={chatVisible} onClose={() => setChatVisible(false)} />
    </>
  );
}


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return null; // show splash if you want
  }

  return (
    <UserProvider>
      <RecipeProvider>
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
                <Stack.Screen name="Signup">
                  {(props) => (
                    <SignupScreen
                      {...props}
                      onSignupSuccess={() =>
                        props.navigation.replace("Onboarding")
                      }
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen name="Onboarding">
                  {(props) => (
                    <OnboardingScreen
                      {...props}
                      onOnboardingComplete={() => setIsLoggedIn(true)}
                    />
                  )}
                </Stack.Screen>
              </>
            ) : (
              <>
                <Stack.Screen name="Main">
                  {() => (
                    <AppTabs onLogout={() => setIsLoggedIn(false)} />
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="RecipeDetailScreen"
                  component={RecipeDetailScreen}
                  options={{ headerShown: true, title: "Recipe Details" }}
                />
                <Stack.Screen
                  name="SubscriptionTier"
                  component={SubscriptionTierScreen}
                  options={{ headerShown: true, title: "Subscription Tier" }}
                />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                  options={{ title: "Edit Profile" }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </RecipeProvider>
    </UserProvider>
  );
}
