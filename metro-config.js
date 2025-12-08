// metro.config.cjs
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .cjs support for Firebase (if you still need it)
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Avoid package exports resolution issues (optional)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
