/**
 * Custom hook for loading fonts in the application
 */
import { useState, useEffect } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Hook to load and manage custom fonts
 * 
 * This hook centralizes font loading logic and splash screen management
 * for consistent behavior across the app.
 * 
 * @returns {object} Font loading state information
 */
export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontsError, setFontsError] = useState(false);

  useEffect(() => {
    // Load fonts asynchronously
    const loadFonts = async () => {
      try {
        // Prevent the splash screen from auto-hiding
        await SplashScreen.preventAutoHideAsync();
        
        // Load custom fonts
        await Font.loadAsync({
          'ClashDisplay': require('../assets/fonts/ClashDisplay.ttf'),
          'Inter_700Bold': require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
        });
        
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsError(true);
      }
    };

    loadFonts();
  }, []);

  // Hide splash screen once fonts are loaded or if there's an error
  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  return { fontsLoaded, fontsError };
};

export default useFonts; 