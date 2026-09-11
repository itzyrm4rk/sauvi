export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type Gender = 'masculin' | 'feminin';

export type BadgeType = 'bronze' | 'argent' | 'or' | 'diamant' | 'legende';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  bloodType: BloodType;
  gender: Gender;
  birthDate: string;
  avatarUrl: string | null;
  reputationPoints: number;
  isEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  data: {
    user: IUser;
    tokens: IAuthTokens;
    profileComplete: boolean;
  };
}
