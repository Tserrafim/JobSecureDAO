import { ClaimVerificationQueue } from '@/components/verification/Queue';
import { VerificationStats } from '@/components/verification/Stats';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useRequireVerifier } from '@/hooks/useRequireVerifier';

export default function VerificationPage() {
  const { isVerifier } = useRequireVerifier();

  if (!isVerifier) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center neumorphic-card">
          <h2 className="font-semibold text-xl">Verifier Access Required</h2>
          <p className="mt-2 text-neumorph-text-secondary">
            Only approved verifiers can access this dashboard
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-bold text-2xl">Claim Verification</h1>
          <VerificationStats />
        </div>

        <div className="p-6 neumorphic-card">
          <ClaimVerificationQueue />
          
        </div>
      </div>
    </DashboardLayout>
  );
}
;