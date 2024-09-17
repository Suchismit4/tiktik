import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();  // Prevent splash screen from auto-hiding

export default function BottomBar() {    
    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);

    // Load the font asynchronously
    useEffect(() => {
        const loadFonts = async () => {
            try {
                await Font.loadAsync({
                    'ClashDisplay': require('../../assets/fonts/ClashDisplay.ttf'),
                });
                setFontLoaded(true);
            } catch (error) {
                setFontError(true);
                console.error("Error loading font", error);
            }
        };

        loadFonts();
    }, []);

    // Hide the splash screen once fonts are loaded or an error occurs
    const onLayoutRootView = useCallback(async () => {
        if (fontLoaded || fontError) {
            await SplashScreen.hideAsync();
        }
    }, [fontLoaded, fontError]);

    // Render null if fonts are not loaded yet or there's an error
    if (!fontLoaded && !fontError) {
        return null;
    }

    return (
        <View onLayout={onLayoutRootView} style={styles.container}>
            <View style={styles.iconsHolder}>
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/FPWxlQu.png' }}
                    />
                    <Text style={[styles.title, { fontFamily: 'ClashDisplay' }]}>Local</Text>
                </View>
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/ucdiIvc.png' }}
                    />
                    <Text style={[styles.title, { fontFamily: 'ClashDisplay' }]}>For you</Text>
                </View>
                <View style={styles.iconHolder}>
                    <Image
                        style={styles.icons}
                        source={{ uri: 'https://i.imgur.com/LHZMHpM.png' }}
                    />
                    <Text style={[styles.title, { fontFamily: 'ClashDisplay' }]}>Account</Text>
                </View>
            </View>
        </View>
    );
}
