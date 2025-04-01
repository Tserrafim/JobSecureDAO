import { TreasuryMetrics } from '@/components/treasury/Metrics';
import { FundAllocationChart } from '@/components/treasury/AllocationChart';
import { InvestmentPanel } from '@/components/treasury/InvestmentPanel';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function TreasuryPage() {
  const { isAdmin } = useRequireAdmin();

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center neumorphic-card">
          <h2 className="font-semibold text-xl">Access Denied</h2>
          <p className="mt-2 text-neumorph-text-secondary">
            Only DAO administrators can access treasury management
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-bold text-2xl">Treasury Management</h1>
        
        <TreasuryMetrics />
        
        <div className="gap-6 grid md:grid-cols-2">
          <div className="p-6 neumorphic-card">
            <h2 className="mb-4 font-semibold text-xl">Fund Allocation</h2>
            <FundAllocationChart />
          </div>
          
          <div className="p-6 neumorphic-card">
            <InvestmentPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}