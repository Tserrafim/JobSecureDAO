import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSignUp } from '@/lib/auth/mutations';
import { NeumorphicButton } from '../common/NeumorphicButton';
import { WalletConnectButton } from '../common/WalletConnectButton';
import { useAccount } from 'wagmi';

const SignupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
  confirmPassword: z.string(),
  walletAddress: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export function SignupForm() {
  const { address } = useAccount();
  const { signUp, isLoading, error } = useSignUp();
  const { register, handleSubmit, setValue, formState } = useForm({
    resolver: zodResolver(SignupSchema)
  });

  useEffect(() => {
    if (address) {
      setValue("walletAddress", address);
    }
  }, [address, setValue]);

  return (
    <div className="mx-auto p-8 rounded-2xl max-w-md neumorphic-container">
      <h2 className="mb-6 font-bold text-2xl">Create Account</h2>
      
      <form onSubmit={handleSubmit(signUp)} className="space-y-4">
        <div className="neumorphic-input-group">
          <label>Email</label>
          <input
            {...register("email")}
            type="email"
            className="neumorphic-input"
            disabled={isLoading}
          />
          {formState.errors.email && (
            <span className="error-text">{formState.errors.email.message}</span>
          )}
        </div>

        <div className="neumorphic-input-group">
          <label>Password</label>
          <input
            {...register("password")}
            type="password"
            className="neumorphic-input"
            disabled={isLoading}
          />
          {formState.errors.password && (
            <span className="error-text">{formState.errors.password.message}</span>
          )}
        </div>

        <div className="neumorphic-input-group">
          <label>Confirm Password</label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="neumorphic-input"
            disabled={isLoading}
          />
          {formState.errors.confirmPassword && (
            <span className="error-text">{formState.errors.confirmPassword.message}</span>
          )}
        </div>

        <div className="py-2">
          <WalletConnectButton 
            variant="outline" 
            className="w-full"
          />
          {address && (
            <div className="mt-2 text-neumorph-text-secondary text-sm">
              Connected: {truncateAddress(address)}
            </div>
          )}
        </div>

        <NeumorphicButton 
          type="submit" 
          isLoading={isLoading}
          disabled={!address}
          className="mt-4 w-full"
        >
          Create Account
        </NeumorphicButton>
      </form>

      {error && (
        <div className="mt-4 text-center text-red-500">
          {error.message}
        </div>
      )}
    </div>
  );
}