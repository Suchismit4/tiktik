/**
 * Video Context
 * 
 * Provides video data and analytics throughout the application.
 * Tracks user interaction metrics like watch time and scroll depth.
 */
import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { Post, SurveyResponse } from '../types';
import { VIDEOS } from '../constants/videos';
import { postsApi, getBestVideoUrl } from '../services/api';

// Video context interface
interface VideoContextType {
  videos: Post[];
  timeSpent: Record<string, number>;
  maxScrollDepth: number;
  videoCount: number;
  updateTimeSpent: (videoId: string, duration: number) => void;
  updateScrollDepth: (depth: number) => void;
  incrementVideoCount: () => void;
  saveSurveyResponse: (response: SurveyResponse) => void;
  surveyResponses: SurveyResponse[];
  resetMetrics: () => void;
}

// Create context with default value
const VideoContext = createContext<VideoContextType>({
  videos: [],
  timeSpent: {},
  maxScrollDepth: 0,
  videoCount: 0,
  updateTimeSpent: () => {},
  updateScrollDepth: () => {},
  incrementVideoCount: () => {},
  saveSurveyResponse: () => {},
  surveyResponses: [],
  resetMetrics: () => {},
});

// Provider props interface
interface VideoProviderProps {
  children: ReactNode;
}

/**
 * Video Provider Component
 * 
 * Provides video data and analytics to the application.
 * 
 * @param {VideoProviderProps} props - The provider props
 */
export const VideoProvider: React.FC<VideoProviderProps> = ({ children }) => {
  // State for video data and analytics
  // CHANGE "[]" WITH "VIDEOS" WHEN NOT USING API
  // AND "VIDEOS" with "[]" WHEN USING API
  const [videos, setVideos] = useState<Post[]>([]);
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [maxScrollDepth, setMaxScrollDepth] = useState<number>(0);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  
  // Ref to track the last viewed content
  const lastViewedRef = useRef<{ startTime: number | null; contentId: string | null }>({
    startTime: null,
    contentId: null,
  });

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log('Fetching videos from API...');
        const apiVideos = await postsApi.getPosts();
        console.log('API Videos received:', apiVideos);
        
        if (apiVideos && apiVideos.length > 0) {
          // Process videos to get the best available URLs (streaming or fallback)
          const processedVideos = await Promise.all(
            apiVideos.map(async (video: Post) => {
              try {
                const bestUrl = await getBestVideoUrl(video);
                console.log(`Video ${video.id}: Using URL ${bestUrl}`);
                return {
                  ...video,
                  uri: bestUrl,
                  originalUri: video.uri, // Keep original for reference
                  isStreaming: bestUrl.includes('/stream/'),
                };
              } catch (error) {
                console.error(`Error processing video ${video.id}:`, error);
                return video; // Return original if processing fails
              }
            })
          );
          
          setVideos(processedVideos);
          console.log('Videos set from API with streaming URLs:', processedVideos.length);
        } else {
          console.log('No videos from API, using fallback constants');
          setVideos(VIDEOS);
        }
      } catch (error) {
        console.error('Error fetching videos from API:', error);
        console.log('Using fallback video constants due to API error');
        setVideos(VIDEOS);
      }
    };
    fetchVideos();
  }, []);

  /**
   * Update time spent on a video
   * @param {string} videoId - ID of the video
   * @param {number} duration - Duration spent watching in milliseconds
   */
  const updateTimeSpent = useCallback((videoId: string, duration: number) => {
    setTimeSpent((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] || 0) + duration,
    }));
  }, []);

  /**[1,2,2,3,3,] = list; ...list
   * Update the maximum scroll depth
   * @param {number} depth - Current scroll depth
   */
  const updateScrollDepth = useCallback((depth: number) => {
    setMaxScrollDepth((prev) => Math.max(prev, depth));
  }, []);

  /**
   * Increment the number of videos viewed
   */
  const incrementVideoCount = useCallback(() => {
    setVideoCount((prev) => prev + 1);
  }, []);

  /**
   * Save a survey response
   * @param {SurveyResponse} response - The survey response
   */
  const saveSurveyResponse = useCallback((response: SurveyResponse) => {
    setSurveyResponses((prev) => [...prev, response]);
    
    // In a real app, you would send this to a backend
    console.log('Survey response saved:', response);
  }, []);

  /**
   * Reset all metrics
   */
  const resetMetrics = useCallback(() => {
    setTimeSpent({});
    setMaxScrollDepth(0);
    setVideoCount(0);
    lastViewedRef.current = { startTime: null, contentId: null };
  }, []);

  return (
    <VideoContext.Provider 
      value={{
        videos,
        timeSpent,
        maxScrollDepth,
        videoCount,
        updateTimeSpent,
        updateScrollDepth,
        incrementVideoCount,
        saveSurveyResponse,
        surveyResponses,
        resetMetrics,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

/**
 * Custom hook to use the video context
 * @returns {VideoContextType} The video context
 */
export const useVideo = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

export default VideoContext; 