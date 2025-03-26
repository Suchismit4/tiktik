import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { Video } from 'expo-av';
import styles from './style';
import Controls from '../controls';
import PostInfo from '../InfoText';
import { GestureHandlerRootView, TapGestureHandler, State, PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const Post = forwardRef((props, parentRef) => {
  const ref = useRef(null);
  const [liked, setLiked] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [showFacts, setShowFacts] = useState(false);
  const factsSlideAnim = useRef(new Animated.Value(0)).current;

  const onDoubleTap = (event) => {
    if (event.nativeEvent.state === State.END) {
      if (!liked) {
        setLiked(prevLiked => !prevLiked);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // Trigger haptic feedback
      }
      Animated.sequence([
        Animated.spring(scaleValue, {
          toValue: 3,
          friction: 2,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 2,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const onLikePress = () => {
    setLiked(prevLiked => !prevLiked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // Trigger haptic feedback
  };

  const toggleFacts = () => {
    Animated.timing(factsSlideAnim, {
      toValue: factsSlideAnim._value === 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const dismissFactsSection = () => {
    Animated.timing(factsSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const factsSectionStyle = {
    transform: [
      {
        translateY: factsSlideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [300, 0], // Slide up when appearing
        }),
      },
    ],
    opacity: factsSlideAnim,
  };

  useImperativeHandle(parentRef, () => ({
    play,
    unload,
    pause
  }), []);

  useEffect(() => {
    return () => unload();
  }, []);

  const play = async () => {
    if (ref.current == null) return;

    try {
      await ref.current.playAsync();
    } catch (e) {
      console.log(e);
    }
  };

  const pause = async () => {
    if (ref.current == null) return;

    try {
      await ref.current.pauseAsync();
    } catch (e) {
      console.log(e);
    }
  };

  const unload = async () => {
    if (ref.current == null) return;

    try {
      await ref.current.unloadAsync();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
        <Animated.View style={styles.container}>
          <Video
            ref={ref}
            style={[styles.container]}
            resizeMode="cover"
            shouldPlay={false}
            isLooping
            source={{ uri: props.uri }}
          />
        </Animated.View>
      </TapGestureHandler>

      <Controls
        liked={liked}
        scale={scaleValue}
        onLikePress={onLikePress}
        onFactsPress={toggleFacts} // pass
      />

      <View style={styles.postinfo}>
        <SafeAreaView>
          <PostInfo />
        </SafeAreaView>
      </View>

      <PanGestureHandler onGestureEvent={(event) => {
        if (event.nativeEvent.translationY > 50) {
          dismissFactsSection();
        }
      }}>
        <Animated.View style={[styles.factsSection, factsSectionStyle]}>
          <TouchableOpacity onPress={dismissFactsSection} style={styles.closeButtonContainer}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text>Facts Section Content</Text>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
});

export default Post;