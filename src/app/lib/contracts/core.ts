import { JobSecureCore__factory } from "@/lib/validation/schema";
import { getProvider, getSigner } from "./wallets";
import { validateAddress } from "@/lib/validation/schemas";
import { Log } from "@/lib/logger";

export const coreContract = (address: string) => {
  validateAddress(address);
  return JobSecureCore__factory.connect(address, getProvider());
};

export const joinDAO = async (
  contractAddress: string,
  userAddress: string,
  contributionAmount: string
) => {
  try {
    const signer = await getSigner();
    const contract = JobSecureCore__factory.connect(contractAddress, signer);
    
    Log.info(`Joining DAO: ${userAddress} contributing ${contributionAmount}`);
    const tx = await contract.joinDAO(contributionAmount, { gasLimit: 1_000_000 });
    
    await tx.wait(2); // Wait for 2 confirmations
    return tx;
  } catch (error) {
    Log.error("JoinDAO failed:", error);
    throw new Error(formatContractError(error));
  }
};
