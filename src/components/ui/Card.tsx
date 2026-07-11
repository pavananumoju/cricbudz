import React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-3xl bg-surface border border-border shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
