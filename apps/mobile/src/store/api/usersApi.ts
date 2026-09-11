import { baseApi } from './baseApi';

export interface UserProfileResponse {
  data: {
    id: string;
    email: string;
    name: string;
    city: string | null;
    phone: string | null;
    bloodType: string;
    gender: string;
    avatarUrl: string | null;
    reputationPoints: number;
    isEligible: boolean;
    fcmToken?: string | null;
    lastDonationDate?: string | null;
    nextEligibleDate?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  bloodType: string;
  reputationPoints: number;
  totalDonations: number;
  totalSos: number;
  memberSince: string;
  badges: Array<{
    type: 'bronze' | 'argent' | 'or' | 'diamant' | 'legende';
    earnedAt: string;
  }>;
}

export interface EligibilityResponse {
  data: {
    isEligible: boolean;
    nextEligibleDate: string | null;
    daysRemaining: number;
  };
}

export interface DonationHistoryItem {
  id: string;
  sosId: string;
  date: string | null;
  hospitalName: string;
  city: string;
  bloodTypeNeeded: string;
  pointsEarned: number;
  requesterId?: string | null;
  requesterName: string | null;
  requesterPhone?: string | null;
  sosCreatedAt: string | null;
}

export interface SosHistoryItem {
  id: string;
  bloodTypeNeeded: string;
  unitsNeeded?: number;
  priority?: 'preventif' | 'urgence_vitale';
  hospitalName: string;
  hospitalAddress?: string;
  latitude?: number;
  longitude?: number;
  city: string;
  status: 'active' | 'closed' | 'fulfilled' | 'expired';
  createdAt: string;
  closedAt: string | null;
  donationsCount: number;
  waitlistCount?: number;
  firstDonorId?: string | null;
  firstDonorName?: string | null;
  firstDonorPhone?: string | null;
  firstDonorBloodType?: string | null;
  donors?: Array<{
    id: string;
    name: string;
    phone?: string | null;
    bloodType?: string | null;
  }>;
}

export interface UpdateFcmTokenRequest {
  fcmToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: 'users/me',
        method: 'GET',
      }),
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<UserProfileResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: 'users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    changePassword: builder.mutation<{ data: { message: string } }, ChangePasswordRequest>({
      query: (body) => ({
        url: 'users/me/password',
        method: 'PATCH',
        body,
      }),
    }),

    getEligibility: builder.query<EligibilityResponse, void>({
      query: () => ({
        url: 'users/me/eligibility',
        method: 'GET',
      }),
      providesTags: ['User'],
      keepUnusedDataFor: 300,
    }),

    uploadAvatar: builder.mutation<UserProfileResponse, { formData: FormData; token?: string }>({
      query: ({ formData, token }) => ({
        url: 'users/me/avatar',
        method: 'POST',
        ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),

    updateFcmToken: builder.mutation<{ data: { message: string } }, UpdateFcmTokenRequest>({
      query: (body) => ({
        url: 'users/me/fcm-token',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    getDonationHistory: builder.query<{ data: DonationHistoryItem[] }, void>({
      query: () => ({ url: 'users/me/donation-history', method: 'GET' }),
      providesTags: ['User'],
    }),

    getSosHistory: builder.query<{ data: SosHistoryItem[] }, void>({
      query: () => ({ url: 'users/me/sos-history', method: 'GET' }),
      providesTags: ['User'],
    }),

    getActiveDonation: builder.query<
      {
        data: {
          id: string;
          sosId: string;
          status: 'waiting' | 'validated' | 'donated' | 'cancelled' | 'rejected';
          joinedAt: string;
          sos: {
            id: string;
            hospitalName: string;
            hospitalAddress: string;
            city: string;
            bloodTypeNeeded: string;
            unitsNeeded: number;
            priority: string;
            status: string;
            createdAt: string;
          };
        } | null;
      },
      void
    >({
      query: () => ({ url: 'users/me/active-donation', method: 'GET' }),
      providesTags: ['Sos', 'User'],
    }),

    getPublicProfile: builder.query<{ data: PublicUserProfile }, { userId: string }>({
      query: ({ userId }) => ({ url: `users/${userId}/public-profile`, method: 'GET' }),
      providesTags: ['User'],
    }),

    disableNotifications: builder.mutation<{ data: { message: string } }, void>({
      query: () => ({ url: 'users/me/notifications', method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetEligibilityQuery,
  useUploadAvatarMutation,
  useUpdateFcmTokenMutation,
  useGetActiveDonationQuery,
  useGetDonationHistoryQuery,
  useGetSosHistoryQuery,
  useGetPublicProfileQuery,
  useDisableNotificationsMutation,
} = usersApi;
