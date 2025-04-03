import React from 'react';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator'; // Import the new navigator

/**
 * Main App Component
 *
 * This is the root component of the application.
 * It renders the main AppNavigator which handles screen transitions.
 */
export default function App() {
  return <AppNavigator />;
}

// Styles can be kept here or moved to a dedicated styles file if needed.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});


