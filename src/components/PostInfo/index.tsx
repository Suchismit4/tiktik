/**
 * PostInfo Component
 * 
 * Displays information related to a post, such as the caption and source.
 */
import React from 'react';
import { View, Text, Image } from 'react-native';
import styles from './styles';
import { PostSource } from '../../types';

interface PostInfoProps {
  /** Caption text for the post */
  caption?: string;
  /** Source information for the post */
  source?: PostSource;
}

/**
 * PostInfo Component
 * 
 * @param {PostInfoProps} props - Component props
 */
const PostInfo: React.FC<PostInfoProps> = ({ 
  caption = 'A short caption similar to explanatory headline.', 
  source = { 
    name: 'USA Today', 
    imageuri: 'https://i.imgur.com/P8OOZMm.png' 
  }
}) => {
  return (
    <View style={styles.container}> 
      {/* Caption Text - Removed inline fontFamily, style should handle it if needed */}
      <Text style={styles.caption}>
        {caption}
      </Text>
      
      {/* Source Information Section */}
      <View style={styles.sourceInfo}>
        <Image
          style={styles.sourceImage} 
          source={{ uri: source.imageuri }}
        />
        {/* Source name - Style applies fontFamily */}
        <Text style={styles.sourceText}>{source.name}</Text>
      </View>
    </View>
  );
};

export default PostInfo; 