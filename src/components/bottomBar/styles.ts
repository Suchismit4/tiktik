/**
 * BottomBar Component Styles
 * 
 * Defines the styling for the BottomBar component.
 */
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    height: 95,
    paddingHorizontal: 10,
    paddingTop: 22,
    paddingBottom: 45,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    zIndex: 10,
    alignItems: 'center',
  },
  iconsHolder: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
  },
  iconHolder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icons: {
    width: 31.5,
    height: 31.5,
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  tabIcon: {
    width: 31.5,
    height: 31.5,
    tintColor: '#888',
    marginBottom: 3,
  },
  activeTabIcon: {
    tintColor: '#fff',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
  },
  activeTabLabel: {
    color: '#fff',
  },
  title: {
    fontSize: 12,
    fontWeight: '200',
    marginTop: 4,
    color: '#ddd',
    textAlign: 'center',
  },
});

export default styles; 