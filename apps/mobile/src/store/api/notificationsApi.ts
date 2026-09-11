import { baseApi } from './baseApi';

export type NotificationType =
  | 'sos_share'
  | 'sos_match'
  | 'sos_expired'
  | 'donor_joined'
  | 'donor_cancelled'
  | 'donor_validated'
  | 'donation_confirmed'
  | 'eligibility_restored'
  | 'chat_message';

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  shareUrl: string | null;
  sosId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  data: InAppNotification[];
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsListResponse, void>({
      query: () => ({ url: 'notifications', method: 'GET' }),
      providesTags: ['Notifications'],
      keepUnusedDataFor: 0,
    }),

    markAllNotificationsRead: builder.mutation<{ data: { count: number } }, void>({
      query: () => ({ url: 'notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),

    markNotificationRead: builder.mutation<{ data: { id: string } }, string>({
      query: (id) => ({ url: `notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationsApi;
