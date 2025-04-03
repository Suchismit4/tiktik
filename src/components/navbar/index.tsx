/**
 * Navbar Component
 * 
 * Displays the top navigation bar in the Feed screen.
 * Contains the app logo and navigation icons.
 */
import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './styles';

/**
 * Navbar Component - Updated to match old version
 * 
 * @returns {JSX.Element} The component JSX
 */
const Navbar: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Left Icon (Menu) */}
      <Image
        style={styles.icons}
        source={require('../../assets/images/tabler_menu.png')} 
      />
      
      {/* App Logo - Keep existing logo text and style */}
      <Text style={[styles.logo]}> 
        NewsNow
      </Text>

      {/* Right Icon (Search) - Apply specific size override like old version */}
      <Image
        style={[styles.icons, { width: 28, height: 28 }]} 
        source={require('../../assets/images/tabler_search.png')} 
      />
    </View>
  );
};

export default Navbar; 