import type { ChatMessage } from '../../hooks/useChat';
import { baseApi } from './baseApi';

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<
      { data: ChatMessage[] },
      { sosId: string; contactId: string; cursor?: string }
    >({
      query: ({ sosId, contactId, cursor }) => {
        const params: Record<string, string> = { contactId };
        if (cursor) params.cursor = cursor;
        return {
          url: `sos/${sosId}/messages`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['Chat'],
    }),
    sendMessageRest: builder.mutation<
      { data: ChatMessage },
      { sosId: string; contactId: string; content: string }
    >({
      query: ({ sosId, contactId, content }) => ({
        url: `sos/${sosId}/messages`,
        method: 'POST',
        body: { content, contactId },
      }),
    }),
    markAsRead: builder.mutation<{ success: boolean }, { sosId: string; contactId: string }>({
      query: ({ sosId, contactId }) => ({
        url: `sos/${sosId}/messages/read`,
        method: 'PATCH',
        body: { contactId },
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useGetMessagesQuery, useSendMessageRestMutation, useMarkAsReadMutation } = chatApi;
