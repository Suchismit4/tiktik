import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { Video } from 'expo-av';
import styles from './style';
import Controls from '../controls';
import PostInfo from '../InfoText';
import { Animated, TextInput, Button } from 'react-native';
import { GestureHandlerRootView, TapGestureHandler, State, PanGestureHandler } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const Post = forwardRef((props, parentRef) => {
    
    const ref = useRef(null);    
    const [liked, setLiked] = useState(false);
    const scaleValue = useRef(new Animated.Value(1)).current;
    const [showComments, setShowComments] = useState(false);
    const commentSlideAnim = useRef(new Animated.Value(0)).current;

    // Handle double-tap gesture and trigger like animation with haptic feedback
    const onDoubleTap = (event) => {
        if (event.nativeEvent.state === State.END) {
            if (!liked) {
                setLiked(prevLiked => !prevLiked);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const onCommentPress = () => {
        setShowComments(!showComments);
        Animated.timing(commentSlideAnim, {
            toValue: showComments ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const dismissCommentSection = () => {
        setShowComments(false);
        Animated.timing(commentSlideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const commentSectionStyle = {
        transform: [
            {
                translateY: commentSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                }),
            },
        ],
        opacity: commentSlideAnim,
    };

    
    // Expose play, stop, and unload methods to the parent via forwardRef
    useImperativeHandle(parentRef, () => ({
        play,
        unload,
        stop
    }), [play, unload, stop]);

    useEffect(() => {
        return () => unload();
    }, []);

    // Play video
    const play = async () => {
        if (ref.current == null) return;
        
        const status = await ref.current.getStatusAsync();
        if (status?.isPlaying) return;
        
        try {
            await ref.current.playAsync();
        } catch (e) {
            console.log(e);
        }
    };

    // Stop video
    const stop = async () => {
        if (ref.current == null) return;
        
        const status = await ref.current.getStatusAsync();
        if (!status?.isPlaying) return;
        
        try {
            await ref.current.stopAsync();
        } catch (e) {
            console.log(e);
        }
    };

    // Unload video
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
            <>
                <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
                    <Animated.View style={styles.container}>
                        <Video 
                            ref={ref}
                            style={[styles.container]}
                            resizeMode='cover'
                            shouldPlay={true}
                            isLooping
                            source={{ uri: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4' }}
                        />
                    </Animated.View>
                </TapGestureHandler>
                

                <Controls liked={liked} scale={scaleValue} onLikePress={onLikePress} onCommentPress={onCommentPress}/>

                <View style={styles.postinfo}>
                    <SafeAreaView>
                        <PostInfo />
                    </SafeAreaView>
                </View>

                <PanGestureHandler onGestureEvent={(event) => {
                    if (event.nativeEvent.translationY > 50) { // Threshold for swipe down
                        dismissCommentSection();
                    }
                }}>
                    <Animated.View style={[styles.commentSection, commentSectionStyle]}>
                        <TextInput style={styles.commentInput} placeholder="Write a comment..." />
                        <Button title="Send" onPress={() => { /* handle comment submission */ }} />
                    </Animated.View>
                </PanGestureHandler>


            </>
        </GestureHandlerRootView>
    );
});

export default Post;
