import { clearCredentials, setCredentials } from '../slices/authSlice';
import { baseApi } from './baseApi';

export interface LoginDto {
  email: string;
  password?: string;
  googleToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  data: {
    user: unknown;
    tokens: AuthTokens;
    profileComplete: boolean;
  };
  message?: string;
}

export interface RegisterStep1Dto {
  name: string;
  email: string;
  password?: string;
  googleToken?: string;
}

export interface RegisterStep2Dto {
  bloodType: string;
  gender: string;
  birthDate: string; // ISO date string
  city: string;
  phone: string;
  avatarUri?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  password: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginDto>({
      query: (body) => ({
        url: 'auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.tokens?.accessToken && data?.data?.tokens?.refreshToken) {
            dispatch(
              setCredentials({
                accessToken: data.data.tokens.accessToken,
                refreshToken: data.data.tokens.refreshToken,
              }),
            );
          }
        } catch {
          // Géré par les composants via isError
        }
      },
    }),

    registerStep1: builder.mutation<AuthResponse, RegisterStep1Dto>({
      query: (body) => ({
        url: 'auth/register/step1',
        method: 'POST',
        body,
      }),
    }),

    registerStep2: builder.mutation<unknown, RegisterStep2Dto & { token: string }>({
      query: ({ token, ...body }) => ({
        url: 'auth/register/step2',
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      }),
    }),

    forgotPassword: builder.mutation<{ data: { message: string } }, ForgotPasswordDto>({
      query: (body) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<{ data: { message: string } }, ResetPasswordDto>({
      query: (body) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        } catch {
          dispatch(clearCredentials()); // Déconnecter même en cas d'erreur réseau
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useLoginMutation,
  useRegisterStep1Mutation,
  useRegisterStep2Mutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
} = authApi;
