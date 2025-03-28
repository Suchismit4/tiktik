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
      bottom: "17%",
      width: "70%",
      left: 33,
      right: 0,
      zIndex: 10, 
    }, surveyContainer: {
      position: 'absolute',
      top: '30%', // Adjust for better positioning
      left: '10%',
      right: '10%',
      backgroundColor: 'white',
      padding: 20,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 999, // Ensure it appears above all elements
      alignItems: 'center',
    },
    
    surveyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    
    surveyOptions: {
      marginTop: 10,
    },
    
    surveyOption: {
      fontSize: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: 5,
      textAlign: 'center',
      marginBottom: 5,
    }    
  });
  
  
  export default styles;