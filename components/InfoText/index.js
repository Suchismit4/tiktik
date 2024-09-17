import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();  // Prevent auto-hiding the splash screen

export default function PostInfo() {    

    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);
  
    // Load the custom font asynchronously
    useEffect(() => {
      const loadFonts = async () => {
        try {
          await Font.loadAsync({
            'ClashDisplay': require('../../assets/fonts/ClashDisplay.ttf'),
          });
          setFontLoaded(true);
        } catch (error) {
          setFontError(true);
          console.error("Error loading font", error);
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
            <Text style={[styles.caption, { fontFamily: 'ClashDisplay' }]}>
                A short caption similar to explanatory headline.
            </Text>
            <View style={styles.sourceInfo}>
                <Image
                    style={[styles.sourceImage]}
                    source={{ uri: 'https://i.imgur.com/P8OOZMm.png' }}
                />
                <Text style={styles.sourceText}>USA Today</Text>
            </View>
        </View>
    );
}
