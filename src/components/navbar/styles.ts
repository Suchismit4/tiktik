/**
 * Navbar Component Styles
 * 
 * Defines the styling for the Navbar component.
 */
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'ClashDisplay',
    fontSize: 25,
    color: "#ffff",
  },
  icons: {
    width: 35,
    height: 35,
  },
});

export default styles; 