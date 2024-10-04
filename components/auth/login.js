import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import { TextInput } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { auth } from '../../firebase';
import { useNavigation } from '@react-navigation/core';

import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';

SplashScreen.preventAutoHideAsync();  // Prevent auto-hiding the splash screen

export default function Login() {

    // Set hooks before to avoid render error.
    const [email, setEmail] = useState('')
    const [pwd, setPwd]     = useState('')

    const navigation = useNavigation()

    // Listen to Firebase Auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) { 
                navigation.navigate('Feed'); // Navigate to the 'Feed' screen if the user is authenticated
            }
        });

        return unsubscribe; // Clean up the listener on component unmount
    }, [navigation]); // Add navigation as a dependency

    // Handle user sign-up with Firebase Auth
    const handleSignUp = () => { 
        createUserWithEmailAndPassword(auth, email, pwd)
            .then(userCredentials => { 
                const user = userCredentials.user;
                console.log(user.email);
            })
            .catch(error => alert(error.message));
    };

    // Handle user login with Firebase Auth
    const handleLogin = () => {
        signInWithEmailAndPassword(auth, email, pwd)
            .then(userCredentials => { 
                const user = userCredentials.user;
                console.log(user.email);
            })
            .catch(error => alert(error.message));
    };


    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);
    

    // Load fonts asynchronously
    useEffect(() => {
      const loadFonts = async () => {
        try {
          await Font.loadAsync({
            'ClashDisplay': require('../../assets/fonts/ClashDisplay.ttf'),
          });
          setFontLoaded(true);
        } catch (error) {
          setFontError(true);
          console.error('Error loading font', error);
        }
      };

      loadFonts();
    }, []);

    // Hide the splash screen once fonts are loaded or an error occurs
    const onLayoutRootView = useCallback(async () => {
      if (fontLoaded || fontError) {
        await SplashScreen.hideAsync();
      }
    }, [fontLoaded, fontError]);

    // Return null if fonts are not yet loaded or there's an error
    if (!fontLoaded && !fontError) {
      return null;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
            onLayout={onLayoutRootView}
        >
        <View style={styles.logoContainer}>
            <Text style={[styles.logo, { fontFamily: 'ClashDisplay' }]}>NewsNow</Text>
        </View>
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={text => setEmail(text)}
                    style={styles.input}
                    placeholderTextColor="#130f40"
                />
                <TextInput
                    placeholder="Password"
                    value={pwd}
                    onChangeText={text => setPwd(text)}
                    style={styles.input}
                    secureTextEntry
                    placeholderTextColor="#130f40"
                />
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    onPress={handleLogin}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleSignUp}
                    style={[styles.button, styles.buttonOutline]}
                >
                    <Text style={styles.buttonOutlineText}>Register</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
