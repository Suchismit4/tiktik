import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import styles from './style';
import Controls from '../controls';
import PostInfo from '../InfoText';
import { GestureHandlerRootView, TapGestureHandler, State, PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

/**
 * Post Component
 * 
 * Represents a single video post in the feed.
 * Uses Expo AV for video playback and react-native-gesture-handler for interactions (double tap to like, swipe down on facts).
 * Includes Controls and PostInfo components as overlays.
 * Exposes playback control methods (play, pause, unload) via forwardRef.
 * 
 * @param {object} props - Component props
 * @param {string} props.uri - The URI of the video source.
 * @param {function} ref - Forwarded ref from the parent component (Feed).
 */
const Post = forwardRef((props, parentRef) => {
  const videoRef = useRef(null); // Ref for the Video component
  const [liked, setLiked] = useState(false); // State for the like status
  const scaleValue = useRef(new Animated.Value(1)).current; // Animated value for like button scaling
  // State and animated value for the facts section visibility and animation
  const [showFacts, setShowFacts] = useState(false); // Not directly used? Animation controls visibility
  const factsSlideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible

  /**
   * Handles the double-tap gesture on the video.
   * Toggles the like state (if not already liked) and triggers an animation & haptic feedback.
   */
  const onDoubleTap = (event) => {
    // Ensure the gesture has ended before processing
    if (event.nativeEvent.state === State.END) {
      if (!liked) { // Only trigger like on the first double-tap if not already liked
        setLiked(true); // Set liked state
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Trigger haptic feedback
      }
      // Like animation sequence (spring out, spring back)
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 3, // Scale up factor
          friction: 2, // Bounciness
          useNativeDriver: true, // Use native driver for performance
        }),
        Animated.spring(scaleValue, {
          toValue: 1, // Scale back to original size
          friction: 2,
          useNativeDriver: true,
        }),
      ]).start(); // Start the animation sequence
    }
  };

  /**
   * Handles pressing the dedicated like button in the Controls component.
   * Toggles the like state and triggers haptic feedback.
   */
  const onLikePress = () => {
    setLiked(prevLiked => !prevLiked); // Toggle liked state
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Trigger haptic feedback
  };

  /**
   * Toggles the visibility of the Facts section with a sliding animation.
   * Called when the Facts button in Controls is pressed.
   */
  const toggleFacts = () => {
    Animated.timing(factsSlideAnim, {
      toValue: factsSlideAnim._value === 0 ? 1 : 0, // Toggle between 0 and 1
      duration: 300, // Animation duration
      useNativeDriver: false, // translateY/opacity animation might require false
    }).start();
  };

  /**
   * Dismisses the Facts section with a sliding animation.
   * Called when swiping down on the Facts section or pressing its close button.
   */
  const dismissFactsSection = () => {
    Animated.timing(factsSlideAnim, {
      toValue: 0, // Slide down (hide)
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Style object for the animated facts section (controls position and opacity)
  const factsSectionStyle = {
    transform: [
      {
        translateY: factsSlideAnim.interpolate({
          inputRange: [0, 1], // Input animation value range
          outputRange: [300, 0], // Output translation (starts off-screen below, slides up)
        }),
      },
    ],
    opacity: factsSlideAnim, // Fade in/out with the slide
  };

  /**
   * Exposes essential video control methods (play, pause, unload) 
   * to the parent component (Feed) via the forwarded ref.
   * This allows Feed to control playback based on visibility.
   */
  useImperativeHandle(parentRef, () => ({
    play, // Expose play function
    unload, // Expose unload function
    pause // Expose pause function
  }), []); // Empty dependency array ensures this runs only once

  // Effect hook to ensure video resources are released when the component unmounts
  useEffect(() => {
    return () => unload(); // Call unload on unmount
  }, []); // Empty dependency array

  // --- Playback Control Methods --- 

  /** Plays the video. */
  const play = async () => {
    if (videoRef.current == null) return; // Guard against null ref
    try {
      await videoRef.current.playAsync(); // Start/resume playback
    } catch (e) {
      console.error("Error playing video:", e);
    }
  };

  /** Pauses the video. */
  const pause = async () => {
    if (videoRef.current == null) return; // Guard against null ref
    try {
      await videoRef.current.pauseAsync(); // Pause playback
    } catch (e) {
      console.error("Error pausing video:", e);
    }
  };

  /** Unloads the video from memory to free up resources. */
  const unload = async () => {
    if (videoRef.current == null) return; // Guard against null ref
    try {
      await videoRef.current.unloadAsync(); // Unload video resources
    } catch (e) { 
      // Can sometimes throw errors if already unloaded or in a bad state
      console.log("Error unloading video (potentially harmless):", e); 
    }
  };

  // --- Render --- 
  return (
    // Root view required for react-native-gesture-handler
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Tap handler for double-tap-to-like gesture */}
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
        {/* Animated view wrapper for the video (can be used for other animations if needed) */}
        <Animated.View style={styles.container}> 
          <Video
            ref={videoRef} // Assign ref for playback control
            style={[styles.container]} // Video takes full container size
            resizeMode="cover" // Cover ensures video fills the space, potentially cropping
            shouldPlay={false} // Don't autoplay initially (controlled by Feed screen)
            isLooping // Loop the video automatically
            source={{ uri: props.uri }} // Video source URI from props
          />
        </Animated.View>
      </TapGestureHandler>

      {/* Overlay: Controls (Like/Facts buttons) */}
      <Controls
        liked={liked} // Pass liked state
        scale={scaleValue} // Pass animation scale value
        onLikePress={onLikePress} // Pass like button handler
        onFactsPress={toggleFacts} // Pass facts toggle handler
      />

      {/* Overlay: Post Info (Caption/Source) - Wrapped in SafeAreaView */}
      <View style={styles.postinfo}>
        <SafeAreaView> 
          <PostInfo />
        </SafeAreaView>
      </View>

      {/* Overlay: Facts Section (Animated & Gesture Controlled) */}
      {/* Pan handler for swipe-down-to-dismiss gesture */}
      <PanGestureHandler onGestureEvent={(event) => {
        // Check if the swipe gesture is downwards and exceeds a threshold
        if (event.nativeEvent.translationY > 50 && event.nativeEvent.state === State.ACTIVE) {
          dismissFactsSection();
        }
      }}>
        {/* Animated view for the facts section itself */}
        <Animated.View style={[styles.factsSection, factsSectionStyle]}>
          {/* Close button for the facts section */}
          <TouchableOpacity onPress={dismissFactsSection} style={styles.closeButtonContainer}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          {/* Placeholder content for the facts section */}
          <Text>Facts Section Content</Text> 
          {/* TODO: Replace this placeholder with actual facts content. 
               This might involve fetching data or receiving it via props. */}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
});

export default Post;