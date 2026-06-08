import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import { env } from '../../config/env';
import type { RootState } from '../index';
import { clearCredentials, setCredentials } from '../slices/authSlice';

interface RefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

let refreshPromise: Promise<boolean> | null = null;

/**
 * RTK Query base avec intercepteur de refresh token (rotation JWT).
 */
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) {
    api.dispatch(clearCredentials());
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = (async (): Promise<boolean> => {
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.error) {
        api.dispatch(clearCredentials());
        return false;
      }

      const body = refreshResult.data as RefreshResponse | undefined;
      if (!body?.data?.accessToken || !body?.data?.refreshToken) {
        api.dispatch(clearCredentials());
        return false;
      }

      api.dispatch(
        setCredentials({
          accessToken: body.data.accessToken,
          refreshToken: body.data.refreshToken,
        }),
      );
      return true;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;
  if (!refreshed) {
    return result;
  }

  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Sos', 'Notifications', 'Chat'],
  endpoints: () => ({}),
});

export type ApiError = FetchBaseQueryError & {
  data?: ApiErrorBody;
};
