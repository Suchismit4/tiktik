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
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%', // Adjust gradient height
    zIndex: 1, // Below controls/info, above video
  },
  flyingHeartBase: {
    position: 'absolute',
    zIndex: 20, // Above video/gradient, below facts panel
    // Width/Height defined in flyingHeartIcon
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- NEW Style for the flying heart image itself ---
  flyingHeartIcon: {
    width: 80, // Adjust size as desired
    height: 80,
    tintColor: '#FF0000', // Red heart (or use a pre-colored image)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
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