/**
 * SurveyForm Component
 * 
 * Displays a survey form that collects user feedback.
 * Appears periodically during app usage or when triggered by specific events.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import styles from './styles';
import { SurveyResponse } from '../../types';
import { submitSurveyResponses } from '../../utils/analytics';

interface SurveyFormProps {
  /** Function to call when the survey is submitted */
  onSubmit: () => void;
}

/**
 * SurveyForm Component
 * 
 * @param {SurveyFormProps} props - Component props
 */
const SurveyForm: React.FC<SurveyFormProps> = ({ onSubmit }) => {
  // Survey state
  const [responses, setResponses] = useState<{
    engagement: number | null;
    quality: number | null;
    feedback: string;
  }>({
    engagement: null,
    quality: null,
    feedback: '',
  });

  /**
   * Handles rating selection for Likert scale questions
   * @param {string} question - Question identifier
   * @param {number} value - Selected rating value
   */
  const handleRating = (question: 'engagement' | 'quality', value: number) => {
    setResponses((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  /**
   * Handles text input for feedback question
   * @param {string} text - User input text
   */
  const handleFeedbackChange = (text: string) => {
    setResponses((prev) => ({
      ...prev,
      feedback: text,
    }));
  };

  /**
   * Handles survey submission
   */
  const handleSubmit = () => {
    // Create survey response objects
    const surveyResponses: SurveyResponse[] = [
      {
        questionId: 'engagement',
        answer: responses.engagement || 0,
        timestamp: Date.now(),
      },
      {
        questionId: 'quality',
        answer: responses.quality || 0,
        timestamp: Date.now(),
      },
      {
        questionId: 'feedback',
        answer: responses.feedback,
        timestamp: Date.now(),
      },
    ];

    // Submit responses to backend
    submitSurveyResponses(surveyResponses);
    
    // Notify parent component
    onSubmit();
  };

  /**
   * Renders a rating scale (1-5) for a question
   * @param {string} question - Question identifier
   * @param {number|null} selectedValue - Currently selected value
   */
  const renderRatingScale = (question: 'engagement' | 'quality', selectedValue: number | null) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.ratingButton,
              selectedValue === value && styles.selectedRating,
            ]}
            onPress={() => handleRating(question, value)}
          >
            <Text style={[
              styles.ratingText,
              selectedValue === value && styles.selectedRatingText,
            ]}>
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>Research Survey</Text>
        <Text style={styles.description}>
          Please help us by providing feedback on your experience.
          Your responses are valuable for our research.
        </Text>

        <ScrollView style={styles.formContainer}>
          <Text style={styles.questionText}>
            How engaging did you find the content?
          </Text>
          <Text style={styles.ratingLabels}>
            <Text>Not at all</Text>
            <Text style={{ marginLeft: 'auto' }}>Very engaging</Text>
          </Text>
          {renderRatingScale('engagement', responses.engagement)}

          <Text style={styles.questionText}>
            How would you rate the quality of the content?
          </Text>
          <Text style={styles.ratingLabels}>
            <Text>Poor</Text>
            <Text style={{ marginLeft: 'auto' }}>Excellent</Text>
          </Text>
          {renderRatingScale('quality', responses.quality)}

          <Text style={styles.questionText}>
            Any additional feedback?
          </Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={3}
            placeholder="Enter your feedback here..."
            value={responses.feedback}
            onChangeText={handleFeedbackChange}
          />
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default SurveyForm; 