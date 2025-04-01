import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSignIn } from '@/lib/auth/hooks';
import { NeumorphicButton } from './common/NeumorphicButton';
import { WalletConnectButton } from './common/WalletConnectButton';

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters")
});

export function LoginForm() {
  const { signIn, isLoading, error } = useSignIn();
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(LoginSchema)
  });

  return (
    <div className="p-8 rounded-2xl neumorphic-container">
      <h2 className="mb-6 font-bold text-2xl">Welcome Back</h2>

      <form onSubmit={handleSubmit(signIn)} className="space-y-6">
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

        <NeumorphicButton 
          type="submit" 
          isLoading={isLoading}
          className="w-full"
        >
          Sign In
        </NeumorphicButton>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="border-neumorph-border border-t w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-neumorph-bg px-2 text-neumorph-text">
              OR CONNECT WALLET
            </span>
          </div>
        </div>

        <WalletConnectButton variant="outline" />
      </form>

      {error && (
        <div className="mt-4 text-red-500 text-center">
          {error.message}
        </div>
      )}
    </div>
  );
}