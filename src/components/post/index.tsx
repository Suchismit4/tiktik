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
import { View, Text, SafeAreaView, Animated, TouchableOpacity, Dimensions, Image, Easing, ActivityIndicator, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus }  from 'expo-av'
import {
  TapGestureHandler,
  State,
  PanGestureHandler,
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
interface FlyingHeartState {
  id: number; // Unique identifier
  position: Animated.ValueXY; // For animating left/top
  scale: Animated.Value;
  opacity: Animated.Value;
}

// Get screen dimensions for target calculation
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const componentId = useRef<string>();
  if (!componentId.current) {
    componentId.current = `post-${Math.random().toString(36).substr(2, 9)}`;
  }
  // Log component rendering
  console.log(`[Post ${componentId.current}] Rendering post for video: ${data.uri.substring(0, 20)}...`);

  // Reference to the video player for controlling playback
  const videoRef = useRef<Video>(null);

  // Reference to double tap gesture handler
  const doubleTapRef = useRef(null);

  // Reference to single tap gesture handler (for improved gesture coordination)
  const singleTapRef = useRef(null);

  // Track mount state to fix potential gesture handler issues
  const isMounted = useRef(true);

  // 'liked' tracks the internal/optimistic like state immediately
  const [liked, setLiked] = useState<boolean>(false);
  // 'visualLikedState' controls the prop passed to Controls, updated with delay on double-tap
  const [visualLikedState, setVisualLikedState] = useState<boolean>(false);

  const [flyingHeart, setFlyingHeart] = useState<FlyingHeartState | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // To manage cleanup

  // Animated value for sliding the facts panel up/down
  const factsSlideAnim = useRef(new Animated.Value(0)).current;

  // New animated value specifically for the Controls component scale effect
  const controlsScaleAnim = useRef(new Animated.Value(1)).current;

  // State to track if the facts panel is visible
  const [isFactsVisible, setIsFactsVisible] = useState(false);

  // Add a state to track if the component is ready for gestures
  const [gesturesReady, setGesturesReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const visualLikePending = useRef(false);

  /**
   * Trigger the heart animation that flies towards the like button.
   */
  const triggerFlyToLikeAnimation = (startX: number, startY: number) => {
    let wasJustLiked = false; // Flag to track if this specific tap caused the like
    if (!liked) {
      setLiked(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      wasJustLiked = true;
      visualLikePending.current = true;
      console.log(`[Post ${componentId.current}] Setting visualLikePending.current = true`);
    }


    // --- TARGET POSITION ESTIMATION ---
    const likeButtonSize = 60; // Approximate size of the touchable area for the like button
    const likeButtonMarginRight = 40;
    const likeButtonBottomOffset = 160; // Approximate distance from bottom

    const targetX = screenWidth - likeButtonMarginRight - (likeButtonSize / 2);
    const targetY = screenHeight - likeButtonBottomOffset - (likeButtonSize / 2) - 50; // Adjust Y target position

    const heartId = Date.now();
    // Use ValueXY for position. Initial position needs adjustment to center the heart on the tap.
    const heartSize = styles.flyingHeartIcon.width;
    const initialX = startX - heartSize / 2;
    const initialY = startY - heartSize / 2;
    const position = new Animated.ValueXY({ x: initialX, y: initialY });
    const scale = new Animated.Value(0); // Start invisible/small
    const opacity = new Animated.Value(1); // Start fully visible

    const newHeart: FlyingHeartState = { id: heartId, position, scale, opacity };
    setFlyingHeart(newHeart); // Render the heart

    // Trigger the bounce animation on the Controls' like button immediately if liked state changed
    // This provides instant feedback even if the color change is delayed.
    if (wasJustLiked) {
      Animated.sequence([
        Animated.timing(controlsScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(controlsScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
    }


    // Animation Sequence:
    // 1. Scale Up Quickly
    // 2. Parallel: Move to Target + Fade Out + Scale Down

    // May have to fix this!!
    Animated.sequence([
      // 1. Initial Pop / Scale Up
      Animated.spring(scale, {
        toValue: 1.1, // Scale up bigger initially
        friction: 3,
        tension: 80,
        useNativeDriver: false, // Scale is safe for native driver
      }),
      // Add a small delay before moving?
      // Animated.delay(50),

      // 2. Fly towards button while fading and shrinking
      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: targetX, y: targetY },
          duration: 500,
          easing: Easing.bezier(0.42, 0, 0.58, 1), // Ease-in-out curve
          useNativeDriver: false, // Position changes often need this false unless using translate
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 600, // Start fading slightly before it reaches
          delay: 100,    // Start fading after a short delay
          easing: Easing.ease,
          useNativeDriver: false, // Opacity is safe
        }),
        Animated.timing(scale, {
          toValue: 0.5, // Shrink as it flies
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: false, // Scale is safe
        })
      ])
    ]).start(() => {
      // Animation complete: Remove the heart
      console.log(`[Post ${componentId}] Fly-to-like animation finished.`);
      // Update the VISUAL state only if this tap caused the like
      if (wasJustLiked && liked) {
        console.log(`[Post ${componentId}] Setting visual liked state to true AFTER animation.`);
        setVisualLikedState(true);
      }

      if (isMounted.current) {
        setFlyingHeart(null);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    });

    // Clear any existing fallback timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    animationTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setFlyingHeart(null);
        console.log(`[Post ${componentId}] Flying heart removed by fallback timeout.`);
      }
    }, 1500); // Should be longer than the animation duration (700ms + delays)
  };


  /**
   * Handles double-tap gesture on the video
   */
  const onDoubleTap = (event: any) => {
    // Add check to prevent triggering if animation is already running
    if (event.nativeEvent.state === State.ACTIVE && flyingHeart === null) {
      const { absoluteX, absoluteY } = event.nativeEvent;
      console.log(`[Post ${componentId}] [DoubleTap] Triggered at X: ${absoluteX}, Y: ${absoluteY}`);
      triggerFlyToLikeAnimation(absoluteX, absoluteY);
    } else if (event.nativeEvent.state === State.ACTIVE && flyingHeart !== null) {
      console.log(`[Post ${componentId}] [DoubleTap] Ignored, animation already in progress.`);
    }
  };

  /**
   * Handles single tap on the video (for better coordination with double tap)
   * Currently just a placeholder to assist with double tap recognition
   */
  const onSingleTap = (event: any) => {
    console.log(`[Post ${componentId}] [SingleTap] State:`, event.nativeEvent.state);
  };

  const onLikePress = () => {
    const newLikedState = !liked;
    // Update BOTH states immediately when the button is pressed directly
    setLiked(newLikedState);
    setVisualLikedState(newLikedState);

    // *** Reset the pending flag on direct interaction ***
    visualLikePending.current = false;
    console.log(`[Post ${componentId}] Like button pressed. Liked: ${newLikedState}`);

    if (newLikedState) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Trigger bounce animation for direct tap
      Animated.sequence([
        Animated.timing(controlsScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(controlsScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
    } else {
      // Reset scale immediately if unliking via button
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
    play: async () => {
      if (!videoRef.current) return;
      console.log(`[Post ${componentId}] Imperative Play`);
      try {
        await videoRef.current.setStatusAsync({ shouldPlay: true });
      } catch (e) {
        console.error(`[Post ${componentId}] Error playing video:`, e);
      }
    },
    pause: async () => {
      if (!videoRef.current) return;
      console.log(`[Post ${componentId}] Imperative Pause`);
      try {
        await videoRef.current.setStatusAsync({ shouldPlay: false });
      } catch (e) {
        console.error(`[Post ${componentId}] Error pausing video:`, e);
      }
    },
    unload: async () => {
      if (!videoRef.current) return;
      console.log(`[Post ${componentId}] Imperative Unload`);
      try {
        await videoRef.current.unloadAsync();
        setIsLoading(true);
      } catch (e) {
        console.log(`[Post ${componentId}] Error unloading video:`, e);
      }
    }
  }), []);


  const [videoSource, setVideoSource] = useState<{ uri: string }>({ uri: data.uri });
  const [hasError, setHasError] = useState<boolean>(false);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      // Video is not loaded or has encountered an error
      if (status.error) {
        console.error(`[Post ${componentId.current}] Playback Error:`, status.error);
        handleVideoError();
      } else {
        // Still loading or unloaded state
        setIsLoading(true);
      }
    } else {
      // Video is loaded
      if (status.isBuffering) {
        // Video is buffering
        setIsLoading(true);
      } else {
        // Video is ready to play or playing
        setIsLoading(false);
        setHasError(false); // Reset error state on successful load
      }
    }
  };

  const handleVideoError = () => {
    console.error(`[Post ${componentId.current}] Video failed to load:`, videoSource.uri);
    
    // If we're currently using a streaming URL and have a fallback, try the fallback
    if (data.isStreaming && data.fallbackUrl && !hasError) {
      console.log(`[Post ${componentId.current}] Trying fallback URL:`, data.fallbackUrl);
      setVideoSource({ uri: data.fallbackUrl });
      setHasError(true); // Mark that we've tried fallback
      setIsLoading(true);
    } else if (data.originalUri && data.originalUri !== videoSource.uri && !hasError) {
      console.log(`[Post ${componentId.current}] Trying original URL:`, data.originalUri);
      setVideoSource({ uri: data.originalUri });
      setHasError(true);
      setIsLoading(true);
    } else {
      // All options exhausted
      console.error(`[Post ${componentId.current}] All video sources failed`);
      setIsLoading(false);
      setHasError(true);
    }
  };
  /**
   * Setup effect to ensure gesture handlers are properly initialized
   */
  // --- (useEffect for mounting/unmounting remains similar, ensure timeouts are cleared) ---
  // Effect to update video source when data changes
  useEffect(() => {
    console.log(`[Post ${componentId.current}] Data changed, updating video source to: ${data.uri}`);
    setVideoSource({ uri: data.uri });
    setHasError(false);
    setIsLoading(true);
  }, [data.uri]);

  useEffect(() => {
    console.log(`[Post ${componentId.current}] Component mounted.`);
    isMounted.current = true;
    setGesturesReady(false); // Gestures not ready initially
    setIsLoading(true);

    const readyTimer = setTimeout(() => {
      if (isMounted.current) {
        console.log(`[Post ${componentId.current}] Marking gestures as ready.`);
        setGesturesReady(true);
      }
    }, 150); // Delay to allow layout and handlers to settle

    return () => {
      console.log(`[Post ${componentId.current}] Component unmounting.`);
      isMounted.current = false;
      clearTimeout(readyTimer);
      // Clear animation fallback timer on unmount
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      // Stop any potentially running animations
      if (flyingHeart) {
        flyingHeart.position.stopAnimation();
        flyingHeart.opacity.stopAnimation();
        flyingHeart.scale.stopAnimation();
      }
      // Unload video
      videoRef.current?.unloadAsync().catch(e => console.log("Unmount Unload Error:", e));
    };
  }, []); // No dependencies needed for mount/unmount effect

  useEffect(() => {
    // This effect runs when `flyingHeart` or `liked` changes.
    // We are interested in when `flyingHeart` becomes null *after* an animation.
    if (flyingHeart === null && visualLikePending.current) {
      console.log(`[useEffect ${componentId}] Animation finished (flyingHeart is null) and visual like is pending.`);

      // Double-check the optimistic state hasn't changed back
      if (liked) {
        console.log(`[useEffect ${componentId}] Liked state is still true. Setting visualLikedState = true.`);
        setVisualLikedState(true);
      } else {
        console.log(`[useEffect ${componentId}] Liked state is now false (user unliked?). Not updating visual state.`);
      }
      // Reset the pending flag regardless
      visualLikePending.current = false;
      console.log(`[useEffect ${componentId}] Reset visualLikePending.current = false`);
    }
  }, [flyingHeart, liked]); // Depend on flyingHeart and liked state

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
  }, [data.uri]);

  return (
    <Animated.View style={{ flex: 1 }}>
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
            onHandlerStateChange={onDoubleTap}
            maxDurationMs={300} // Time between taps
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
                source={videoSource}
                onError={(error) => {
                  console.error(`[Post ${componentId.current}] Video Error:`, error);
                  handleVideoError();
                }}
                // *** Playback Status Update Listener ***
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoadStart={() => {
                  console.log(`[Post ${componentId.current}] onLoadStart - Source: ${videoSource.uri}`);
                  setIsLoading(true);
                }}
                onLoad={(status) => {
                  console.log(`[Post ${componentId.current}] onLoad fired - Source: ${videoSource.uri}`);
                }}
              />

              {/* *** Loading Indicator Overlay *** */}
              {isLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
               )}

              {/* --- Animated Flying Heart --- */}
              {flyingHeart && (
                <Animated.View
                  style={[
                    // Use position.getLayout() for left/top animated values
                    flyingHeart.position.getLayout(),
                    styles.flyingHeartBase, // Base style for position: absolute, zIndex etc.
                    {
                      opacity: flyingHeart.opacity,
                      transform: [{ scale: flyingHeart.scale }],
                    },
                  ]}
                  pointerEvents="none" // Prevent heart from blocking touches
                >
                  <Image
                    source={{ uri: 'https://i.imgur.com/gcMzk8k.png' }} // Use your heart image
                    style={styles.flyingHeartIcon}
                  />
                </Animated.View>
              )}


            </Animated.View>

          </TapGestureHandler>
        </Animated.View>
      </TapGestureHandler >

      {/* Gradient Overlay - Improves text readability over video */}
      < LinearGradient
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
      < Controls
        // *** Pass the visualLikedState to control the button's appearance ***
        liked={visualLikedState}
        scale={controlsScaleAnim}
        onLikePress={onLikePress}
        onFactsPress={toggleFacts}
        likeCount={data.likes + (liked ? 1 : 0) - (visualLikedState ? 1 : 0)}
      />

      {/* Post information overlay (caption, source) */}
      < View style={styles.postinfo} >
        <SafeAreaView>
          <PostInfo 
            caption={data.caption} 
            source={data.source}
          />
        </SafeAreaView>
      </View >

      {/* Facts section overlay - Slides up from bottom */}
      < PanGestureHandler
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
      </PanGestureHandler >
    </Animated.View >
  );
});

export default Post; 