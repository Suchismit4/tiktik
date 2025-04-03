import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import LoginScreen from '../screens/Login'; // Updated path
import FeedScreen from '../screens/Feed';   // Updated path

const Stack = createStackNavigator();

SplashScreen.preventAutoHideAsync();

/**
 * AppNavigator Component
 *
 * This component sets up the main navigation stack for the application.
 * It includes screens for Login and the main Feed.
 * It also handles loading necessary fonts and hiding the splash screen.
 * headerShown is set to false to hide the default navigation header.
 */
const AppNavigator = () => {
  let [fontsLoaded, fontError] = useFonts({
    Inter_700Bold,
    'ClashDisplay': require('../assets/fonts/ClashDisplay.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Feed" 
          component={FeedScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 