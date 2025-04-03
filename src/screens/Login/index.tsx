/**
 * Login Screen Component
 * 
 * This screen is responsible for user authentication in the TikTik application.
 * It provides:
 * - Email/password login functionality
 * - New user registration
 * - Form validation
 * - Automatic navigation to the Feed screen upon successful authentication
 * 
 * The component uses Firebase Authentication via the AuthContext
 * to manage the authentication flow and user state.
 */
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  KeyboardAvoidingView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import styles from './styles';
import { RootStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import useFonts from '../../hooks/useFonts';

/**
 * Navigation prop type for the Login screen
 * This enables type checking for the navigation object
 */
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

/**
 * Login Screen Component
 * 
 * Renders the authentication screen with login and registration functionality.
 * Includes form fields, validation, and submission handling.
 * 
 * @returns {JSX.Element} The rendered Login component
 */
const Login: React.FC = () => {
  // Form state for user inputs
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Loading state for button disabling during submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Navigation hook for screen transitions
  const navigation = useNavigation<LoginScreenNavigationProp>();
  
  // Auth context provides user state and authentication methods
  const { user, login, register } = useAuth();
  
  // Custom hook for loading custom fonts
  const { fontsLoaded, fontsError } = useFonts();

  /**
   * Effect to handle automatic navigation when user is authenticated
   * Redirects to the Feed screen if a user is already logged in
   */
  useEffect(() => {
    if (user) {
      navigation.navigate('Feed');
    }
  }, [user, navigation]);

  // Delay rendering until fonts are loaded to prevent layout shifts
  if (!fontsLoaded && !fontsError) {
    return null;
  }

  /**
   * Handle user registration process
   * 
   * 1. Validates the form inputs
   * 2. Sets submission state for UI feedback
   * 3. Calls the register method from AuthContext
   * 4. Handles errors with user-friendly messages
   * 
   * Navigation occurs automatically via the auth state change in useEffect
   */
  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await register(email, password);
      // Navigation happens automatically due to the auth state change listener
    } catch (error: any) {
      // Display user-friendly error message
      Alert.alert('Registration Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle user login process
   * 
   * 1. Validates the form inputs
   * 2. Sets submission state for UI feedback
   * 3. Calls the login method from AuthContext
   * 4. Handles errors with user-friendly messages
   * 
   * Navigation occurs automatically via the auth state change in useEffect
   */
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await login(email, password);
      // Navigation happens automatically due to the auth state change listener
    } catch (error: any) {
      // Display user-friendly error message
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Validate form inputs before submission
   * 
   * Performs several checks:
   * 1. Email field is not empty
   * 2. Password field is not empty
   * 3. Password meets minimum length requirement (6 characters)
   * 
   * For each validation failure, displays an appropriate alert message
   * 
   * @returns {boolean} True if all validations pass, false otherwise
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Password Required', 'Please enter your password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Adjust view when keyboard appears
    >
      {/* Logo Section - App Branding */}
      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { fontFamily: 'ClashDisplay' }]}>
          NewsNow
        </Text>
      </View>
      
      {/* Input Fields Section - User Credentials */}
      <View style={styles.inputContainer}>
        {/* Email Input Field */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#130f40"
          keyboardType="email-address" // Show email keyboard
          autoCapitalize="none" // Don't capitalize email addresses
          editable={!isSubmitting} // Disable during submission
        />
        
        {/* Password Input Field */}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry // Hide password text
          placeholderTextColor="#130f40"
          editable={!isSubmitting} // Disable during submission
        />
      </View>

      {/* Buttons Section - Authentication Actions */}
      <View style={styles.buttonContainer}>
        {/* Login Button - Primary Action */}
        <TouchableOpacity
          onPress={handleLogin}
          style={styles.button}
          disabled={isSubmitting} // Prevent multiple submissions
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Logging in...' : 'Login'} {/* Dynamic button text */}
          </Text>
        </TouchableOpacity>
        
        {/* Register Button - Secondary Action */}
        <TouchableOpacity
          onPress={handleSignUp}
          style={[styles.button, styles.buttonOutline]}
          disabled={isSubmitting} // Prevent multiple submissions
        >
          <Text style={styles.buttonOutlineText}>
            {isSubmitting ? 'Registering...' : 'Register'} {/* Dynamic button text */}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login; 