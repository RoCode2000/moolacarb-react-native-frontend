import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabParamList } from '../../App';

type Props = NativeStackScreenProps<TabParamList, 'Settings'> & {
  onLogout: () => void;
};

export default function SettingsScreen({ onLogout }: Props) {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Settings</Text>
      <Pressable
        onPress={onLogout}
        style={{ padding: 12, backgroundColor: '#eee', borderRadius: 6 }}
      >
        <Text>Log out</Text>
      </Pressable>
    </View>
  );
}
