import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();  // Prevent auto-hiding the splash screen

/**
 * PostInfo Component
 * 
 * Displays information related to a post, such as the caption and source.
 * Uses a custom font for the caption.
 * 
 * Note: Currently displays static text. Should be updated to accept props for dynamic content.
 */
export default function PostInfo() {    

    // State for font loading
    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);
  
    // Load the ClashDisplay font asynchronously
    useEffect(() => {
      const loadFonts = async () => {
        try {
          await Font.loadAsync({
            'ClashDisplay': require('../../assets/fonts/ClashDisplay.ttf'), // Path relative to this component
          });
          setFontLoaded(true);
        } catch (error) {
          setFontError(true);
          console.error("Error loading font in PostInfo:", error);
        }
      };

      loadFonts();
    }, []);
  
    // Hide the splash screen once fonts are loaded or an error occurs
    // Note: Consider centralizing splash screen logic.
    useEffect(() => {
        if (fontLoaded || fontError) {
          SplashScreen.hideAsync();
        }
      }, [fontLoaded, fontError]);
  
    // Render null if fonts are not yet loaded or there was an error
    if (!fontLoaded && !fontError) {
      return null;
    }
    
    // Render the component once fonts are ready
    return (
        <View style={styles.container}> 
            {/* Caption Text (Static for now) */}
            <Text style={[styles.caption, { fontFamily: 'ClashDisplay' }]}>
                A short caption similar to explanatory headline. 
            </Text>
            {/* Source Information Section (Static for now) */}
            <View style={styles.sourceInfo}>
                <Image
                    style={[styles.sourceImage]} 
                    source={{ uri: 'https://i.imgur.com/P8OOZMm.png' }} 
                />
                {/* Static source name */}
                <Text style={styles.sourceText}>USA Today</Text> 
            </View>
        </View>
    );
}
