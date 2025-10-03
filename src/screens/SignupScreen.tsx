// src/screens/SignUpScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { auth } from '../config/firebaseConfig';
import CheckBox from '@react-native-community/checkbox';
import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import '../config/googleConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { BASE_URL } from "../config/api";

// ✅ accept the callback from App.tsx
type Props = {
  onSignupSuccess: () => void;
};

export default function SignUpScreen({ onSignupSuccess }: Props) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const allDisabled = !acceptedTerms;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // ----------------- Email Signup -----------------
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);

      const payload = {
        name,
        email,
        password,
        firebaseId: userCredential.user.uid,
      };

      const response = await fetch(`${BASE_URL}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // ✅ Switch into Main stack
      onSignupSuccess();
    } catch (err: any) {
      console.error('Error signing up:', err);
      setError('This email is already registered or signup failed.');
    }
  };

  // ----------------- Google Signup -----------------
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('GoogleSignin userInfo:', userInfo);

      const userEmail = userInfo.data.user.email;
      if (!userEmail) throw new Error('No email returned from Google');

      // Prevent duplicates with password signup
      const signInMethods = await fetchSignInMethodsForEmail(auth, userEmail);
      if (signInMethods.includes('password')) {
        setError(
          'This email is already registered. Please sign in using email & password or use a different email.'
        );
        return;
      }

      const idToken = userInfo.data.idToken;
      if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
      console.log('Google login successful');

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No current user after Google login');

      const payload = {
        idToken,
        userId: userInfo.data.user.id,
        email: userEmail,
        givenName: userInfo.data.user.givenName,
        familyName: userInfo.data.user.familyName,
        name: userInfo.data.user.name,
        photoUrl: userInfo.data.user.photo,
        firebaseId: currentUser.uid,
      };

      const response = await fetch(`${BASE_URL}/api/user/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);

      // ✅ Switch into Main stack
      onSignupSuccess();
    } catch (err) {
      console.error('Google login / backend failed:', err);
      setError('Google login failed. Please try again later.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logoText}>MoolaCarb</Text>

      {/* Logo placeholder */}
      <View style={styles.logo}>
        <Text style={{ fontSize: 48 }}>🏋️‍♂️</Text>
      </View>

      <Text style={styles.title}>Sign Up</Text>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.socialButton, { borderColor: '#DB4437', opacity: allDisabled ? 0.5 : 1 }]}
        disabled={allDisabled}
        onPress={handleGoogleLogin}
      >
        <Text style={[styles.socialText, { color: '#DB4437' }]}>Sign Up with Google</Text>
      </TouchableOpacity>

      {/* Email Button */}
      <TouchableOpacity
        style={[styles.socialButton, { borderColor: '#4CAF50', opacity: allDisabled ? 0.5 : 1 }]}
        onPress={() => setShowEmailForm(true)}
        disabled={allDisabled}
      >
        <Text style={[styles.socialText, { color: '#4CAF50' }]}>Sign Up with Email</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {showEmailForm && (
        <>
          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: acceptedTerms ? '#4CAF50' : '#ccc' },
            ]}
            onPress={handleSignUp}
            disabled={!acceptedTerms}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Terms & Conditions */}
      <View style={styles.termsRow}>
        <CheckBox
          value={acceptedTerms}
          onValueChange={setAcceptedTerms}
          boxType="square"
          tintColors={{ true: '#4CAF50', false: '#ccc' }}
        />
        <Text style={styles.termsText}>
          <Text style={{ color: 'red' }}>* </Text>I agree to the{' '}
          <Text style={{ color: '#4CAF50' }}>Terms & Conditions</Text>
        </Text>
      </View>

      {/* Back to login */}
<TouchableOpacity onPress={() => navigation.navigate("Login")}>
  <Text style={styles.backText}>Already have an account? Log In</Text>
</TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  logo: {
    marginVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    marginBottom: 20,
  },
  socialButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialText: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 5,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: '80%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    width: '80%',
  },
  termsText: {
    fontSize: 14,
    marginLeft: 5,
    flexShrink: 1,
  },
  backText: {
    marginTop: 15,
    fontSize: 14,
    color: '#4CAF50',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
