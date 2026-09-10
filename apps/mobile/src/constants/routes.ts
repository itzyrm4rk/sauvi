export const ROUTES = {
  AUTH: {
    SPLASH: 'Splash',
    ONBOARDING: 'Onboarding',
    LOGIN: 'Login',
    REGISTER_STEP1: 'RegisterStep1',
    REGISTER_STEP2: 'RegisterStep2',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },
  MAIN: {
    HOME: 'Home',
    SOS: 'Sos',
    EXPLORER: 'Explorer',
    PROFILE: 'Profile',
  },
  SOS: {
    STEP1: 'SosStep1',
    STEP2: 'SosStep2',
    CONFIRM: 'SosConfirm',
    DETAIL: 'SosDetail',
    DONOR_WAITLIST: 'DonorWaitlist',
    HOSPITAL_NAVIGATION: 'HospitalNavigation',
    DONATION_CONFIRM: 'DonationConfirm',
    DASHBOARD: 'SosDashboard',
    FLYER: 'SosFlyer',
  },
} as const;

export const AUTH_STACK = 'AuthStack' as const;
export const MAIN_TABS = 'MainTabs' as const;
