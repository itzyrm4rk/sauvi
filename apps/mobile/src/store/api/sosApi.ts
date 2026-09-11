import { baseApi } from './baseApi';

export type SosPriority = 'preventif' | 'urgence_vitale';
export type BloodType = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export interface CreateSosRequest {
  bloodTypeNeeded: BloodType;
  unitsNeeded: number;
  priority: SosPriority;
  hospitalName: string;
  hospitalAddress: string;
  latitude: number;
  longitude: number;
  city: string;
}

export interface SosResponse {
  data: {
    id: string;
    requesterId: string;
    bloodTypeNeeded: string;
    unitsNeeded: number;
    priority: SosPriority;
    hospitalName: string;
    hospitalAddress: string;
    latitude: number;
    longitude: number;
    city: string;
    status: 'active' | 'closed' | 'fulfilled' | 'expired';
    expiresAt?: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    waitlistCount?: number;
    requester?: {
      name: string;
      phone: string;
    };
  };
}

export interface SosListResponse {
  data: SosResponse['data'][];
  total: number;
}

export type WaitlistStatus = 'waiting' | 'validated' | 'donated' | 'cancelled' | 'rejected';

export interface DonorWaitlistItem {
  id: string;
  sosId: string;
  donorId: string;
  status: WaitlistStatus;
  joinedAt: string;
  validatedAt: string | null;
  donatedAt: string | null;
  distanceKm: number | null;
  donor: {
    id: string;
    name: string;
    bloodType: string;
    phone: string;
    avatarUrl: string | null;
    city: string;
    isEligible: boolean;
  };
}

export interface MyWaitlistEntryResponse {
  data: {
    id: string;
    sosId: string;
    donorId: string;
    status: WaitlistStatus;
    joinedAt: string;
    validatedAt: string | null;
    donatedAt: string | null;
  } | null;
}

export interface WaitlistResponse {
  data: DonorWaitlistItem[];
}

export const sosApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSos: builder.mutation<SosResponse, CreateSosRequest>({
      query: (body) => ({
        url: 'sos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sos', 'Notifications'],
    }),
    estimateDonors: builder.query<
      { data: { estimatedDonors: number } },
      { bloodTypeNeeded: string; city: string }
    >({
      query: (params) => ({
        url: 'sos/estimate',
        method: 'GET',
        params,
      }),
    }),
    getNearbySos: builder.query<
      SosListResponse,
      { city?: string | undefined; bloodType?: string | undefined; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: 'sos/nearby',
        method: 'GET',
        params,
      }),
      providesTags: ['Sos'],
    }),
    getMySos: builder.query<SosListResponse, void>({
      query: () => ({
        url: 'sos/mine',
        method: 'GET',
      }),
      providesTags: ['Sos'],
    }),
    getSosById: builder.query<SosResponse, { sosId: string }>({
      query: ({ sosId }) => ({
        url: `sos/${sosId}`,
        method: 'GET',
      }),
      providesTags: ['Sos'],
    }),
    getWaitlist: builder.query<WaitlistResponse, { sosId: string }>({
      query: ({ sosId }) => ({
        url: `sos/${sosId}/waitlist`,
        method: 'GET',
      }),
      providesTags: ['Sos'],
    }),
    getMyWaitlistEntry: builder.query<MyWaitlistEntryResponse, { sosId: string }>({
      query: ({ sosId }) => ({
        url: `sos/${sosId}/waitlist/me`,
        method: 'GET',
      }),
      providesTags: ['Sos'],
    }),
    joinWaitlist: builder.mutation<
      { data: unknown },
      { sosId: string; latitude?: number; longitude?: number }
    >({
      query: ({ sosId, ...body }) => ({
        url: `sos/${sosId}/waitlist`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sos', 'User'],
    }),
    cancelWaitlist: builder.mutation<{ success: boolean }, { sosId: string }>({
      query: ({ sosId }) => ({
        url: `sos/${sosId}/waitlist`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sos', 'User'],
    }),
    updateWaitlistStatus: builder.mutation<
      { data: unknown },
      { sosId: string; donorId: string; status: 'validated' | 'donated' }
    >({
      query: ({ sosId, donorId, status }) => ({
        url: `sos/${sosId}/waitlist/${donorId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Sos', 'Notifications'],
    }),
    closeSos: builder.mutation<{ data: unknown }, { sosId: string }>({
      query: ({ sosId }) => ({
        url: `sos/${sosId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sos', 'Notifications'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useCreateSosMutation,
  useEstimateDonorsQuery,
  useGetNearbySosQuery,
  useGetMySosQuery,
  useGetSosByIdQuery,
  useLazyGetSosByIdQuery,
  useGetWaitlistQuery,
  useGetMyWaitlistEntryQuery,
  useJoinWaitlistMutation,
  useCancelWaitlistMutation,
  useUpdateWaitlistStatusMutation,
  useCloseSosMutation,
} = sosApi;
