import { useContractRead, useContractWrite } from 'wagmi';
import { coreContractABI } from '@/lib/contracts/abis/core';
import { NeumorphicButton } from '../common/NeumorphicButton';
import { useSession } from 'next-auth/react';
import { ClaimStatusBadge } from './ClaimStatusBadge';
import { useToast } from '@/hooks/useToast';

export function ClaimPanel() {
  const { data: session } = useSession();
  const toast = useToast();
  
  const { data: claimData, refetch } = useContractRead({
    address: process.env.NEXT_PUBLIC_CORE_ADDRESS,
    abi: coreContractABI,
    functionName: 'members',
    args: [session?.user.walletAddress]
  });

  const { write: submitClaim, isLoading: isSubmitting } = useContractWrite({
    address: process.env.NEXT_PUBLIC_CORE_ADDRESS,
    abi: coreContractABI,
    functionName: 'submitClaim',
    onSuccess: () => {
      toast.success("Claim submitted");
      refetch();
    },
    onError: (error) => {
      toast.error("Claim failed", error.message);
    }
  });

  const { write: endClaim, isLoading: isEnding } = useContractWrite({
    address: process.env.NEXT_PUBLIC_CORE_ADDRESS,
    abi: coreContractABI,
    functionName: 'endClaim',
    onSuccess: () => {
      toast.success("Claim ended");
      refetch();
    }
  });

  return (
    <div className="p-6 neumorphic-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg">Unemployment Claim</h3>
        <ClaimStatusBadge status={claimData?.isUnemployed} />
      </div>

      {claimData?.isUnemployed ? (
        <div className="space-y-4">
          <div className="neumorphic-info-box">
            <p>Claim active since: {formatDate(claimData.claimStartTime)}</p>
            <p>Weeks claimed: {claimData.claimedWeeks?.toString()}</p>
          </div>
          
          <NeumorphicButton
            onClick={() => endClaim()}
            isLoading={isEnding}
            variant="outline"
            className="w-full"
          >
            End Claim Early
          </NeumorphicButton>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-neumorph-text-secondary">
            Submit a claim if you've become unemployed
          </p>
          
          <NeumorphicButton
            onClick={() => submitClaim()}
            isLoading={isSubmitting}
            className="w-full"
          >
            Submit Claim
          </NeumorphicButton>
        </div>
      )}
    </div>
  );
}