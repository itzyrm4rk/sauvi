import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import type { LinkingOptions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { OfflineBanner } from '../components/ui/OfflineBanner';
import { ToastProvider } from '../components/ui/toastConfig';
import { colors } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';
import { navigationRef } from '../navigation/navigationRef';
import { persistor, store } from '../store';
import type { RootStackParamList } from '../types/navigation.types';
import { ErrorBoundary } from './ErrorBoundary';
import { RootNavigator } from './RootNavigator';

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'sauvi://', 'https://sauvi.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Sos: {
            screens: {
              SosDetail: 'sos/:sosId',
            },
          },
        },
      },
    },
  },
};

function AppRuntime(): React.JSX.Element {
  useNotifications();

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <StatusBar style='dark' />
      <RootNavigator />
      <ToastProvider />
      <OfflineBanner />
    </NavigationContainer>
  );
}

export function App(): React.JSX.Element {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size='large' />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GestureHandlerRootView style={styles.root}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <AppRuntime />
            </PersistGate>
          </Provider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default App;
