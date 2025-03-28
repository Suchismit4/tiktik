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
import Post from '../post';
import Navbar from '../navbar';
import BottomBar from '../bottomBar';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './style';

const { height } = Dimensions.get('window');

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
      }
    });

    return () => {
      appStateListener.remove();
    };
  }, []);

  const onFactsPress = () => {
    console.log('Facts button clicked!');
  };

  const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    const currentTime = Date.now();

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
      const currentIndex = viewableItems[0]?.index;
      if (currentIndex !== undefined) {
        setVideoCount((prevCount) => {
          if ((prevCount + 1) % 5 === 0) {
            setShowSurvey(true);
          }
          return prevCount + 1;
        });
      }
    }

    changed.forEach((element) => {
      const cell = mediaRefs.current[element.key];
      if (cell) {
        element.isViewable ? cell.play() : cell.pause();
      }
    });
  });

  const renderItem = useCallback(({ item }) => (
    <View style={{ height }}>
      <Post
        ref={(PostSingleRef) => (mediaRefs.current[item.id.toString()] = PostSingleRef)}
        uri={item.uri}
        onFactsPress={onFactsPress}
      />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <FlatList
        data={array}
        windowSize={4}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
        renderItem={renderItem}
        snapToInterval={height}
        decelerationRate="fast"
        snapToAlignment="start"
        pagingEnabled
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />

      {/* Facts Button */}
      <View style={styles.factsButtonContainer}>
        <TouchableOpacity onPress={onFactsPress}>
          <Text style={styles.factsButton}>Facts</Text>
        </TouchableOpacity>
      </View>

      {/* Navbar & Stats */}
      <SafeAreaView style={styles.overlayTop}>
        <Navbar />
        <Text>Scroll Depth: {maxScrollDepth}</Text>
        {Object.entries(timeSpent).map(([contentId, time]) => (
          <Text key={contentId}>Content {contentId} - Time Spent: {time}ms</Text>
        ))}
      </SafeAreaView>

      {/* Bottom Bar */}
      <SafeAreaView style={styles.overlayBottom}>
        <BottomBar />
      </SafeAreaView>

      {/* Survey Overlay */}
      {showSurvey && <SurveyForm onSubmit={handleSurveySubmit} />}
    </View>
  );
}

const SurveyForm = ({ onSubmit }) => {
  return (
    <View style={styles.surveyContainer}>
      <Text style={styles.surveyTitle}>Quick Survey</Text>
      <Text>Insert survey question</Text>
      <View style={styles.surveyOptions}>
        {['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5'].map((option) => (
          <TouchableOpacity key={option} onPress={onSubmit}>
            <Text style={styles.surveyOption}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
