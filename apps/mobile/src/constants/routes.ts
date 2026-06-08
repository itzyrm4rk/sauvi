export const ROUTES = {
  AUTH: {
    SPLASH: 'Splash',
    ONBOARDING: 'Onboarding',
    LOGIN: 'Login',
    REGISTER_STEP1: 'RegisterStep1',
    REGISTER_STEP2: 'RegisterStep2',
  },
  MAIN: {
    HOME: 'Home',
    SOS: 'Sos',
    NOTIFICATIONS: 'Notifications',
    PROFILE: 'Profile',
  },
} as const;

export const AUTH_STACK = 'AuthStack' as const;
export const MAIN_TABS = 'MainTabs' as const;
