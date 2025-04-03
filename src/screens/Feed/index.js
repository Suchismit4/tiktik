import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  SafeAreaView,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  AppState,
} from 'react-native';
import Post from '../../components/post';
import Navbar from '../../components/navbar';
import BottomBar from '../../components/bottomBar';
import SurveyForm from '../../components/SurveyForm';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './style';

const { height } = Dimensions.get('window');

/**
 * Feed Screen Component
 *
 * Displays a vertical feed of video posts, similar to TikTok.
 * Handles video playback based on visibility, tracks user interaction metrics
 * (scroll depth, time spent per video), and triggers a survey periodically.
 * @param {object} props - Component props (if any)
 */
export default function Feed() {
  const mediaRefs = useRef({});
  const [showSurvey, setShowSurvey] = useState(false);
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  const [timeSpent, setTimeSpent] = useState({});
  const [videoCount, setVideoCount] = useState(0);
  const lastViewedRef = useRef({ startTime: null, contentId: null });
  const flatListRef = useRef(null);

  const array = [
    { id: 1, uri: 'https://drive.google.com/uc?export=download&id=1567uKxxJx9J5uvf0BbLU-Qipe0YZZl39' },
    { id: 2, uri: 'https://drive.google.com/uc?export=download&id=17QAoPwiSeQjm-v8uO3gp7BymemHCzh_T' },
    { id: 3, uri: 'https://drive.google.com/uc?export=download&id=19YlJ9AcQJxlocoe3puA5aHriaKtvufB8' },
    { id: 4, uri: 'https://drive.google.com/uc?export=download&id=1ZiEPJPjTlYUnOabU7UjnoFtrbT6JNKaJ' },
    { id: 5, uri: 'https://drive.google.com/uc?export=download&id=1h2Ns1ZKui5XPB8c1sUxHMPKB7ElVB5sW' },
    { id: 6, uri: 'https://drive.google.com/uc?export=download&id=1jrZaKS8ZkycMCCW9wdcLQuJTuh4p8WS0' },
    { id: 7, uri: 'https://drive.google.com/uc?export=download&id=1pqHpIZuIR3rCDhdYJkDB6BOYEcwV7ejG' },
  ];

  const handleSurveySubmit = () => {
    setShowSurvey(false);
  };

  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'inactive' || nextAppState === 'background') {
        setShowSurvey(true);
        const currentContentId = lastViewedRef.current.contentId;
        if (currentContentId && mediaRefs.current[currentContentId]) {
           mediaRefs.current[currentContentId].pause();
        }
        console.log("App inactive/background. Max Scroll:", maxScrollDepth, "Time Spent:", timeSpent);
      }
      if (nextAppState === 'active') {
        const currentContentId = lastViewedRef.current.contentId;
        if (currentContentId && mediaRefs.current[currentContentId]) {
            mediaRefs.current[currentContentId].play(); 
        }
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, [maxScrollDepth, timeSpent]);

  /**
   * Callback for FlatList's onViewableItemsChanged.
   * Handles:
   * 1. Pausing/Playing videos based on visibility.
   * 2. Tracking time spent on each video.
   * 3. Tracking maximum scroll depth.
   * 4. Triggering the survey based on video count.
   */
  const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    const currentTime = Date.now();

    // --- Time Tracking --- 
    // Record time spent on the video that just became non-viewable
    if (lastViewedRef.current.contentId !== null) {
      const lastContentId = lastViewedRef.current.contentId;
      const duration = currentTime - lastViewedRef.current.startTime;
      setTimeSpent((prevTimeSpent) => ({
        ...prevTimeSpent,
        [lastContentId]: (prevTimeSpent[lastContentId] || 0) + duration,
      }));
    }

    if (viewableItems.length > 0) {
      const newContentId = viewableItems[0]?.key;
      lastViewedRef.current = { startTime: currentTime, contentId: newContentId };
    }

    if (viewableItems.length > 0) {
      const deepestItem = viewableItems[viewableItems.length - 1].index;
      setMaxScrollDepth((prevDepth) => Math.max(prevDepth, deepestItem));
    }

    if (viewableItems.length > 0) {
      const isNewVideoViewed = changed.some(item => item.isViewable && item.key === viewableItems[0]?.key);
      if (isNewVideoViewed) {
          setVideoCount((prevCount) => {
            const newCount = prevCount + 1;
            if (newCount % 5 === 0) {
              setShowSurvey(true);
            }
            return newCount;
          });
      }
    }

    changed.forEach((element) => {
      const cell = mediaRefs.current[element.key];
      if (cell) {
        if (element.isViewable) {
          cell.play();
        } else {
          cell.pause();
          if(element.key === lastViewedRef.current.contentId){
             const duration = Date.now() - lastViewedRef.current.startTime;
             setTimeSpent((prevTimeSpent) => ({
                ...prevTimeSpent,
                [element.key]: (prevTimeSpent[element.key] || 0) + duration,
             }));
          }
        }
      }
    });
  });

  const renderItem = useCallback(({ item }) => (
    <View style={{ height }}>
      <Post
        ref={(PostSingleRef) => (mediaRefs.current[item.id.toString()] = PostSingleRef)}
        uri={item.uri}
      />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={array}
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

      <SafeAreaView style={styles.overlayTop}>
        <Navbar />
      </SafeAreaView>

      <SafeAreaView style={styles.overlayBottom}>
        <BottomBar />
      </SafeAreaView>

      {showSurvey && <SurveyForm onSubmit={handleSurveySubmit} />}
    </View>
  );
}
