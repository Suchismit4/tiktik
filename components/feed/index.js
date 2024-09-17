import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { FlatList, SafeAreaView, Text, View, Dimensions } from 'react-native';
import Post from '../post';
import Navbar from '../navbar';
import BottomBar from '../bottomBar';
import { LinearGradient } from 'expo-linear-gradient';
import styles from './style';

export default function Feed() {
  const mediaRefs = useRef([]);
  const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const [maxScrollDepth, setMaxScrollDepth] = useState(0);
  const [timeSpent, setTimeSpent] = useState({}); // Track time spent on each content
  const lastViewedRef = useRef({ startTime: null, contentId: null }); // Track last viewed content

  // Viewable item handler to track media play/pause and time spent on content
  const onViewableItemsChanged = useRef(({ viewableItems, changed }) => {
    const currentTime = Date.now();

    // Stop timing for last viewed content
    if (lastViewedRef.current.contentId !== null) {
      const lastContentId = lastViewedRef.current.contentId;
      const duration = currentTime - lastViewedRef.current.startTime;
      setTimeSpent((prevTimeSpent) => ({
        ...prevTimeSpent,
        [lastContentId]: (prevTimeSpent[lastContentId] || 0) + duration,
      }));
    }

    // Start timing for the new viewed content
    if (viewableItems.length > 0) {
      const newContentId = viewableItems[0].key; // Assuming each item has a unique key
      lastViewedRef.current = { startTime: currentTime, contentId: newContentId };
    }

    // Track scroll depth (deepest visible item)
    if (viewableItems.length > 0) {
      const deepestItem = viewableItems[viewableItems.length - 1].index;
      setMaxScrollDepth((prevDepth) => Math.max(prevDepth, deepestItem));
    }

    // Control media play/pause based on visibility
    changed.forEach((element) => {
      const cell = mediaRefs.current[element.key];
      if (cell) {
        if (element.isViewable) {
          cell.play();  // Play the media when the item is viewable
        } else {
          cell.stop();  // Stop the media when the item is not viewable
        }
      }
    });
  });

  // Render each post in the list
  const renderItem = ({ item, index }) => (
    <View
      style={[
        { height: Dimensions.get('window').height },
        index % 2 ? { backgroundColor: 'blue' } : { backgroundColor: 'pink' },
      ]}
    >
      <Post ref={(PostSingleRef) => (mediaRefs.current[item] = PostSingleRef)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={array}
        windowSize={4}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        viewabilityConfig={{
          itemVisiblePercentThreshold: 30,
        }}
        renderItem={renderItem}
        pagingEnabled
        keyExtractor={(item) => item.toString()}
        decelerationRate="slow"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
      />
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
        style={styles.gradientOverlayTop}
      />

      <SafeAreaView style={styles.overlayTop}>
        <Navbar />
        <Text>Scroll Depth: {maxScrollDepth}</Text>
        {Object.entries(timeSpent).map(([contentId, time]) => (
          <Text key={contentId}>Content {contentId} - Time Spent: {time}ms</Text>
        ))}
      </SafeAreaView>

      <SafeAreaView style={styles.overlayBottom}>
        <BottomBar style={styles.bottomBar} />
      </SafeAreaView>
    </View>
  );
}
