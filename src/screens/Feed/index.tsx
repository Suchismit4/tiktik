/**
 * Feed Screen
 * 
 * Displays a vertical feed of video posts, similar to TikTok.
 * Handles video playback, user interaction metrics, and surveys.
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  SafeAreaView,
  View,
  Dimensions,
  AppState,
  AppStateStatus,
  ListRenderItemInfo,
} from 'react-native';
import Post from '../../components/post';
import Navbar from '../../components/navbar';
import BottomBar from '../../components/bottomBar';
import SurveyForm from '../../components/SurveyForm';
import styles from './styles';
import { Post as PostType, VideoRef } from '../../types';
import { useVideo } from '../../context/VideoContext';
import { startVideoView, endVideoView, setupAnalyticsTracking } from '../../utils/analytics';

// Get window dimensions for FlatList
const { height } = Dimensions.get('window');

/**
 * Feed Screen Component
 */
const Feed: React.FC = () => {
  // Refs for video playback and FlatList
  const mediaRefs = useRef<Record<string, VideoRef | null>>({});
  const flatListRef = useRef<FlatList>(null);
  const appStateRef = useRef(AppState.currentState);
  
  // State for survey visibility
  const [showSurvey, setShowSurvey] = useState<boolean>(false);

  // Get video data and analytics functions from context
  const { 
    videos, 
    updateTimeSpent, 
    updateScrollDepth, 
    incrementVideoCount,
    resetMetrics,
  } = useVideo();

  // Ref to track last viewed video for analytics
  const lastViewedRef = useRef<{ 
    startTime: number | null; 
    contentId: string | null 
  }>({
    startTime: null,
    contentId: null,
  });

  /**
   * Callback for when videos become visible in the FlatList
   * Handles video playback and tracking
   */
  const onViewableItemsChangedCallback = useCallback(({ changed }: { 
    changed: Array<{
      item: PostType;
      isViewable: boolean;
      index: number;
      key: string;
      section?: any;
    }> 
  }) => {
    changed.forEach(element => {
      const videoId = element.item.id.toString();
      
      if (element.isViewable) {
        // Start video playback
        if (mediaRefs.current[videoId]) {
          mediaRefs.current[videoId]?.play();
        }
        
        // Start tracking view time
        lastViewedRef.current = {
          startTime: Date.now(),
          contentId: videoId,
        };
        
        // Track video view
        startVideoView(videoId);
        
        // Update metrics
        updateScrollDepth(element.index + 1);
        incrementVideoCount();
      } else {
        // Pause video playback when not viewable
        if (mediaRefs.current[videoId]) {
          mediaRefs.current[videoId]?.pause();
        }
        
        // End tracking view time
        if (lastViewedRef.current.startTime && 
            lastViewedRef.current.contentId === videoId) {
          const duration = Date.now() - lastViewedRef.current.startTime;
          updateTimeSpent(videoId, duration);
          
          // End video view
          endVideoView();
          
          lastViewedRef.current = {
            startTime: null,
            contentId: null,
          };
        }
      }
    });
  }, [updateTimeSpent, updateScrollDepth, incrementVideoCount]);

  const onViewableItemsChanged = useRef(onViewableItemsChangedCallback);

  // Update the ref when the callback changes
  useEffect(() => {
    onViewableItemsChanged.current = onViewableItemsChangedCallback;
  }, [onViewableItemsChangedCallback]);

  /**
   * Handle app state changes for video playback
   */
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'inactive' || nextAppState === 'background') {
      // Show survey when app goes to background
      setShowSurvey(true);
      
      // Pause current video
      const currentContentId = lastViewedRef.current.contentId;
      if (currentContentId && mediaRefs.current[currentContentId]) {
        mediaRefs.current[currentContentId]?.pause();
      }
    }
    
    if (nextAppState === 'active' && 
        appStateRef.current !== 'active') {
      // Resume current video when app comes to foreground
      const currentContentId = lastViewedRef.current.contentId;
      if (currentContentId && mediaRefs.current[currentContentId]) {
        mediaRefs.current[currentContentId]?.play();
      }
    }
    
    appStateRef.current = nextAppState;
  }, []);

  /**
   * Set up analytics tracking and app state listeners
   */
  useEffect(() => {
    // Reset metrics when the feed is mounted
    resetMetrics();
    
    // Set up analytics tracking
    const cleanupAnalytics = setupAnalyticsTracking();

    // Add app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Clean up listeners on unmount
    return () => {
      subscription.remove();
      cleanupAnalytics();
    };
  }, [resetMetrics, handleAppStateChange]);

  /**
   * Handle survey submission
   */
  const handleSurveySubmit = () => {
    setShowSurvey(false);
  };

  /**
   * Render a video post item
   */
  const renderItem = useCallback(({ item }: ListRenderItemInfo<PostType>) => (
    <View style={{ height }}>
      <Post
        ref={(postRef) => (mediaRefs.current[item.id.toString()] = postRef)}
        data={item}
      />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      {/* Video Feed */}
      <FlatList
        ref={flatListRef}
        data={videos}
        windowSize={4}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={renderItem}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        snapToAlignment="start"
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />

      {/* Top Navigation Bar */}
      <SafeAreaView style={styles.overlayTop}>
        <Navbar />
      </SafeAreaView>

      {/* Bottom Navigation Bar */}
      <SafeAreaView style={styles.overlayBottom}>
        <BottomBar />
      </SafeAreaView>

      {/* Survey Form (shows conditionally) */}
      {showSurvey && <SurveyForm onSubmit={handleSurveySubmit} />}
    </View>
  );
};

export default Feed; 