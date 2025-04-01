import { z } from "zod";
import { validateEthAddress } from "./web3";

export const AddressSchema = z.string().refine(
  validateEthAddress,
  "Invalid Ethereum address"
);

export const ContributionSchema = z.object({
  amount: z.number()
    .positive("Amount must be positive")
    .min(100, "Minimum contribution is 100 JSDAO")
    .max(100000, "Maximum contribution exceeded"),
  memo: z.string().max(140).optional()
}).strict();

export const ClaimSchema = z.object({
  unemploymentDate: z.date().max(new Date()),
  lastEmployer: z.string().min(2),
  proofHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
});