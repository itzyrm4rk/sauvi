import { useSelector } from 'react-redux';

import type { RootState } from '../store';
import {
  type LoginDto,
  type RegisterStep1Dto,
  type RegisterStep2Dto,
  useLoginMutation,
  useLogoutMutation,
  useRegisterStep1Mutation,
  useRegisterStep2Mutation,
} from '../store/api/authApi';

export const useAuth = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const isAuthenticated = !!accessToken;

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [register1Mutation, { isLoading: isRegister1Loading }] = useRegisterStep1Mutation();
  const [register2Mutation, { isLoading: isRegister2Loading }] = useRegisterStep2Mutation();
  const [logoutMutation, { isLoading: isLogoutLoading }] = useLogoutMutation();

  const login = async (data: LoginDto) => {
    return await loginMutation(data).unwrap();
  };

  const registerStep1 = async (data: RegisterStep1Dto) => {
    return await register1Mutation(data).unwrap();
  };

  const registerStep2 = async (data: RegisterStep2Dto & { token: string }) => {
    return await register2Mutation(data).unwrap();
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.warn('Logout error', error);
    }
  };

  return {
    isAuthenticated,
    accessToken,
    login,
    registerStep1,
    registerStep2,
    logout,
    isLoading: isLoginLoading || isRegister1Loading || isRegister2Loading || isLogoutLoading,
    isLoginLoading,
    isRegister1Loading,
    isRegister2Loading,
    isLogoutLoading,
  };
};
