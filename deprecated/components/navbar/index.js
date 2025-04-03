import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';

/**
 * Navbar Component
 * 
 * Displays the top navigation bar, including icons and the app logo.
 * Uses a custom font for the logo.
 */
export default function Navbar() {
    return (
        <View style={styles.container}>
            {/* Left Icon (Menu) - Assuming NQHACLa.png is menu */}
            <Image
                style={styles.icons}
                source={require('../../assets/images/tabler_menu.png')} // Use local asset
            />
            {/* App Logo */}
            <View>
                <Text style={[styles.logo, { fontFamily: 'ClashDisplay' }]}>NewsNow</Text>
            </View>
            {/* Right Icon (Search) - Assuming fLX9236.png is search */}
            <Image
                style={[styles.icons, { width: 28, height: 28 }]}
                source={require('../../assets/images/tabler_search.png')} // Use local asset
            />
        </View>
    );
}