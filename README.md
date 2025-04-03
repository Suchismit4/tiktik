# TikTik

A React Native mobile application inspired by TikTok, built with Expo and TypeScript.

## Overview

TikTik is a video sharing application that allows users to browse short videos in a vertical scrolling feed, similar to TikTok. The app features:

## Project Structure

The project follows a modular architecture:

```
├── App.tsx             # Main application entry point
├── src/                # Application source code
│   ├── assets/         # Images, fonts, and other static assets
│   ├── components/     # Reusable UI components
│   │   └── Post/       # Video post component with gesture handling
│   ├── config/         # Configuration files (Firebase, etc.)
│   ├── constants/      # App-wide constants
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # Application screens
│   ├── services/       # API and service integrations
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
└── deprecated/         # Legacy JavaScript files kept for reference
```

## Getting Started

### Prerequisites

To run this application, you'll need:

- **Node.js** (v16 or newer)
- **npm** (v8 or newer) or **yarn** (v1.22 or newer)
- **Expo CLI** (v6 or newer)
- **Expo Go** app (installed on your physical device for testing)
- **iOS Simulator** or **Android Emulator** (optional, for local testing without a physical device)

### Step-by-Step Installation Guide

1. **Install Node.js and npm**
   - Download from [nodejs.org](https://nodejs.org/)
   - Or use a package manager:
     - macOS: `brew install node`
     - Windows: Use the installer from nodejs.org
     - Linux: `sudo apt install nodejs npm`

2. **Install Expo CLI globally**
   ```bash
   npm install -g expo-cli
   ```

3. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tiktik.git
   cd tiktik
   ```

4. **Install project dependencies**
   ```bash
   npm install
   ```

5. **Start the development server**
   ```bash
   npm start
   # or use the Expo CLI directly
   expo start --tunnel
   ```

6. **Run on a device or simulator**
   - Scan the QR code with your phone's camera (iOS) or the Expo Go app (Android)
   - Press 'i' for iOS simulator
   - Press 'a' for Android emulator
   - Press 'w' for web browser

### Troubleshooting Common Issues

- **"Cannot find module" errors**: Try deleting the `node_modules` folder and running `npm install` again
- **Metro bundler issues**: Clear the cache with `expo start -c`
- **Port already in use**: Change the port with `expo start --port 19001`
- **Dependency conflicts**: Try `npm install --force`

## Features and How to Use

- **Authentication**: Login and registration with email/password
- **Video Feed**: Swipe up and down to navigate between videos
- **Double-tap to Like**: Double-tap anywhere on a video to like it
- **Fact Checking**: Tap the "Facts" button to see verified information about the content
- **Video Controls**: Play, pause, and interact with videos using the overlay controls

## Deprecated Code

The `deprecated/` folder contains legacy JavaScript files that have been replaced with TypeScript versions. These files are kept for reference but are no longer actively used in the application:

- Root directory JavaScript files:
  - `App.js` - Replaced by `App.tsx`
  - `index.js` - Entry point for React Native, now points to the TypeScript implementation
  - `metro.config.js` - Metro bundler configuration
  - `react-native.config.js` - React Native configuration

- Component JavaScript files:
  - All `.js` files from component directories have been moved to corresponding subdirectories in `deprecated/components/`
  - Each component now uses TypeScript `.tsx` and `.ts` files instead

This maintains a clean TypeScript codebase while preserving the original JavaScript implementations for reference.

## Environment Setup

### Development Environment Variables

Create a `.env` file in the root directory with the following variables:

```
API_KEY=your_api_key
FIREBASE_CONFIG=your_firebase_config
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the terms found in the LICENSE file in the root directory.