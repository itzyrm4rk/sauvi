import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import { AUTH_STACK, MAIN_TABS } from '../constants/routes';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import type { RootState } from '../store';
import type { RootStackParamList } from '../types/navigation.types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = accessToken !== null && accessToken.length > 0;

  if (isSplashVisible) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name={MAIN_TABS} component={MainNavigator} />
          <Stack.Screen
            name='SosDetail'
            component={require('../screens/sos/SosDetailScreen').SosDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='DonorWaitlist'
            component={require('../screens/sos/DonorWaitlistScreen').DonorWaitlistScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='HospitalNavigation'
            component={require('../screens/sos/HospitalNavigationScreen').HospitalNavigationScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='SosDashboard'
            component={require('../screens/sos/SosDashboardScreen').SosDashboardScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='Chat'
            component={require('../screens/chat/ChatScreen').ChatScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='Notifications'
            component={require('../screens/notifications/NotificationsScreen').NotificationsScreen}
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name='ExpiredLink'
            component={require('../screens/sos/ExpiredLinkScreen').ExpiredLinkScreen}
            options={{ presentation: 'modal' }}
          />
        </>
      ) : (
        <Stack.Screen name={AUTH_STACK} component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
