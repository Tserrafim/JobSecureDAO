import { ClaimForm } from "@/components/claims/ClaimForm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ClaimSchema } from "@/lib/validation/schemas";
import { submitClaim } from "@/lib/contracts/core";
import { useToast } from "@/hooks/useToast";

export default function NewClaimPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (data: z.infer<typeof ClaimSchema>) => {
    try {
      const tx = await submitClaim(
        process.env.NEXT_PUBLIC_CORE_ADDRESS!,
        session!.user.walletAddress!
      );
      
      toast.success(
        "Claim submitted", 
        `Transaction: ${tx.hash}`
      );
      router.push("/claims");
    } catch (error) {
      toast.error("Submission failed", error.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit New Claim</h1>
      <ClaimForm onSubmit={handleSubmit} />
    </div>
  );
}