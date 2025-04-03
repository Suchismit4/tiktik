/**
 * PostInfo Component Styles
 * 
 * Defines the styling for the PostInfo component.
 */
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    // Removed paddingVertical
  },
  caption: {
    // Match old caption style
    fontSize: 19,
    letterSpacing: 0.5,
    lineHeight: 26,
    color: "#fff",
    // Removed marginBottom, fontWeight, textShadow
  },  
  sourceInfo: {
    // Match old sourceInfo style
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceImage: {
    // Match old sourceImage style
    width: 30,
    height: 30,
    // Removed borderRadius, marginRight
  },
  sourceText: {
    // Match old sourceText style
    fontSize: 17,
    marginLeft: 12,
    fontFamily: "ClashDisplay", // Apply font family here
    color: "#fff",
    // Removed opacity, textShadow
  },
});

export default styles; 