/**
 * Firebase Configuration Module
 * 
 * This module initializes and exports Firebase services for the application.
 * It configures Firebase Authentication with AsyncStorage persistence for
 * maintaining user sessions across app restarts.
 * 
 * The configuration follows Firebase best practices for React Native applications.
 */
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  Auth 
} from "firebase/auth";
import { getAnalytics, Analytics } from "firebase/analytics";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Configuration Object
 * 
 * Contains the API keys and identifiers for your Firebase project.
 * These values are provided by Firebase when you create a new project.
 * 
 * SECURITY NOTE: These keys are safe to include in client-side code.
 * They're not secret and are visible in network requests anyway.
 * Proper security is enforced through Firebase Security Rules.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBUk0JFivJkIqIuRJ-qJibxUJm9qWqAW5g",
  authDomain: "tiktik-ee1a2.firebaseapp.com",
  projectId: "tiktik-ee1a2",
  storageBucket: "tiktik-ee1a2.appspot.com",
  messagingSenderId: "216996974478",
  appId: "1:216996974478:web:e65e5cdf5a31f9188f9edf",
  measurementId: "G-17LDKYGVLH"
};

/**
 * Initialize Firebase App
 * 
 * Creates a new Firebase app instance or returns an existing one.
 * This prevents multiple instances of Firebase from being created.
 */
let app: FirebaseApp;
if (!getApps().length) {
  // Initialize a new app instance if none exists
  app = initializeApp(firebaseConfig);
} else {
  // Use the existing app instance
  app = getApps()[0];
}

/**
 * Initialize Firebase Authentication
 * 
 * Configures authentication with React Native AsyncStorage persistence.
 * This allows user credentials to persist between app restarts.
 */
const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

/**
 * Initialize Firebase Analytics
 * 
 * Sets up analytics for tracking user behavior and app usage.
 * Note: Analytics may not be fully supported on all React Native platforms.
 */
const analytics: Analytics = getAnalytics(app);

// Export the Firebase services for use throughout the application
export { auth, analytics }; 