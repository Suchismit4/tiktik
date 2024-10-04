import React from 'react';
import { View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import styles from './style';
import { useFonts, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();  // Prevent splash screen from auto-hiding

export default function Controls({ liked, scale, onLikePress, onCommentPress }) {   
  
    // Load fonts using the useFonts hook
    let [fontsLoaded, fontError] = useFonts({
        Inter_700Bold,
    });

    // Hide the splash screen once fonts are loaded or an error occurs
    if (fontsLoaded) {
        SplashScreen.hideAsync();
    }

    // Return null if fonts are not loaded or there's an error
    if (!fontsLoaded && !fontError) {
        return null;
    }

    const likeIconURI = liked ? 'https://i.imgur.com/gcMzk8k.png' : 'https://i.imgur.com/UZT26iF.png';

    return (
        <View style={styles.container}>
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
                <TouchableOpacity onPress={onCommentPress}>
                    <Image
                        style={[styles.button]}
                        source={{ uri: 'https://i.imgur.com/YoBTj48.png' }}
                    />
                </TouchableOpacity>
                <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>482</Text>
            </View>
            <View style={styles.containerIcon}>
                <Image
                    style={[styles.button]}
                    source={{ uri: 'https://i.imgur.com/WvKdQhU.png' }}
                />
                <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>10</Text>
            </View>
        </View>
    );
}
