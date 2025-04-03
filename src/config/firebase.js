// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth"; // Include initializeAuth for React Native
import { getAnalytics } from "firebase/analytics";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBUk0JFivJkIqIuRJ-qJibxUJm9qWqAW5g",
    authDomain: "tiktik-ee1a2.firebaseapp.com",
    projectId: "tiktik-ee1a2",
    storageBucket: "tiktik-ee1a2.appspot.com",
    messagingSenderId: "216996974478",
    appId: "1:216996974478:web:e65e5cdf5a31f9188f9edf",
    measurementId: "G-17LDKYGVLH"
};

// Initialize Firebase app if it hasn't been initialized already
let app;
if (!getApps().length) {
    // Initialize a new app instance if none exists
    app = initializeApp(firebaseConfig);
} else {
    // Use the existing app instance
    app = getApps()[0];
}

// Use initializeAuth and getReactNativePersistence for React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Get Analytics only if you're running this on a platform that supports it (e.g., Web)
const analytics = getAnalytics(app);

// Export the auth instance for use in other parts of the app
export { auth };
