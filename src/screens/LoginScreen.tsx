// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
    signInWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    FacebookAuthProvider,
    linkWithCredential,
    fetchSignInMethodsForEmail,
    updatePassword
    } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import '../config/googleConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

type Props = {
  onLoginSuccess: () => void;
};

type LoginScreenNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen = ({ onLoginSuccess }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const provider = new GoogleAuthProvider();
  const navigation = useNavigation<LoginScreenNavProp>();

    const handleLogin = async () => {
      try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
//           console.log('Existing methods for email:', methods);

        await signInWithEmailAndPassword(auth, email, password);
//         console.log("Login successful");
        onLoginSuccess(); // This will call setIsLoggedIn(true) in App.tsx
      } catch (err: any) {
//         console.error("Login failed", err);
        setError(err.message); // Use existing state setter
      }
    };

    const handleGoogleLogin = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        // uncomment this below if you want to force the user to select a google account to log in
        // await GoogleSignin.signOut();
        const userInfo = await GoogleSignin.signIn();
//         console.log('GoogleSignin userInfo:', userInfo);

        const idToken = userInfo.data.idToken;
        if (!idToken) {
          throw new Error('Google Sign-In failed: no idToken returned');
        }
//         console.log('idToken:', idToken);

        const googleCredential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, googleCredential);
//         console.log("Google login successful");
        onLoginSuccess();
      } catch (err) {
//         console.error("Google login failed", err);
        setError("Google login failed");
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
//           console.log('Facebook login successful');
          onLoginSuccess();
        } catch (error: any) {
          if (error.code === 'auth/account-exists-with-different-credential') {

            const email = error.customData?.email;
            if (!email) throw new Error('Email not available for linking');

            const pendingCred = facebookCredential;

            // 4️⃣ Check which providers exist for this email
            const methods = await fetchSignInMethodsForEmail(auth, email);
//             console.log('Existing providers for email:', methods);

            let existingUser = null;

            if (methods.includes('password')) {

              const password = await promptPasswordForEmail(email); // implement your own modal
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
//               console.log('Facebook successfully linked to existing account');
              onLoginSuccess();
            }
          } else {
            throw error;
          }
        }
      } catch (err) {
//         console.error('Facebook login failed', err);
        setError('Facebook login failed');
      }
    };




  return (
    <View style={styles.container}>
      <Text style={styles.title}>MoolaCarb</Text>

      <Image
        source={require('../../assets/logo.png')} // Replace with your app logo
        style={styles.logo}
      />

      <Text style={styles.signInText}>Sign In</Text>

      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
          <Image source={require('../../assets/google.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} onPress={handleFacebookLogin}>
          <Image source={require('../../assets/facebook.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Image source={require('../../assets/apple.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Icon name="envelope" size={18} style={styles.inputIcon} />
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="lock" size={18} style={styles.inputIcon} />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
        <Text style={styles.signInTextButton}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>Don’t have an account?</Text>

      <TouchableOpacity style={styles.signUpButton}>
        <Text style={styles.signUpText} onPress={() => navigation.navigate('Signup')}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>— or —</Text>

      <TouchableOpacity>
        <Text style={styles.guestText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B1F34',
  },
  logo: {
    width: 80,
    height: 80,
    marginVertical: 20,
  },
  signInText: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 15,
  },
  socialRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  socialButton: {
    marginHorizontal: 10,
  },
  icon: {
    width: 30,
    height: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
    color: '#555',
  },
  input: {
    flex: 1,
    height: 40,
  },
  signInButton: {
    backgroundColor: '#58B368',
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    marginTop: 15,
    alignItems: 'center',
  },
  signInTextButton: {
    color: '#fff',
    fontWeight: 'bold',
  },
  forgotText: {
    color: '#58B368',
    marginTop: 10,
  },
  footerText: {
    marginTop: 15,
  },
  signUpButton: {
    borderWidth: 1,
    borderColor: '#58B368',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 25,
    marginTop: 5,
  },
  signUpText: {
    color: '#58B368',
    fontWeight: 'bold',
  },
  orText: {
    marginVertical: 15,
    color: '#aaa',
  },
  guestText: {
    color: '#58B368',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
