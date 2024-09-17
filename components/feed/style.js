import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    gradientOverlayTop: {
      position: 'absolute',
      top: -85,
      left: 0,
      right: 0,
      height: '50%',
      zIndex: 5,
      pointerEvents: 'none'
    },
    gradientOverlayBottom: {
      position: 'absolute',
      bottom: -60,
      left: 0,
      right: 0,
      height: '50%',
      zIndex: 5,
      pointerEvents: 'none'
    },
    overlayTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 6,
    },
    overlayBottom: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 6,
      backgroundColor: "#000",
    },
    postinfo: {
      position: 'absolute',
      bottom: "17%", // Adjust according to your design
      width: "70%",
      left: 33,
      right: 0,
      zIndex: 10, // Ensure it's above the gradient
    }
  });
  
  
  export default styles;