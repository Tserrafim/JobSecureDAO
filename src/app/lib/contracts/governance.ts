import { JobSecureGovernance__factory } from "@/types/contracts";
import { getProvider } from "./wallet";
import { BigNumber } from "ethers";

export const fetchGovernanceParams = async (contractAddress: string) => {
  const contract = JobSecureGovernance__factory.connect(
    contractAddress, 
    getProvider()
  );

  return {
    baseBenefitRate: await contract.baseBenefitRate(),
    minContribution: await contract.minimumContribution(),
    maxWeeklyBenefit: await contract.maxWeeklyBenefit(),
    votingThreshold: await contract.claimVerificationThreshold()
  };
};

export const submitProposal = async (
  contractAddress: string,
  proposalData: {
    target: string;
    value: BigNumber;
    calldata: string;
    description: string;
  }
) => {
  // Implementation with gas estimation and error handling
};