/**
 * BottomBar Component
 * 
 * Displays the bottom navigation bar in the Feed screen.
 * Contains tabs for different sections of the app.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import styles from './styles';

/**
 * BottomBar Component
 * 
 * @returns {JSX.Element} The component JSX
 */
const BottomBar: React.FC = () => {
  /**
   * Tabs data for the bottom bar - updated to match old version
   */
  const tabs = [
    {
      id: 'local',
      label: 'Local',
      icon: 'https://i.imgur.com/FPWxlQu.png', 
      // active: true, // Removed active state
    },
    {
      id: 'foryou',
      label: 'For you',
      icon: 'https://i.imgur.com/ucdiIvc.png',
      // active: false, // Removed active state
    },
    {
      id: 'account',
      label: 'Account',
      icon: 'https://i.imgur.com/LHZMHpM.png',
      // active: false, // Removed active state
    },
    // Removed unused tabs
  ];

  return (
    <View style={styles.container}>
      <View style={styles.iconsHolder}>
        {/* Map over tabs to create bottom bar items */}
        {tabs.map((tab) => (
          // Use iconHolder style instead of tabItem
          // Removed TouchableOpacity for simplicity, matching old version structure closer
          <View key={tab.id} style={styles.iconHolder}>
            <Image
              source={{ uri: tab.icon }}
              // Apply icons style instead of tabIcon
              style={styles.icons}
              // Removed conditional active style
              onError={() => console.log(`Error loading ${tab.label} icon`)} // Added onError handler
            />
            {/* Apply title style instead of tabLabel */}
            <Text
              style={styles.title}
              // Removed conditional active style
            >
              {tab.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default BottomBar; 