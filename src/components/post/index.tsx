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
import { View, Text, SafeAreaView, Animated, TouchableOpacity, Dimensions, Image, Easing } from 'react-native';
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
  const [flyingHeart, setFlyingHeart] = useState<FlyingHeartState | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null); // To manage cleanup

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
   * Trigger the heart animation that flies towards the like button.
   */
  const triggerFlyToLikeAnimation = (startX: number, startY: number) => {
    let likedStateChanged = false;
    if (!liked) {
      setLiked(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      likedStateChanged = true; // Flag that we just liked it
    }

    // --- TARGET POSITION ESTIMATION ---
    // Estimate the center of the like button in Controls component.
    // Adjust these values based on your Controls component's actual styling/positioning.
    const likeButtonSize = 60; // Approximate size of the touchable area for the like button
    const likeButtonMarginRight = 15;
    const likeButtonBottomOffset = 150; // Approximate distance from bottom (adjust as needed)

    const targetX = screenWidth - likeButtonMarginRight - (likeButtonSize / 2);
    const targetY = screenHeight - likeButtonBottomOffset - (likeButtonSize / 2) - 50; // Adjust Y target position

    // console.log(`[Post ${componentId}] Animation Start: (${startX}, ${startY}), Target: (${targetX}, ${targetY})`);


    const heartId = Date.now();
    // Use ValueXY for position. Initial position needs adjustment to center the heart on the tap.
    const heartSize = styles.flyingHeartIcon.width; // Use defined size
    const initialX = startX - heartSize / 2;
    const initialY = startY - heartSize / 2;
    const position = new Animated.ValueXY({ x: initialX, y: initialY });
    const scale = new Animated.Value(0); // Start invisible/small
    const opacity = new Animated.Value(1); // Start fully visible

    const newHeart: FlyingHeartState = { id: heartId, position, scale, opacity };
    setFlyingHeart(newHeart); // Render the heart

    // Trigger the bounce animation on the Controls' like button *immediately* if the state changed
    if (likedStateChanged) {
      Animated.sequence([
        Animated.timing(controlsScaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.timing(controlsScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
    }


    // Animation Sequence:
    // 1. Scale Up Quickly
    // 2. Parallel: Move to Target + Fade Out + Scale Down
    Animated.sequence([
      // 1. Initial Pop / Scale Up
      Animated.spring(scale, {
        toValue: 1.2, // Scale up bigger initially
        friction: 3,
        tension: 80,
        useNativeDriver: false, // Scale is safe for native driver
      }),
      // Add a small delay before moving? (Optional)
      // Animated.delay(50),

      // 2. Fly towards button while fading and shrinking
      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: targetX, y: targetY },
          duration: 700, // Adjust duration for speed
          easing: Easing.bezier(0.42, 0, 0.58, 1), // Ease-in-out curve
          //   easing: Easing.bezier(0.6, -0.28, 0.735, 0.045), // EaseInBack for a slight curve start
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
      if (isMounted.current) {
        setFlyingHeart(null);
      }
      // Clear the fallback timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    });

    // Clear any existing fallback timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Fallback cleanup: Ensure heart is removed if animation hangs or component unmounts badly
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
    console.log(`[Post ${componentId}] [DoubleTap] State:`, event.nativeEvent.state, 'State.ACTIVE:', State.ACTIVE);

    if (event.nativeEvent.state === State.ACTIVE) {
      // Use absolute coordinates which are relative to the screen
      const { absoluteX, absoluteY } = event.nativeEvent;
      console.log(`[Post ${componentId}] [DoubleTap] Triggered at X: ${absoluteX}, Y: ${absoluteY}`);

      // --- Trigger the NEW fly-to-like animation ---
      triggerFlyToLikeAnimation(absoluteX, absoluteY);
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
      } catch (e) {
        console.log(`[Post ${componentId}] Error unloading video:`, e);
      }
    }
  }), [componentId]); // Add componentId dependency if needed

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
  }, [data.uri, componentId, flyingHeart]);

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
        liked={liked}
        scale={controlsScaleAnim}
        onLikePress={onLikePress}
        onFactsPress={toggleFacts}
        likeCount={data.likes}
      />

      {/* Post information overlay (caption, source) */}
      < View style={styles.postinfo} >
        <SafeAreaView>
          <PostInfo caption={data.caption} source={data.source} />
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
    </GestureHandlerRootView >
  );
});

export default Post; 