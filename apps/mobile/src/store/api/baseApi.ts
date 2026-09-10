import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query/react';

import { Toast } from '../../components/ui/toastConfig';
import { env } from '../../config/env';
import type { RootState } from '../index';
import { clearCredentials, setCredentials } from '../slices/authSlice';

interface RefreshResponse {
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.EXPO_PUBLIC_API_URL.endsWith('/')
    ? env.EXPO_PUBLIC_API_URL
    : `${env.EXPO_PUBLIC_API_URL}/`,
  timeout: 30000, // 30 secondes pour permettre l'upload de photos sur réseau mobile
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
    // Intercepteur global : erreurs réseau et serveur pour les mutations
    if (result.error && typeof args !== 'string' && args.method && args.method !== 'GET') {
      const isBackgroundSync = typeof args.url === 'string' && args.url.includes('fcm-token');
      if (!isBackgroundSync) {
        if (result.error.status === 'FETCH_ERROR') {
          Toast.show({
            type: 'error',
            text1: 'Connexion impossible',
            text2: 'Vérifiez votre connexion internet et réessayez.',
          });
        } else if (typeof result.error.status === 'number' && result.error.status >= 500) {
          Toast.show({
            type: 'error',
            text1: 'Erreur serveur',
            text2: 'Le serveur a rencontré un problème. Réessayez plus tard.',
          });
        }
      }
    }
    return result;
  }

  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) {
    api.dispatch(clearCredentials());
    api.dispatch(baseApi.util.resetApiState());
    Toast.show({
      type: 'error',
      text1: 'Session expirée',
      text2: 'Veuillez vous reconnecter.',
    });
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = (async (): Promise<boolean> => {
      const refreshResult = await rawBaseQuery(
        {
          url: 'auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.error) {
        api.dispatch(clearCredentials());
        api.dispatch(baseApi.util.resetApiState());
        Toast.show({
          type: 'error',
          text1: 'Session expirée',
          text2: 'Votre session a expiré. Veuillez vous reconnecter.',
        });
        return false;
      }

      const body = refreshResult.data as RefreshResponse | undefined;
      if (!body?.data?.tokens?.accessToken || !body?.data?.tokens?.refreshToken) {
        api.dispatch(clearCredentials());
        api.dispatch(baseApi.util.resetApiState());
        return false;
      }

      api.dispatch(
        setCredentials({
          accessToken: body.data.tokens.accessToken,
          refreshToken: body.data.tokens.refreshToken,
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
