/**
 * useReferral — Hook for referral system API
 * Handles fetching referral code, stats, referrals list, and claiming
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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

// Server returns these shapes — normalize to hook interface
function normalizeStats(serverStats: {
  totalReferrals: number;
  pendingRewards: number;
  claimedRewards: number;
  totalCoinsEarned: number;
  referralCode: string | null;
} | null): ReferralStats | null {
  if (!serverStats) return null;
  return {
    totalReferrals: serverStats.totalReferrals,
    coinsEarned: serverStats.totalCoinsEarned,
    pendingRewards: serverStats.pendingRewards,
    referrals: [], // fetched separately
  };
}

export function useReferral(): UseReferralReturn {
  const { isAuthenticated } = useAuth();

  // Only fetch referral data when authenticated
  const codeQuery = trpc.referral.getCode.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const statsQuery = trpc.referral.getStats.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  const referralsQuery = trpc.referral.getReferrals.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });

  // Claim a referral code (when user enters a friend's code)
  // Server route is "claim" not "claimCode"
  const claimCodeMutation = trpc.referral.claim.useMutation();

  // Claim accumulated rewards
  const claimRewardsMutation = trpc.referral.claimRewards.useMutation();

  const claimReferralCode = useCallback(
    async (code: string): Promise<{ success: boolean; message: string; coins?: number }> => {
      try {
        const result = await claimCodeMutation.mutateAsync({ referralCode: code });
        // Refresh stats after claiming
        await statsQuery.refetch();
        await referralsQuery.refetch();
        return { success: result.success, message: "Referral code claimed!" };
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
        return {
          success: true,
          message: `Claimed ${result.totalClaimed} coins!`,
          coins: result.totalClaimed,
        };
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
    code: codeQuery.data?.code ?? null,
    stats: normalizeStats(statsQuery.data ?? null),
    referrals: (referralsQuery.data ?? []).map(ref => ({
      id: String(ref.id),
      username: ref.refereeName,
      referredAt: String(ref.createdAt),
      status: (ref.status === "signed_up" || ref.status === "earned_rewards") ? "completed" : "pending",
      milestones: [],
      coinsEarned: ref.rewardsEarned,
    })),
    pendingRewards: statsQuery.data?.pendingRewards ?? 0,
    loading: codeQuery.isLoading || statsQuery.isLoading || referralsQuery.isLoading,
    error: (codeQuery.error ?? statsQuery.error ?? referralsQuery.error) as Error | null,
    claimReferralCode,
    claimRewards,
    refetch,
  };
}