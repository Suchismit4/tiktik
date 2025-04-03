/**
 * AppNavigator Component
 * 
 * This module defines the main navigation structure for the TikTik application.
 * It implements a stack-based navigation system using React Navigation's createStackNavigator.
 * 
 * The navigator is wrapped with context providers:
 * - AuthProvider: Manages authentication state throughout the app
 * - VideoProvider: Manages video data and analytics
 * 
 * The navigation stack includes:
 * - Login: The authentication screen (initial route)
 * - Feed: The main content feed screen 
 * 
 * Both screens have their headers hidden for a more immersive UI experience.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screen components
import Login from '../screens/Login';
import Feed from '../screens/Feed';

// Import context providers
import { AuthProvider } from '../context/AuthContext';
import { VideoProvider } from '../context/VideoContext';

// Import types
import { RootStackParamList } from '../types';

/**
 * Create the stack navigator with type safety
 * 
 * The createStackNavigator function returns a set of components for managing
 * the navigation stack, with properly typed navigation props.
 */
const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator Component
 * 
 * Defines the app's navigation structure and wraps it with necessary providers
 * for global state management.
 * 
 * Key features:
 * - Provides a consistent navigation experience
 * - Maintains authentication state across the app
 * - Manages video data and analytics globally
 * 
 * @returns {JSX.Element} The Navigator component tree
 */
const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      {/* Wrap with AuthProvider to manage user authentication state */}
      <VideoProvider>
        {/* Wrap with VideoProvider to manage video data and analytics */}
        <NavigationContainer>
          {/* Configure the navigation stack */}
          <Stack.Navigator initialRouteName="Login">
            {/* Login Screen - Entry point for authentication */}
            <Stack.Screen 
              name="Login" 
              component={Login} 
              options={{ headerShown: false }} // Hide header for cleaner UI
            />
            
            {/* Feed Screen - Main content area */}
            <Stack.Screen 
              name="Feed" 
              component={Feed} 
              options={{ headerShown: false }} // Hide header for immersive experience
            />
          </Stack.Navigator>
        </NavigationContainer>
      </VideoProvider>
    </AuthProvider>
  );
};

export default AppNavigator; 