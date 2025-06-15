/**
 * Auth Context - TEMPORARILY DISABLED FIREBASE FOR TESTING
 * 
 * Provides authentication state and methods throughout the application.
 * Currently using mock data to test app functionality without Firebase.
 */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
// TEMPORARILY COMMENTED OUT FIREBASE IMPORTS
// import { 
//   onAuthStateChanged, 
//   createUserWithEmailAndPassword, 
//   signInWithEmailAndPassword,
//   signOut,
//   User as FirebaseUser
// } from 'firebase/auth';
// import { auth } from '../config/firebase';
import { User } from '../types';

// Context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component - MOCK VERSION
 * 
 * Provides mock authentication for testing without Firebase.
 * 
 * @param {AuthProviderProps} props - The provider props
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock auth state - simulate logged out user
  useEffect(() => {
    // Simulate loading time then set to logged out
    const timer = setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * Mock login function
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Mock login for:', email);
      // Simulate successful login
      setUser({
        id: 'mock-user-id',
        email: email,
        username: 'Mock User',
      });
    } catch (error) {
      console.error('Mock login error:', error);
      throw error;
    }
  };

  /**
   * Mock register function
   */
  const register = async (email: string, password: string): Promise<void> => {
    try {
      console.log('Mock register for:', email);
      // Simulate successful registration
      setUser({
        id: 'mock-user-id',
        email: email,
        username: 'Mock User',
      });
    } catch (error) {
      console.error('Mock register error:', error);
      throw error;
    }
  };

  /**
   * Mock logout function
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('Mock logout');
      setUser(null);
    } catch (error) {
      console.error('Mock logout error:', error);
      throw error;
    }
  };

  // Provide the auth context value
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {AuthContextType} The auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 