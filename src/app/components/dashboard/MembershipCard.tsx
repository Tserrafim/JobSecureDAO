import { useContractRead } from 'wagmi';
import { coreContractABI } from '@/lib/contracts/abis/core';
import { Skeleton } from './common/Skeleton';
import { Badge } from './common/Badge';

export function MembershipCard() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useContractRead({
    address: process.env.NEXT_PUBLIC_CORE_ADDRESS,
    abi: coreContractABI,
    functionName: 'members',
    args: [session?.user.walletAddress]
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (error) return <ErrorCard message="Failed to load membership data" />;

  return (
    <div className="p-6 neumorphic-card">
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-lg">Membership Status</h3>
        <Badge variant={data?.isActive ? 'success' : 'inactive'}>
          {data?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <div className="space-y-4 mt-6">
        <StatItem 
          label="Total Contributions" 
          value={`${formatEther(data?.totalContributions || 0)} JSDAO`}
        />
        <StatItem
          label="Last Contribution"
          value={data?.lastContributionTime ? 
            formatDate(data.lastContributionTime) : 'Never'
          }
        />
        <StatItem
          label="Benefit Multiplier"
          value={`${data?.benefitMultiplier || 0}%`}
        />
      </div>
    </div>
  );
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-neumorph-text-secondary">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);