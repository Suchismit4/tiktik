import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Animated} from 'react-native';
import styles from './style';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

SplashScreen.preventAutoHideAsync();  // Prevent splash screen from auto-hiding

export default function BottomBar() {    
    const [fontLoaded, setFontLoaded] = useState(false);
    const [fontError, setFontError] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);  // Dropdown visibility
    const dropdownAnimation = useRef(new Animated.Value(0)).current;  // Initial animation value


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

    const toggleDropdown = () => { // Handles the dropdown that is the account section
        if (dropdownVisible) {
            Animated.timing(dropdownAnimation, {
                toValue: 0,   // Collapse dropdown
                duration: 300,
                useNativeDriver: true,
            }).start(() => setDropdownVisible(false)); // Set dropdown invisible after animation completes
        } else {
            setDropdownVisible(true);  // Set dropdown visible before expanding
            Animated.timing(dropdownAnimation, {
                toValue: 1,   // Expand dropdown
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };

    // Render null if fonts are not loaded yet or there's an error
    if (!fontLoaded && !fontError) {
        return null;
    }

    // Define the dropdown style based on animation
    const dropdownTranslateY = dropdownAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [200, -500],  // Slide down from -150px to 0px
    });

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
                <TouchableOpacity onPress={toggleDropdown}>
                    <View style={styles.iconHolder}>
                        <Image
                            style={styles.icons}
                            source={{ uri: 'https://i.imgur.com/LHZMHpM.png' }}
                        />
                        <Text style={[styles.title, { fontFamily: 'ClashDisplay' }]}>Account</Text>
                    </View>
                </TouchableOpacity>
            </View>

         {/* Dropdown content */}
         {dropdownVisible && (
    <Animated.View style={[styles.dropdown, { transform: [{ translateY: dropdownTranslateY }] }]}>
        {/* Centering container */}
        <View style={{ alignItems: 'center' }}>
            {/* User Photo */}
            <Image
                style={styles.userPhoto}
                source={{ uri: 'https://i.imgur.com/JGmoHaP.jpeg' }}
            />
            <Text style={[styles.dropdownText, { fontFamily: 'ClashDisplay' }]}>Account Info</Text>
            <Text style={[styles.dropdownText, { fontFamily: 'ClashDisplay' }]}>Settings</Text>
            <Text style={[styles.dropdownText, { fontFamily: 'ClashDisplay' }]}>Logout</Text>
        </View>

        {/* Liked Videos Section */}
        <Text style={[styles.dropdownText, { fontFamily: 'ClashDisplay', marginTop: 20 }]}>
            Liked Videos
        </Text>

        {/* Video Thumbnails Gallery */}
        <View style={styles.galleryContainer}>
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
            <Image style={styles.galleryImage} source={{ uri: 'https://png.pngtree.com/template/20220505/ourmid/pngtree-breaking-news-logo-flat-vector-banner-image_1335485.jpg' }} />
        </View>
    </Animated.View>
)}


        </View>
    );

	    /* <View onLayout={onLayoutRootView} style={styles.container}>
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
    );*/
}
