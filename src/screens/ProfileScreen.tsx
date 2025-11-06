// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { useUser } from '../context/UserContext';
import type { RootStackParamList } from './App';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type Props = {
  onLogout: () => void;
};

export default function ProfileScreen({ onLogout }: Props) {
  const { user, setUser } = useUser();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      Alert.alert("Signed Out", "You have been signed out.");
      onLogout(); // triggers navigation reset in App.tsx
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      {user ? (
        <>
          <Text style={styles.info}>
            Name: {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.info}>Email: {user.email}</Text>
        </>
      ) : (
        <Text style={styles.error}>
          No User Detected! Please Contact Admin
        </Text>
      )}

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    marginBottom: 6,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 14,
    marginVertical: 6,
  },
  optionText: {
    fontSize: 16,
    color: '#0B1F34',
  },
  signOutButton: {
    marginTop: 20,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
});
