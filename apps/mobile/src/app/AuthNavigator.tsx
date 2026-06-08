import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ROUTES } from '../constants/routes';
import { colors } from '../constants/theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterStep1Screen } from '../screens/auth/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/auth/RegisterStep2Screen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import type { AuthStackParamList } from '../types/navigation.types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName={ROUTES.AUTH.SPLASH}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name={ROUTES.AUTH.SPLASH} component={SplashScreen} />
      <Stack.Screen name={ROUTES.AUTH.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.REGISTER_STEP1} component={RegisterStep1Screen} />
      <Stack.Screen name={ROUTES.AUTH.REGISTER_STEP2} component={RegisterStep2Screen} />
    </Stack.Navigator>
  );
}
