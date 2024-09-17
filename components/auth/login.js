import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import styles from './style';
import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();  // Prevent auto-hiding the splash screen

export default function Login({ liked, scale }) {

    // Load the fonts using useFonts hook
    let [fontsLoaded, fontError] = useFonts({
        Inter_700Bold,
    });

    // Hide splash screen once fonts are loaded or an error occurs
    if (fontsLoaded) {
        SplashScreen.hideAsync();
    }

    // Return null if fonts are not yet loaded or there's an error
    if (!fontsLoaded && !fontError) {
        return null;
    }

    const likeIconURI = liked ? 'https://i.imgur.com/gcMzk8k.png' : 'https://i.imgur.com/UZT26iF.png';

    return (
        <KeyboardAvoidingView style={styles.container} behavior='padding'>
            <SafeAreaView>
                <View style={styles.inputContainer}>
                    <TextInput
                        placeholder='address@email.com'
                        // value={email} // Assuming you have state variables
                        // onChangeText={text => setEmail(text)}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder='password'
                        // value={password} // Assuming you have state variables
                        // onChangeText={text => setPassword(text)}
                        style={styles.input}
                        secureTextEntry
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => { /* Handle login action */ }}
                        style={[styles.button, styles.buttonOutline]}
                    >
                        <Text style={[styles.buttonText, { fontFamily: 'Inter_700Bold' }]}>Login</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={() => { /* Handle registration action */ }}
                        style={[styles.button, styles.buttonOutline]}
                    >
                        <Text style={[styles.buttonText, { fontFamily: 'Inter_700Bold' }]}>Register</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}
