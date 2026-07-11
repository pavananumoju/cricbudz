'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20',
  secondary: 'bg-surface-hover text-foreground border border-border hover:bg-border/60',
  ghost: 'bg-transparent text-foreground hover:bg-surface-hover',
  destructive: 'bg-danger text-white hover:brightness-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[11px] gap-1.5',
  md: 'h-11 px-5 text-xs gap-2',
  lg: 'h-12 px-6 text-sm gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-2xl font-display font-black uppercase tracking-tight transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
