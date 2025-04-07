/**
 * Post Component
 * 
 * A comprehensive component that represents a single video post in the TikTik feed.
 * This component is responsible for:
 * - Video playback using Expo AV
 * - Gesture handling (double tap to like, swipe to dismiss)
 * - Animated interactions (heart animation, facts slide-up panel)
 * - User engagement features (likes, information display)
 * 
 * The component uses forwardRef to expose video control methods to parent components,
 * allowing the Feed screen to control video playback when items scroll in/out of view.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, SafeAreaView, Animated, TouchableOpacity, Dimensions, Image} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { 
  GestureHandlerRootView, 
  TapGestureHandler, 
  State, 
  PanGestureHandler, 
  LongPressGestureHandler 
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import styles from './styles';
import Controls from '../controls';
import PostInfo from '../PostInfo';
import { Post as PostType, VideoRef } from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Props interface for the Post component
 * @typedef {Object} PostProps
 * @property {PostType} data - The data object containing video information
 */
interface PostProps {
  data: PostType;
}

// Interface for tap heart animation state
interface TapHeartState {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
}

/**
 * Post Component
 * 
 * Renders a video post with interactive elements and animations.
 * 
 * Key features:
 * - Video playback with Expo AV
 * - Double-tap gesture to like with heart animation
 * - Slide-up information panel
 * - Gradient overlay for better text visibility
 * - Haptic feedback for interactions
 * 
 * @param {PostProps} props - Component props containing post data
 * @param {React.Ref<VideoRef>} ref - Forwarded ref for parent component to control video
 * @returns {JSX.Element} The rendered Post component
 */
const Post = forwardRef<VideoRef, PostProps>(({ data }, parentRef) => {
  // Add a unique ID for debugging
  const componentId = useRef(`post-${Math.random().toString(36).substr(2, 9)}`).current;
  // Log component rendering
  console.log(`[Post ${componentId}] Rendering post for video: ${data.uri.substring(0, 20)}...`);
  
  // Reference to the video player for controlling playback
  const videoRef = useRef<Video>(null);
  
  // Reference to double tap gesture handler
  const doubleTapRef = useRef(null);
  
  // Reference to single tap gesture handler (for improved gesture coordination)
  const singleTapRef = useRef(null);

  // Track mount state to fix potential gesture handler issues
  const isMounted = useRef(true);
  
  // State to track if the post is liked by the user
  const [liked, setLiked] = useState<boolean>(false);

  // --- NEW STATE for Tap Hearts ---
  const [tapHearts, setTapHearts] = useState<TapHeartState[]>([]);
  const heartAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // To manage cleanup
  
  // Animated value for the heart scale animation when double-tapped
  // const scaleValue = useRef(new Animated.Value(1)).current;
  
  // Animated opacity value for the heart animation
  // const opacityValue = useRef(new Animated.Value(0)).current;
  
  // Animated value for sliding the facts panel up/down
  const factsSlideAnim = useRef(new Animated.Value(0)).current;

  // New animated value specifically for the Controls component scale effect
  const controlsScaleAnim = useRef(new Animated.Value(1)).current;
  
  // State to track if the facts panel is visible
  const [isFactsVisible, setIsFactsVisible] = useState(false);

  // Add a state to track if the component is ready for gestures
  const [gesturesReady, setGesturesReady] = useState(false);

  /**
   * Trigger the heart animation
   * Separated for reuse in both gesture handlers
   */
  const triggerHeartAnimation = (x: number, y: number) => {
    let likedStateChanged = false; // Flag to check if we actually liked it now
    if (!liked) {
      setLiked(true); // Update the like state for the side button
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (likedStateChanged) {
      // Simple bounce animation for the Controls button
      Animated.sequence([
          Animated.timing(controlsScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
          Animated.timing(controlsScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
  }
    
    const newHeartId = Date.now(); // Simple unique ID
    const scale = new Animated.Value(0); // Start scale at 0
    const opacity = new Animated.Value(1); // Start opacity at 1

    // Add the new heart to state to render it
    const newHeart: TapHeartState = { id: newHeartId, x, y, scale, opacity };
    // Only show the latest heart animation
    setTapHearts([newHeart]);
    
  // Old heart animation:
  //   // Create Instagram-like heart animation sequence with longer, smoother bounce
  //   Animated.parallel([
  //     // Scale animation - Smooth bounce effect from the center
  //     Animated.sequence([
  //       // First phase: Quick pop up
  //       Animated.spring(scaleValue, {
  //         toValue: 1.4,    // Pop up slightly larger for more dramatic effect
  //         tension: 120,    // Less tension for a slower initial spring
  //         friction: 8,     // Less friction for more bounce
  //         useNativeDriver: true,
  //       }),
  //       // Second phase: Smooth bounce back
  //       Animated.spring(scaleValue, {
  //         toValue: 0.9,    // Bounce back to slightly smaller
  //         tension: 70,     // Lower tension for smoother transition
  //         friction: 5,     // Lower friction for more bounce
  //         useNativeDriver: true,
  //       }),
  //       // Third phase: Settle to final size with slight bounce
  //       Animated.spring(scaleValue, {
  //         toValue: 1.1,    // Bounce slightly larger
  //         tension: 60,
  //         friction: 7,
  //         useNativeDriver: true,
  //       }),
  //       // Final phase: Settle to exactly 1.0
  //       Animated.spring(scaleValue, {
  //         toValue: 1.0,
  //         tension: 50,
  //         friction: 6,
  //         useNativeDriver: true,
  //       }),
  //     ]),
      
  //     // Opacity animation - Keep visible longer, then fade out
  //     Animated.sequence([
  //       // Keep fully visible during animations
  //       Animated.timing(opacityValue, {
  //         toValue: 1,
  //         duration: 850,   // Extend the visibility time by ~0.4 seconds
  //         useNativeDriver: true,
  //       }),
  //       // Fade out
  //       Animated.timing(opacityValue, {
  //         toValue: 0,
  //         duration: 300,   // Slower fade out
  //         useNativeDriver: true,
  //       }),
  //     ]),
  //   ]).start();
  // };

  // New heart animation:

  // Animation Sequence: Appear -> Grow Big -> Shrink Slightly -> Fade Out
  Animated.sequence([
      // Grow Big
      Animated.spring(scale, {
          toValue: 1.4, // Scale up factor
          friction: 3, // Bounciness
          tension: 80,
          useNativeDriver: true,
      }),
      // Shrink Slightly (optional subtle effect)
      Animated.timing(scale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
      }),
      // Hold visibility briefly
      Animated.delay(300),
      // Parallel: Fade out while maybe slightly shrinking further
      Animated.parallel([
          Animated.timing(opacity, {
              toValue: 0,
              duration: 300, // Fade out duration
              useNativeDriver: true,
          }),
          Animated.timing(scale, { // Optional shrink while fading
              toValue: 0.8,
              duration: 300,
              useNativeDriver: true,
          }),
      ])
  ]).start(() => {
      // Remove the heart from state after animation completes
      setTapHearts(currentHearts => currentHearts.filter(h => h.id !== newHeartId));
      console.log(`[Post ${componentId}] Tap heart animation finished and removed.`);
  });

  // Clear any existing timeout to prevent premature removal if tapped again quickly
  if (heartAnimationTimeoutRef.current) {
      clearTimeout(heartAnimationTimeoutRef.current);
  }
  // Fallback cleanup: Ensure heart is removed if animation hangs (e.g., unmount)
  heartAnimationTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
          setTapHearts(currentHearts => currentHearts.filter(h => h.id !== newHeartId));
          console.log(`[Post ${componentId}] Tap heart removed by fallback timeout.`);
      }
  }, 2000); // Adjust timeout duration as needed (e.g., 1500ms)

  };


  /**
   * Handles double-tap gesture on the video
   * When a double-tap is detected:
   * 1. Sets the post as liked if not already
   * 2. Triggers haptic feedback
   * 3. Animates the heart scale for visual feedback (Instagram-like animation)
   * 
   * @param {any} event - The gesture event from react-native-gesture-handler
   */
  // const onDoubleTap = (event: any) => {
  //   console.log(`[Post ${componentId}] [DoubleTap] State:`, event.nativeEvent.state, 'State.ACTIVE:', State.ACTIVE, 'State.END:', State.END);
    
  //   // Key fix: React Native Gesture Handler states - BEGIN(1), ACTIVE(2), CANCELLED(3), FAILED(4), END(5)
  //   // For double tap, we need to check for State.ACTIVE (2) which indicates a successful recognition
  //   if (event.nativeEvent.state === State.ACTIVE) {
  //     console.log(`[Post ${componentId}] [DoubleTap] Triggered successfully!`);
  //     triggerHeartAnimation();
  //   }
  // };

  // --- MODIFIED Double Tap Handler ---
  const onDoubleTap = (event: any) => {
    console.log(`[Post ${componentId}] [DoubleTap] State:`, event.nativeEvent.state, 'State.ACTIVE:', State.ACTIVE);

    if (event.nativeEvent.state === State.ACTIVE) {
        const { absoluteX, absoluteY } = event.nativeEvent;
        console.log(`[Post ${componentId}] [DoubleTap] Triggered at X: ${absoluteX}, Y: ${absoluteY}`);
        // --- Call the NEW animation trigger ---
        triggerHeartAnimation(absoluteX, absoluteY);
    }
};

  /**
   * Handles single tap on the video (for better coordination with double tap)
   * Currently just a placeholder to assist with double tap recognition
   */
  const onSingleTap = (event: any) => {
    console.log(`[Post ${componentId}] [SingleTap] State:`, event.nativeEvent.state);
    // Optional: Add functionality for single tap
    // This is mainly here to improve double tap recognition
  };

  /**
   * Toggles the liked state when the like button is pressed
   * This is called from the Controls component
   */
  // const onLikePress = () => {
  //   setLiked(prevLiked => !prevLiked);
  // };

  const onLikePress = () => {
    // Toggle liked state - this controls the side button via Controls component
    const newLikedState = !liked;
    setLiked(newLikedState);
    if (newLikedState) {
      // Liked via button press
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Trigger bounce animation
      Animated.sequence([
          Animated.timing(controlsScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
          Animated.timing(controlsScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
  } else {
      // Unliked via button press - Reset scale immediately (optional)
      controlsScaleAnim.setValue(1);
  }
};


  /**
   * Toggles the visibility of the facts section with animation
   * The facts section slides up from the bottom when shown
   */
  const toggleFacts = () => {
    const newValue = !isFactsVisible;
    setIsFactsVisible(newValue);
    
    // Animate the facts panel sliding up or down
    Animated.timing(factsSlideAnim, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  /**
   * Dismisses the facts section with animation
   * Called when user taps the close button or swipes down
   */
  const dismissFactsSection = () => {
    setIsFactsVisible(false);
    
    // Animate the facts panel sliding down
    Animated.timing(factsSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Dynamic styles for the animated facts section
  // Transforms the position and opacity based on the animation value
  const factsSectionStyle = {
    transform: [
      {
        translateY: factsSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0], // Slides up from 300 points below
        }),
      },
    ],
    opacity: factsSlideAnim, // Fades in/out with the slide
  };

  /**
   * Expose video control methods to parent component via ref
   * This allows the parent component (Feed) to control video playback
   * when items scroll in and out of view
   */
  useImperativeHandle(parentRef, () => ({
    /**
     * Play the video
     * @returns {Promise<void>} A promise that resolves when playback starts
     */
    play: async () => {
      if (videoRef.current == null) return;
      try {
        await videoRef.current.playAsync();
      } catch (e) {
        console.error("Error playing video:", e);
      }
    },
    
    /**
     * Pause the video
     * @returns {Promise<void>} A promise that resolves when playback pauses
     */
    pause: async () => {
      if (videoRef.current == null) return;
      try {
        await videoRef.current.pauseAsync();
      } catch (e) {
        console.error("Error pausing video:", e);
      }
    },
    
    /**
     * Unload the video to free resources
     * @returns {Promise<void>} A promise that resolves when video is unloaded
     */
    unload: async () => {
      if (videoRef.current == null) return;
      try {
        await videoRef.current.unloadAsync();
      } catch (e) {
        console.log("Error unloading video (potentially harmless):", e);
      }
    }
  }), []);

  /**
   * Setup effect to ensure gesture handlers are properly initialized
   */
  // --- (useEffect for mounting/unmounting remains similar, ensure timeouts are cleared) ---
  useEffect(() => {
    console.log(`[Post ${componentId}] Component mounted.`);
    isMounted.current = true;
    setGesturesReady(false); // Gestures not ready initially

    // Simplified gesture readiness logic
     const readyTimer = setTimeout(() => {
        if (isMounted.current) {
            console.log(`[Post ${componentId}] Marking gestures as ready.`);
            setGesturesReady(true);
        }
    }, 150); // Delay to allow layout and handlers to settle

    return () => {
        console.log(`[Post ${componentId}] Component unmounting.`);
        isMounted.current = false;
         clearTimeout(readyTimer); // Clear readiness timer
         // Clear animation fallback timer on unmount
        if (heartAnimationTimeoutRef.current) {
            clearTimeout(heartAnimationTimeoutRef.current);
        }
        // Unload video
        videoRef.current?.unloadAsync().catch(e => console.log("Unmount Unload Error:", e));
    };
}, [data.uri, componentId]);

  // useEffect(() => {
  //   console.log(`[Post ${componentId}] Component mounted for video: ${data.uri.substring(0, 20)}...`);
  //   isMounted.current = true;
    
  //   // Mark gesture system as not ready initially
  //   setGesturesReady(false);
    
  //   // Prime the gesture handlers with fake events to ensure they're ready
  //   setTimeout(() => {
  //     if (isMounted.current) {
  //       console.log(`[Post ${componentId}] Priming gesture handlers`);
  //       // Create a synthetic event to initialize the handlers
  //       const syntheticEvent = {
  //         nativeEvent: {
  //           state: State.BEGAN,
  //           numberOfPointers: 1
  //         }
  //       };
        
  //       // Force pre-activation of gesture handlers to ensure they're ready
  //       if (doubleTapRef.current) {
  //         try {
  //           // @ts-ignore - Accessing internal methods to prime the handlers
  //           const handler = doubleTapRef.current;
  //           if (handler._onGestureHandlerEvent) {
  //             handler._onGestureHandlerEvent(syntheticEvent);
  //             console.log(`[Post ${componentId}] Primed double tap handler`);
  //           }
  //         } catch (e) {
  //           console.log(`[Post ${componentId}] Error priming double tap:`, e);
  //         }
  //       }
        
  //       // Mark gesture system as ready after priming
  //       setGesturesReady(true);
  //     }
  //   }, 100); // Short delay after mount
    
  //   return () => {
  //     console.log(`[Post ${componentId}] Component unmounting for video: ${data.uri.substring(0, 20)}...`);
  //     isMounted.current = false;
  //     if (videoRef.current) {
  //       videoRef.current.unloadAsync().catch(e => {
  //         console.log(`[Post ${componentId}] Error unloading video on unmount:`, e);
  //       });
  //     }
  //   };
  // }, [data.uri, componentId]);

  /**
   * Add effect to specifically monitor and refresh gesture handlers when component remounts
   */
  useEffect(() => {
    // Function to reset and reinitialize the gesture handlers
    const resetGestureHandlers = () => {
      console.log(`[Post ${componentId}] Refreshing gesture handlers`);
      
      // Clear any lingering gesture state
      if (doubleTapRef.current) {
        // @ts-ignore - Accessing internal methods for debugging purposes
        const handler = doubleTapRef.current;
        if (handler.handlerTag) {
          console.log(`[Post ${componentId}] Double tap handler exists with tag: ${handler.handlerTag}`);
          
          // Force gesture state reset to ensure clean slate
          if (handler.reset) {
            try {
              handler.reset();
              console.log(`[Post ${componentId}] Double tap handler was reset`);
            } catch (e) {
              console.log(`[Post ${componentId}] Could not reset double tap handler:`, e);
            }
          }
        } else {
          console.log(`[Post ${componentId}] Double tap handler doesn't have a tag yet`);
        }
      }
      
      // Do the same for single tap
      if (singleTapRef.current) {
        // @ts-ignore
        const handler = singleTapRef.current;
        if (handler.handlerTag) {
          console.log(`[Post ${componentId}] Single tap handler exists with tag: ${handler.handlerTag}`);
          if (handler.reset) {
            try {
              handler.reset();
              console.log(`[Post ${componentId}] Single tap handler was reset`);
            } catch (e) {
              console.log(`[Post ${componentId}] Could not reset single tap handler:`, e);
            }
          }
        }
      }
    };
    
    // Call immediately on mount
    resetGestureHandlers();
    
    // Set up multiple reset attempts with increasing delays
    const timeoutIds = [];
    [50, 200, 500].forEach(delay => {
      const id = setTimeout(() => {
        // Additional reset after various delays to ensure handlers are fully registered
        if (isMounted.current) {
          resetGestureHandlers();
        }
      }, delay);
      timeoutIds.push(id);
    });
    
    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      console.log(`[Post ${componentId}] Cleaning up gesture handlers`);
    };
  }, [data.uri, componentId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Fix double tap recognition with proper gesture handler nesting */}
      {/* Single Tap layer (outer) */}
      <TapGestureHandler
                ref={singleTapRef}
                numberOfTaps={1}
                onHandlerStateChange={(event) => {
                    if (isMounted.current && gesturesReady) {
                        onSingleTap(event);
                    }
                }}
                waitFor={doubleTapRef} // Wait for double tap to fail
                maxDelayMs={250} // Standard delay window
                shouldCancelWhenOutside={false}
                enabled={gesturesReady}
            >
                <Animated.View style={styles.container}>
                    {/* Double Tap layer (inner) */}
                    <TapGestureHandler
                        ref={doubleTapRef}
                        numberOfTaps={2}
                        onHandlerStateChange={(event) => {
                            if (isMounted.current && gesturesReady) {
                                onDoubleTap(event);
                            }
                        }}
                        maxDurationMs={300} // Time between taps
                        // maxDeltaX/Y not strictly needed for tap but okay
                        shouldCancelWhenOutside={false}
                        enabled={gesturesReady}
                    >
                        <Animated.View style={styles.container}>
                            {/* Video player */}
                            <Video
                                ref={videoRef}
                                style={styles.videoPlayer} // Use specific style
                                resizeMode={ResizeMode.COVER}
                                shouldPlay={false}
                                isLooping
                                source={{ uri: data.uri }}
                                onError={(error) => console.error(`[Post ${componentId}] Video Error:`, error)}
                            />

                             {/* --- REMOVED Centered Heart Animation --- */}
                            {/* <Animated.View style={[ styles.heartContainer, ... ]}> ... </Animated.View> */}

                           {tapHearts.map(heart => (
                                <Animated.View
                                    key={heart.id}
                                    style={[
                                        styles.tapHeartBase, // Base style for absolute positioning
                                        {
                                            // Position the *container* so its top-left is near the tap
                                            // Adjustments position the center of the heart group near the tap
                                            left: heart.x - (styles.tapHeartIcon.width / 2), // Center horizontally relative to tap X
                                            top: heart.y - (styles.tapHeartIcon.height / 2) - 40, // Center vertically relative to tap Y, minus offset
                                            opacity: heart.opacity,
                                            transform: [{ scale: heart.scale }], // Scale the whole container
                                        }
                                    ]}
                                    pointerEvents="none" // Don't let hearts block touches
                                >
                                    {/* First heart - Positioned naturally at the top-left of the Animated.View container */}
                                    <Image
                                        source={{ uri: 'https://i.imgur.com/gcMzk8k.png' }}
                                        style={styles.tapHeartIcon} // Basic size
                                    />

                                    {/* Second heart - Positioned absolutely *relative* to the Animated.View container */}
                                    {/* Apply transforms to offset and rotate it */}
                                    <Image
                                        source={{ uri: 'https://i.imgur.com/gcMzk8k.png' }}
                                        style={[
                                            styles.tapHeartIcon, // Basic size
                                            {
                                                position: 'absolute', // Position relative to the parent Animated.View
                                                top: 0, // Align top edge with the first heart's top edge *within the container*
                                                left: 0, // Align left edge with the first heart's left edge *within the container*
                                                // Apply transformations to offset and rotate the second heart
                                                transform: [
                                                    { translateX: 10 }, // Move 10 pixels right
                                                    { translateY: 10 }, // Move 10 pixels down
                                                    { rotate: '15deg' }  // Rotate 15 degrees clockwise
                                                ],
                                                // Optional: slightly different opacity or scale for the second heart?
                                                // You would need separate Animated values for this.
                                                // For simplicity, we keep them visually identical apart from position/rotation.
                                            }
                                        ]}
                                    />
                                </Animated.View>
                            ))}


                        </Animated.View>
                    </TapGestureHandler>
                </Animated.View>
            </TapGestureHandler>

      {/* Gradient Overlay - Improves text readability over video */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} // Transparent top to black bottom
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '60%', // Cover bottom 60% of the screen
          zIndex: 1, // Positioned below controls but above video
        }}
        pointerEvents="none" // Allow touches to pass through to components below
      />

      {/* Interactive controls overlay (like button, facts button, etc.) */}
      <Controls
        liked={liked}
        scale={controlsScaleAnim}
        onLikePress={onLikePress}
        onFactsPress={toggleFacts}
        likeCount={data.likes}
      />

      {/* Post information overlay (caption, source) */}
      <View style={styles.postinfo}>
        <SafeAreaView>
          <PostInfo caption={data.caption} source={data.source} />
        </SafeAreaView>
      </View>

      {/* Facts section overlay - Slides up from bottom */}
      <PanGestureHandler 
        // Detect swipe down gesture to dismiss the facts section
        onGestureEvent={(event: any) => {
          if (event.nativeEvent.translationY > 50 && event.nativeEvent.state === State.ACTIVE) {
            dismissFactsSection();
          }
        }}
      >
        <Animated.View style={[styles.factsSection, factsSectionStyle]}>
          {/* Close button */}
          <TouchableOpacity onPress={dismissFactsSection} style={styles.closeButtonContainer}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          
          {/* Facts content */}
          <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 20 }}>
            Facts about this story
          </Text>
          <Text style={{ padding: 20, lineHeight: 24 }}>
            This content presents factual information about the news story.
            In a real application, this would contain verified facts and additional context 
            to help users better understand the content they are viewing.
          </Text>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
});

export default Post; 