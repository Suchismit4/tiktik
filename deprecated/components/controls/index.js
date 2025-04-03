import React from 'react';
import { View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import styles from './style';
// Removed font and splash screen imports as they are handled globally now
// import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';
// import * as SplashScreen from 'expo-splash-screen';

// SplashScreen.preventAutoHideAsync();  // Prevent splash screen from auto-hiding

/**
 * Controls Component
 * 
 * Displays overlay controls on a Post, specifically Like and Facts buttons.
 * Handles animations for the like button and uses custom fonts.
 * 
 * @param {object} props - Component props
 * @param {boolean} props.liked - Whether the post is currently liked.
 * @param {Animated.Value} props.scale - Animated value for the like button scale effect.
 * @param {function} props.onLikePress - Function to call when the like button is pressed.
 * @param {function} props.onFactsPress - Function to call when the facts button is pressed.
 */
export default function Controls({ liked, scale, onLikePress, onFactsPress }) {

    // Font loading and splash screen hiding are now handled in AppNavigator
    /*
    let [fontsLoaded, fontError] = useFonts({
        Inter_700Bold,
    });

    React.useEffect(() => {
      if (fontsLoaded || fontError) {
          SplashScreen.hideAsync();
      }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }
    */

    // Dynamically set the like icon based on the liked state
    const likeIconURI = liked ? 'https://i.imgur.com/gcMzk8k.png' : 'https://i.imgur.com/UZT26iF.png';

    return (
        <View style={styles.container}> {/* Main container for controls */}
            {/* Like Button Section */}
            <View style={styles.containerIcon}> 
                <TouchableOpacity onPress={onLikePress}> 
                    <Animated.View style={{ transform: [{ scale }] }}>
                        <Animated.Image
                            style={[styles.button]} 
                            source={{ uri: likeIconURI }} 
                        />
                    </Animated.View>
                </TouchableOpacity>
                <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>3.8K</Text>
            </View>
            
            <View style={styles.containerIcon}>
                <TouchableOpacity onPress={onFactsPress}> 
                    <Image
                        style={[styles.button]} 
                        source={{ uri: 'https://i.imgur.com/SNF08AQ.png' }} 
                    />
                </TouchableOpacity>
                <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>Facts</Text>
            </View>
        </View>
    );
}
