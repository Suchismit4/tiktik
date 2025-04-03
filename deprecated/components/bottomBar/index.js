import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';

/**
 * BottomBar Component
 * 
 * Displays the bottom navigation bar with icons and titles for different sections.
 * Uses a custom font for titles (although it seems unused currently).
 */
export default function BottomBar() {    
    return (
        // Using onLayout might be redundant now
        <View style={styles.container}>
            <View style={styles.iconsHolder}> {/* Container for the icons */}
                {/* Local Section Icon */}
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/FPWxlQu.png' }} 
                        onError={() => console.log("Error loading Local icon")}
                    />
                    <Text style={styles.title}>Local</Text>
                </View>
                {/* For You Section Icon */}
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/ucdiIvc.png' }} 
                        onError={() => console.log("Error loading For you icon")}
                    />
                    <Text style={styles.title}>For you</Text>
                </View>
                {/* Account Section Icon */}
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/LHZMHpM.png' }} 
                        onError={() => console.log("Error loading Account icon")}
                    />
                    <Text style={styles.title}>Account</Text>
                </View>
            </View>
        </View>
    );
}
