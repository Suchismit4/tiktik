// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';
import { MetroConfig } from 'expo/metro-config';

/**
 * Metro bundler configuration for the TikTik application
 */
const config: MetroConfig = getDefaultConfig(__dirname);

export default config; 