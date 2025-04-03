import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './style';

/**
 * SurveyForm Component
 * 
 * Displays a simple survey modal, typically shown after a certain number of videos.
 * 
 * @param {object} props - Component props
 * @param {function} props.onSubmit - Function to call when a survey option is selected (dismisses the survey).
 */
const SurveyForm = ({ onSubmit }) => {
  return (
    <View style={styles.surveyContainer}>
      <Text style={styles.surveyTitle}>Quick Survey</Text>
      <Text style={styles.surveyQuestion}>How engaging was the last video?</Text>
      <View style={styles.surveyOptions}>
        {/* Map through predefined options and create buttons */}
        {['Not at all', 'Slightly', 'Moderately', 'Very', 'Extremely'].map((option) => (
          <TouchableOpacity key={option} onPress={onSubmit} style={styles.surveyOptionButton}>
            <Text style={styles.surveyOptionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default SurveyForm; 