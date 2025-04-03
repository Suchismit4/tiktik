import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import { TextInput } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { auth } from '../../config/firebase';
import { useNavigation } from '@react-navigation/core';

import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from 'firebase/auth';

SplashScreen.preventAutoHideAsync();  // Prevent auto-hiding the splash screen

/**
 * Login Screen Component
 * 
 * Handles user authentication (login and registration) using Firebase Auth.
 * Navigates to the Feed screen upon successful authentication.
 * Includes email/password input fields and buttons.
 * Loads a custom font for the logo.
 */
export default function Login() {

    // State for email and password input fields
    const [email, setEmail] = useState('')
    const [pwd, setPwd]     = useState('')

    // Navigation hook to enable screen transitions
    const navigation = useNavigation()

    // Effect to listen for Firebase authentication state changes
    useEffect(() => {
        // onAuthStateChanged returns an unsubscribe function
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) { // If user is logged in
                // Navigate to the main Feed screen
                // Consider adding navigation.replace('Feed') to prevent going back to Login
                navigation.navigate('Feed'); 
            }
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return unsubscribe; 
    }, [navigation]); // Dependency array includes navigation

    /**
     * Handles user registration using Firebase email/password authentication.
     */
    const handleSignUp = () => { 
        createUserWithEmailAndPassword(auth, email, pwd)
            .then(userCredentials => { 
                const user = userCredentials.user;
                console.log('Registered with:', user.email); // Log success
                // Optionally navigate to Feed immediately after registration
                // navigation.navigate('Feed'); 
            })
            .catch(error => alert(error.message)); // Display errors to the user
    };

    /**
     * Handles user login using Firebase email/password authentication.
     */
    const handleLogin = () => {
        signInWithEmailAndPassword(auth, email, pwd)
            .then(userCredentials => { 
                const user = userCredentials.user;
                console.log('Logged in with:', user.email); // Log success
                // Navigation is handled by the onAuthStateChanged listener
            })
            .catch(error => alert(error.message)); // Display errors to the user
    };

    // State for font loading
    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);
    
    // Effect to load the ClashDisplay font asynchronously
    useEffect(() => {
      const loadFonts = async () => {
        try {
          await Font.loadAsync({
            'ClashDisplay': require('../../assets/fonts/ClashDisplay.ttf'),
          });
          setFontLoaded(true);
        } catch (error) {
          setFontError(true);
          console.error('Error loading font in Login:', error);
        }
      };

      loadFonts();
    }, []);

    // Hide the splash screen once fonts are loaded or an error occurs
    // Note: Consider centralizing splash screen logic
    useEffect(() => {
      if (fontLoaded || fontError) {
        SplashScreen.hideAsync();
      }
    }, [fontLoaded, fontError]);

    // Render null if fonts are not yet loaded or there's an error
    if (!fontLoaded && !fontError) {
      return null;
    }

    // Render the Login form
    return (
        // Use KeyboardAvoidingView to prevent keyboard from covering inputs
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding" // Adjust behavior based on OS (padding or height)
            // onLayout might be redundant if splash screen handled elsewhere
        >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
            <Text style={[styles.logo, { fontFamily: 'ClashDisplay' }]}>NewsNow</Text>
        </View>
        {/* Input Fields Section */}
        <View style={styles.inputContainer}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholderTextColor="#130f40"
                keyboardType="email-address" // Use appropriate keyboard type
                autoCapitalize="none" // Don't auto-capitalize email
            />
            <TextInput
                placeholder="Password"
                value={pwd}
                onChangeText={setPwd}
                style={styles.input}
                secureTextEntry // Hide password characters
                placeholderTextColor="#130f40"
            />
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
            {/* Login Button */}
            <TouchableOpacity
                onPress={handleLogin}
                style={styles.button}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            {/* Register Button */}
            <TouchableOpacity
                onPress={handleSignUp}
                style={[styles.button, styles.buttonOutline]} // Apply multiple styles
            >
                <Text style={styles.buttonOutlineText}>Register</Text>
            </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
    );
}
