/**
 * Controls Component
 * 
 * This component renders the interactive control buttons that overlay each video post.
 * It displays engagement options such as:
 * - Like button (with animated heart effect)
 * - Facts button (to display factual information about the content)
 * 
 * The controls are positioned on the right side of the video and respond to user interactions
 * with appropriate visual feedback and actions.
 */
import React from 'react';
import { View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import styles from './styles';

/**
 * Props interface for Controls component
 * 
 * @typedef {Object} ControlsProps
 * @property {boolean} liked - Whether the post is currently liked by the user
 * @property {Animated.Value} scale - Animated value for the like button scale effect (for heart animation)
 * @property {Function} onLikePress - Callback function to handle like button press
 * @property {Function} onFactsPress - Callback function to handle facts button press
 * @property {number} [likeCount] - Number of likes for the post (optional, defaults to 0)
 */
interface ControlsProps {
  /** Whether the post is currently liked */
  liked: boolean;
  /** Animated value for the like button scale effect */
  scale: Animated.Value;
  /** Function to call when the like button is pressed */
  onLikePress: () => void;
  /** Function to call when the facts button is pressed */
  onFactsPress: () => void;
  /** Number of likes for the post */
  likeCount?: number;
}

/**
 * Controls Component
 * 
 * Renders the interaction buttons overlaid on a video post.
 * These controls enable user engagement with the content.
 * 
 * Key features:
 * - Toggleable like button with heart icon that changes based on liked state
 * - Animated scale effect for the heart when double-tapping the video
 * - Formatted like count display (with K suffix for thousands)
 * - Facts button to display additional information about the content
 * 
 * @param {ControlsProps} props - Component props
 * @returns {JSX.Element} The rendered Controls component
 */
const Controls: React.FC<ControlsProps> = ({ 
  liked, 
  scale, 
  onLikePress, 
  onFactsPress,
  likeCount = 0
}) => {
  /**
   * Determine which heart icon to display based on liked state
   * - Filled heart when liked
   * - Outline heart when not liked
   */
  const likeIconURI = liked 
    ? 'https://i.imgur.com/gcMzk8k.png' // Filled heart icon
    : 'https://i.imgur.com/UZT26iF.png'; // Outline heart icon

  /**
   * Format the like count for display
   * - Shows as "1.2K" for numbers over 1000
   * - Shows exact number for counts under 1000
   */
  const formattedLikeCount = likeCount > 1000 
    ? `${(likeCount / 1000).toFixed(1)}K` // Format as "1.2K", "10.5K", etc.
    : likeCount.toString();

  return (
    <View style={styles.container}>
      {/* Like Button Section - Heart icon with like count */}
      <View style={styles.containerIcon}> 
        <TouchableOpacity onPress={onLikePress} accessible={true} accessibilityLabel="Like button"> 
          {/* Animated heart that scales on double-tap */}
          <Animated.View style={{ transform: [{ scale }] }}>
            <Image
              style={styles.button} 
              source={{ uri: likeIconURI }} 
            />
          </Animated.View>
        </TouchableOpacity>
        {/* Like count display */}
        <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>
          {formattedLikeCount}
        </Text>
      </View>
      
      {/* Facts Button Section - Information icon */}
      <View style={styles.containerIcon}>
        <TouchableOpacity onPress={onFactsPress} accessible={true} accessibilityLabel="View facts about this content"> 
          <Image
            style={styles.button} 
            source={{ uri: 'https://i.imgur.com/SNF08AQ.png' }} // Info icon
          />
        </TouchableOpacity>
        {/* Facts button label */}
        <Text style={[styles.iconText, { fontFamily: 'Inter_700Bold' }]}>
          Facts
        </Text>
      </View>
    </View>
  );
};

export default Controls; 