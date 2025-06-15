import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

/**
 * Register the main component of the application.
 * 
 * registerRootComponent calls AppRegistry.registerComponent('main', () => App)
 * It also ensures that whether you load the app in Expo Go or in a native build,
 * the environment is set up appropriately.
 */
registerRootComponent(App); 