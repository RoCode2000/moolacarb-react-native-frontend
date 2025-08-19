import React from 'react';
import { View, Text } from 'react-native';
import { auth } from '../config/firebaseConfig';

export default function ProfileScreen() {
    const user = auth.currentUser;


  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text>Profile</Text>
      {user ? (
          <>
            <Text>Email: {user.email}</Text>
            <Text>UID: {user.uid}</Text>
            <Text>Name: {user.displayName ?? "No Name"}</Text>
          </>) : (
            <Text>No User Detected! Please Contact Admin</Text>
          )}
    </View>
  );
}
