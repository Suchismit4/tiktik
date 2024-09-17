import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync(); // Prevent auto-hiding the splash screen

export default function Navbar() {
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
        <View onLayout={onLayoutRootView} style={styles.container}>
            <Image
                style={styles.icons}
                source={{ uri: 'https://i.imgur.com/NQHACLa.png' }}
            />
            <View>
                <Text style={[styles.logo, { fontFamily: 'ClashDisplay' }]}>NewsNow</Text>
            </View>
            <Image
                style={[styles.icons, { width: 28, height: 28 }]}
                source={{ uri: 'https://i.imgur.com/fLX9236.png' }}
            />
        </View>
    );
}