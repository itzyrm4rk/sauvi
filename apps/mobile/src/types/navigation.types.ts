import type { NavigatorScreenParams } from '@react-navigation/native';
import type { SosResponse } from '../store/api/sosApi';

import { AUTH_STACK, MAIN_TABS, ROUTES } from '../constants/routes';

export type AuthStackParamList = {
  [ROUTES.AUTH.SPLASH]: undefined;
  [ROUTES.AUTH.ONBOARDING]: undefined;
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.REGISTER_STEP1]: undefined;
  [ROUTES.AUTH.REGISTER_STEP2]: { email: string; accessToken: string; refreshToken: string };
  [ROUTES.AUTH.FORGOT_PASSWORD]: undefined;
  [ROUTES.AUTH.RESET_PASSWORD]: { email: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Eligibility: undefined;
  Badges: undefined;
  History: undefined;
  Settings: undefined;
  BloodCompatibility: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
};

export type MainTabParamList = {
  [ROUTES.MAIN.HOME]: undefined;
  [ROUTES.MAIN.SOS]: NavigatorScreenParams<SosStackParamList> | undefined;
  [ROUTES.MAIN.EXPLORER]: undefined;
  [ROUTES.MAIN.PROFILE]: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type SosPriority = 'preventif' | 'urgence_vitale';

export type SosDraft = {
  bloodTypeNeeded: 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';
  unitsNeeded: number;
  priority: SosPriority;
};

export type SosInitialData = {
  bloodTypeNeeded?: 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+' | undefined;
  unitsNeeded?: number | undefined;
  priority?: SosPriority | undefined;
  hospitalName?: string | undefined;
  hospitalAddress?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
  city?: string | undefined;
};

export type SosLocationDraft = SosDraft & {
  hospitalName: string;
  hospitalAddress: string;
  latitude: number;
  longitude: number;
  city: string;
};

export type SosStackParamList = {
  SosIndex: undefined;
  [ROUTES.SOS.STEP1]: { initialData?: SosInitialData | undefined } | undefined;
  [ROUTES.SOS.STEP2]: SosDraft & {
    initialHospitalName?: string | undefined;
    initialHospitalAddress?: string | undefined;
    initialLatitude?: number | undefined;
    initialLongitude?: number | undefined;
    initialCity?: string | undefined;
  };
  [ROUTES.SOS.CONFIRM]: SosLocationDraft;
  [ROUTES.SOS.DETAIL]: { sosId: string; sos?: SosResponse['data'] };
  [ROUTES.SOS.DONOR_WAITLIST]: { sosId: string };
  [ROUTES.SOS.HOSPITAL_NAVIGATION]: { sosId: string };
  [ROUTES.SOS.DONATION_CONFIRM]: { pointsEarned: number };
  [ROUTES.SOS.DASHBOARD]: { sosId: string };
  [ROUTES.SOS.FLYER]: { sosId: string };
  Chat: {
    sosId: string;
    contactId: string;
    contactName: string;
    contactPhone?: string;
    isClosed?: boolean;
  };
};

export type RootStackParamList = {
  [AUTH_STACK]: NavigatorScreenParams<AuthStackParamList>;
  [MAIN_TABS]: NavigatorScreenParams<MainTabParamList>;
  SosDetail: { sosId: string; sos?: SosResponse['data'] };
  DonorWaitlist: { sosId: string };
  HospitalNavigation: { sosId: string };
  SosDashboard: { sosId: string };
  Chat: {
    sosId: string;
    contactId: string;
    contactName: string;
    contactPhone?: string;
    isClosed?: boolean;
  };
  EditProfile: undefined;
  ChangePassword: undefined;
  Notifications: undefined;
  ExpiredLink:
    | {
        status?: 'fulfilled' | 'expired' | 'closed' | 'active';
        unitsNeeded?: number;
        collectedUnits?: number;
        bloodTypeNeeded?: string;
        hospitalName?: string;
        city?: string;
      }
    | undefined;
  BloodCompatibility: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
