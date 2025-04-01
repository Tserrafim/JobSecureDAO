import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { ContributionSchema } from '@/lib/validation/schemas';
import { NeumorphicButton } from '../common/NeumorphicButton';
import { TransactionStatus } from '../common/TransactionStatus';

export function ContributionPanel() {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(ContributionSchema)
  });

  const { 
    writeAsync: contribute, 
    isLoading: isPreparing 
  } = useContractWrite({
    address: process.env.NEXT_PUBLIC_CORE_ADDRESS,
    abi: coreContractABI,
    functionName: 'contribute',
    onError: (error) => {
      toast.error('Transaction failed', error.message);
    }
  });

  const { isLoading: isProcessing } = useWaitForTransaction({
    hash: txHash as `0x${string}`,
    onSuccess: () => {
      toast.success('Contribution successful!');
      reset();
    }
  });

  const onSubmit = async (data: z.infer<typeof ContributionSchema>) => {
    try {
      const tx = await contribute({ 
        args: [parseEther(data.amount.toString())],
        value: parseEther(data.amount.toString())
      });
      setTxHash(tx.hash);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 neumorphic-card">
      <h3 className="mb-4 font-medium text-lg">Make Contribution</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="neumorphic-input-group">
          <label>Amount (JSDAO)</label>
          <input
            {...register("amount")}
            type="number"
            step="0.01"
            className="neumorphic-input"
            placeholder="100.00"
            disabled={isPreparing || isProcessing}
          />
          {errors.amount && (
            <span className="error-text">{errors.amount.message}</span>
          )}
        </div>

        <NeumorphicButton
          type="submit"
          isLoading={isPreparing || isProcessing}
          disabled={!address}
          className="w-full"
        >
          {!address ? 'Connect Wallet' : 'Contribute'}
        </NeumorphicButton>
      </form>

      {txHash && (
        <TransactionStatus 
          hash={txHash} 
          className="mt-4"
        />
      )}
    </div>
  );
}
