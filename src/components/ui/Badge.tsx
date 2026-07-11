import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'success' | 'danger' | 'warning' | 'primary' | 'mvp';

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-hover text-muted border border-border',
  success: 'bg-success-tint text-success border border-success/20',
  danger: 'bg-danger-tint text-danger border border-danger/20',
  warning: 'bg-warning-tint text-warning border border-warning/20',
  primary: 'bg-primary-tint text-primary border border-primary/20',
  mvp: 'bg-accent-tint text-accent border border-accent/30',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />}
      {children}
    </span>
  );
}
