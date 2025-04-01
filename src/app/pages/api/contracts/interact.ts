import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/auth/session";
import { joinDAO } from "@/lib/contracts/core";
import { validateMethod } from "@/lib/api/utils";
import { ContributionSchema } from "@/lib/validation/schemas";
import { Log } from "@/lib/logger";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    validateMethod(req, "POST");
    
    const session = await getSession(req, res);
    if (!session?.siwe?.address) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const validated = ContributionSchema.parse(req.body);
    const tx = await joinDAO(
      process.env.CONTRACT_ADDRESS!,
      session.siwe.address,
      validated.amount.toString()
    );

    Log.info(`Transaction completed: ${tx.hash}`);
    res.status(200).json({ txHash: tx.hash });
    
  } catch (error) {
    Log.error("API Error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}