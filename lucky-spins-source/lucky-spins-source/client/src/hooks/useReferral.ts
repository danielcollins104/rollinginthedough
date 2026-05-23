/**
 * useReferral — Hook for referral system API
 * Handles fetching referral code, stats, referrals list, and claiming
 */

import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export interface ReferralStats {
  totalReferrals: number;
  coinsEarned: number;
  pendingRewards: number;
  referrals: ReferralRef[];
}

export interface ReferralRef {
  id: string;
  username: string;
  referredAt: string;
  status: "pending" | "completed";
  milestones: ReferralMilestone[];
  coinsEarned: number;
}

export interface ReferralMilestone {
  id: string;
  description: string;
  reward: number;
  rewardType: "coins" | "cashback";
  status: "pending" | "earned";
}

interface UseReferralReturn {
  code: string | null;
  stats: ReferralStats | null;
  referrals: ReferralRef[];
  pendingRewards: number;
  loading: boolean;
  error: Error | null;
  claimReferralCode: (code: string) => Promise<{ success: boolean; message: string; coins?: number }>;
  claimRewards: () => Promise<{ success: boolean; message: string; coins?: number }>;
  refetch: () => void;
}

export function useReferral(): UseReferralReturn {
  // Fetch referral code
  const codeQuery = trpc.referral.getCode.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch referral stats
  const statsQuery = trpc.referral.getStats.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch referrals list
  const referralsQuery = trpc.referral.getReferrals.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Claim a referral code (when user enters a friend's code)
  const claimCodeMutation = trpc.referral.claimCode.useMutation();

  // Claim accumulated rewards
  const claimRewardsMutation = trpc.referral.claimRewards.useMutation();

  const claimReferralCode = useCallback(
    async (code: string): Promise<{ success: boolean; message: string; coins?: number }> => {
      try {
        const result = await claimCodeMutation.mutateAsync({ code });
        // Refresh stats after claiming
        await statsQuery.refetch();
        await referralsQuery.refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to claim referral code";
        return { success: false, message };
      }
    },
    [claimCodeMutation, statsQuery, referralsQuery]
  );

  const claimRewards = useCallback(
    async (): Promise<{ success: boolean; message: string; coins?: number }> => {
      try {
        const result = await claimRewardsMutation.mutateAsync();
        // Refresh stats after claiming
        await statsQuery.refetch();
        await referralsQuery.refetch();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to claim rewards";
        return { success: false, message };
      }
    },
    [claimRewardsMutation, statsQuery, referralsQuery]
  );

  const refetch = useCallback(() => {
    codeQuery.refetch();
    statsQuery.refetch();
    referralsQuery.refetch();
  }, [codeQuery, statsQuery, referralsQuery]);

  return {
    code: codeQuery.data ?? null,
    stats: statsQuery.data ?? null,
    referrals: referralsQuery.data ?? [],
    pendingRewards: statsQuery.data?.pendingRewards ?? 0,
    loading: codeQuery.isLoading || statsQuery.isLoading || referralsQuery.isLoading,
    error: codeQuery.error ?? statsQuery.error ?? referralsQuery.error ?? null,
    claimReferralCode,
    claimRewards,
    refetch,
  };
}