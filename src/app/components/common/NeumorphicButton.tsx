import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'flex justify-center items-center transition-all duration-200 neumorphic-button',
  {
    variants: {
      variant: {
        default: 'bg-neumorph-primary text-white shadow-neumorph-primary',
        outline: 'bg-transparent border border-neumorph-border shadow-neumorph-sm',
        ghost: 'bg-transparent hover:bg-neumorph-hover'
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8 text-lg'
      },
      rounded: {
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'md'
    }
  }
);

interface ButtonProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const NeumorphicButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, rounded, className })}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
        ) : null}
        {children}
      </button>
    );
  }
);

NeumorphicButton.displayName = 'Button';