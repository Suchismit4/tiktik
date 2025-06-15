/**
 * Type definitions for the TikTik application
 */

/**
 * Video Post type
 * Represents a single video post in the feed
 */
export interface Post {
  id: number;
  uri: string;
  caption?: string;
  source?: PostSource;
  likes?: number;
  facts?: string[];
  tags?: string[];
  // Streaming-related fields
  originalUri?: string;
  streamingUrl?: string;
  fallbackUrl?: string;
  isStreaming?: boolean;
}

/**
 * Source information for a post
 */
export interface PostSource {
  name: string;
  imageuri?: string;
}

/**
 * User type
 */
export interface User {
  id: string;
  email: string;
  username?: string;
}

/**
 * Survey response type
 */
export interface SurveyResponse {
  questionId: string;
  answer: string | number | boolean;
  timestamp: number;
}

/**
 * Video playback ref methods
 */
export interface VideoRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  unload: () => Promise<void>;
}

/**
 * Navigation parameters
 */
export type RootStackParamList = {
  Login: undefined;
  Feed: undefined;
}; 