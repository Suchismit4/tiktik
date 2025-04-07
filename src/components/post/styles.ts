/**
 * Post Component Styles
 * 
 * Defines the styling for the Post component.
 */
import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: height, // Ensure each item fills the screen height
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject, // Shortcut for position:'absolute', top:0, bottom:0, left:0, right:0
    backgroundColor: '#000', // Optional: Show black background while video loads
},
  postinfo: {
    position: 'absolute',
    left: 33,
    bottom: 130,
    right: 0,
    width: "70%",
    zIndex: 10
  },
  // Heart animation styles for double-tap
  // heartContainer: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   zIndex: 5,
  // },
  // heartIcon: {
  //   width: 100,
  //   height: 100,
  //   tintColor: '#ffffff', // White heart
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.3,  // Reduced from 0.5 for a subtler shadow
  //   shadowRadius: 3,     // Reduced from 5 for a less diffuse shadow
  // },
  tapHeartBase: {
    position: 'absolute',
    zIndex: 20, // Ensure hearts are above video/gradient but potentially below modals
    // Dimensions defined in tapHeartIcon
    // Left/Top positioning is done inline using state
     alignItems: 'center', // Center the inner elements if needed
    justifyContent: 'center',
},
tapHeartIcon: {
    width: 80, // Size of the hearts
    height: 80,
    tintColor: '#FF0000', // TikTok Red color for the heart
    // Add shadow for better visibility if needed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    // Note: tintColor might not work with all image types (esp. complex SVGs).
    // If it doesn't work, use a pre-colored red heart image.
},
  factsSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ecf0f1',
    padding: 10,
    height: '75%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 999,  // Ensures it's above everything else
  },
  factsPopup: {
    position: 'absolute',
    width: '80%',
    height: 200,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignSelf: 'center',
    top: '30%',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1000,
  },
  closeButton: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  }
});

export default styles; 