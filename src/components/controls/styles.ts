/**
 * Controls Component Styles
 * 
 * Defines the styling for the Controls component.
 */
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 22,
    bottom: 110,
    alignItems: 'center',
    zIndex: 2,
  },
  containerIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  button: {
    width: 36,
    height: 36,
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default styles; 