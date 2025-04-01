import { GovernanceProposals } from '@/components/governance/ProposalList';
import { ProposalCreationCard } from '@/components/governance/ProposalCreation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useContractRead } from 'wagmi';
import { governanceContractABI } from '@/lib/contracts/abis/governance';

export default function GovernancePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const { data: votingPower } = useContractRead({
    address: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
    abi: governanceContractABI,
    functionName: 'getVotes',
    args: [session?.user.walletAddress]
  });

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-2xl">DAO Governance</h1>
          <div className="neumorphic-badge">
            Voting Power: {formatUnits(votingPower || 0, 18)} JSDAO
          </div>
        </div>

        <ProposalCreationCard />

        <div className="p-6 neumorphic-card">
          <h2 className="mb-4 font-semibold text-xl">Active Proposals</h2>
          <GovernanceProposals />
        </div>
      </div>
    </DashboardLayout>
  );
}