import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Login from './components/auth/login';
import Feed from './components/feed';

const Stack = createStackNavigator();

export default function App() {
  return (
          <Feed />
    // <NavigationContainer>
    //   <Stack.Navigator>
    //     <Stack.Screen options={{headerShown: false}} name="Login" component={Login} />
    //     <Stack.Screen options={{headerShown: false}} name="Feed" component={Feed} />
    //   </Stack.Navigator>
    // </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});


