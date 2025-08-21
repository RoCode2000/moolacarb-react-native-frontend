// SignUpScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../config/firebaseConfig';
import CheckBox from '@react-native-community/checkbox';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    FacebookAuthProvider,
    linkWithCredential,
    fetchSignInMethodsForEmail,
    updatePassword
    } from 'firebase/auth';
import '../config/googleConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';


// type Props = {
//   onLoginSuccess: () => void;
// };

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const allDisabled = !acceptedTerms;

  const handleSignUp = async () => {

    if (password !== confirmPassword) {
        setError("Passwords do not match. Please check and try again.");
        return; // stop further execution
      }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created:", userCredential.user);

      const payload = {
            name: name,
            email: email,
            password: password,
          };

      const response = await fetch('http://10.0.2.2:8080/api/user/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

    } catch (error: any) {
//       console.error("Error signing up:", error.code, error.message);
        setError("This email is already registered.");
    }
  };



  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('GoogleSignin userInfo:', userInfo);

      const email = userInfo.data.user.email;
      if (!email) throw new Error('No email returned from Google');


      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.includes('password')) {
        setError("This email is already registered. Please sign in using email & password or use a different email.");
        return;
      }


      const idToken = userInfo.data.idToken;
      if (!idToken) throw new Error('Google Sign-In failed: no idToken returned');

      const googleCredential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, googleCredential);
      console.log("Google login successful");

      const payload = {
        idToken: idToken,
        userId: userInfo.data.user.id,
        email: email,
        givenName: userInfo.data.user.givenName,
        familyName: userInfo.data.user.familyName,
        name: userInfo.data.user.name,
        photoUrl: userInfo.data.user.photo
      };

      const response = await fetch('http://10.0.2.2:8080/api/user/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);

      // onLoginSuccess();
    } catch (err) {
      console.error("Google login / backend failed:", err);
      setError("Google login failed. Please try again later");
    }
  };


  const handleFacebookLogin = async () => {
    try {

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) throw new Error('User cancelled the login process');

      const data = await AccessToken.getCurrentAccessToken();
      if (!data) throw new Error('Failed to get Facebook access token');

      const facebookCredential = FacebookAuthProvider.credential(data.accessToken);

      try {

        await signInWithCredential(auth, facebookCredential);
        const currentUser = auth.currentUser;

//         onLoginSuccess();
//         console.log('Facebook login successful');
      } catch (error: any) {
        if (error.code === 'auth/account-exists-with-different-credential') {

          const email = error.customData?.email;
          if (!email) throw new Error('Email not available for linking');

          const pendingCred = facebookCredential;


          const methods = await fetchSignInMethodsForEmail(auth, email);
//           console.log('Existing providers for email:', methods);

          let existingUser = null;

          if (methods.includes('password')) {

            const password = await promptPasswordForEmail(email);
            if (!password) throw new Error('Password required to link Facebook');
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            existingUser = userCred.user;
          } else if (methods.includes('google.com')) {

            await handleGoogleLogin();
            existingUser = auth.currentUser;
          } else {
            throw new Error(`Unsupported provider for linking: ${methods}`);
          }


          if (existingUser) {
            await linkWithCredential(existingUser, pendingCred);
//             console.log('Facebook successfully linked to existing account');
//             onLoginSuccess();
          }
        } else {
          throw error;
        }
      }
    } catch (err) {
//       console.error('Facebook login failed', err);
      setError('Facebook login failed');
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
        disabled={allDisabled} onPress={handleGoogleLogin}
      >
        <Text style={[styles.socialText, { color: '#DB4437' }]}>Sign Up with Google</Text>
      </TouchableOpacity>

      {/* Facebook Button */}
      <TouchableOpacity
        style={[styles.socialButton, { borderColor: '#1877F2', opacity: allDisabled ? 0.5 : 1 }]}
        disabled={allDisabled} onPress={handleFacebookLogin}
      >
        <Text style={[styles.socialText, { color: '#1877F2' }]}>Sign Up with Facebook</Text>
      </TouchableOpacity>

      {/* Apple Button */}
      <TouchableOpacity
        style={[styles.socialButton, { borderColor: '#000000', opacity: allDisabled ? 0.5 : 1 }]}
        disabled={allDisabled}
      >
        <Text style={[styles.socialText, { color: '#000000' }]}>Sign Up with Apple</Text>
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
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
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
            onPress={() => handleSignUp(email, password)}
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
          <Text style={{ color: 'red' }}>* </Text>
          I agree to the <Text style={{ color: '#4CAF50' }}>Terms & Conditions</Text>
        </Text>
      </View>

      {/* Back to login */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
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
