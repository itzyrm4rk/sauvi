import { useGetEligibilityQuery } from '../store/api/usersApi';

export function useEligibility() {
  const { data, isLoading, isError, error, refetch } = useGetEligibilityQuery();

  const eligibility = data?.data;

  return {
    isEligible: eligibility?.isEligible ?? false,
    nextEligibleDate: eligibility?.nextEligibleDate ?? null,
    daysRemaining: eligibility?.daysRemaining ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  };
}
