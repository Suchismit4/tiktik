/**
 * Main App Component
 *
 * This is the root component of the application.
 * It renders the main AppNavigator which handles screen transitions.
 */
import React from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings if they're not relevant
LogBox.ignoreLogs([
  'Require cycle:', // Ignore require cycle warnings which are often false positives
  'VirtualizedLists should never be nested', // Common warning with FlatList
]);

/**
 * App Component
 * 
 * @returns {JSX.Element} The root component
 */
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

export default App; 