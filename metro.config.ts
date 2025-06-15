// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';

/**
 * Metro bundler configuration for the TikTik application
 * Updated to support Firebase .cjs files and fix auth registration issues
 */
const config = getDefaultConfig(__dirname);

// Add .cjs support for Firebase
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

export default config; 