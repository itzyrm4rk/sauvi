import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import { AUTH_STACK, MAIN_TABS } from '../constants/routes';
import type { RootState } from '../store';
import type { RootStackParamList } from '../types/navigation.types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isAuthenticated = accessToken !== null && accessToken.length > 0;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name={MAIN_TABS} component={MainNavigator} />
      ) : (
        <Stack.Screen name={AUTH_STACK} component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
