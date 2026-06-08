import type { NavigatorScreenParams } from '@react-navigation/native';

import { AUTH_STACK, MAIN_TABS, ROUTES } from '../constants/routes';

export type AuthStackParamList = {
  [ROUTES.AUTH.SPLASH]: undefined;
  [ROUTES.AUTH.ONBOARDING]: undefined;
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.REGISTER_STEP1]: undefined;
  [ROUTES.AUTH.REGISTER_STEP2]: { email: string };
};

export type MainTabParamList = {
  [ROUTES.MAIN.HOME]: undefined;
  [ROUTES.MAIN.SOS]: undefined;
  [ROUTES.MAIN.NOTIFICATIONS]: undefined;
  [ROUTES.MAIN.PROFILE]: undefined;
};

export type RootStackParamList = {
  [AUTH_STACK]: NavigatorScreenParams<AuthStackParamList>;
  [MAIN_TABS]: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
