import React from 'react';
import { AlertTriangle, ShieldOff } from 'lucide-react';
import { Card } from './Card';

interface ErrorStateProps {
  permissionDenied?: boolean;
  onRetry: () => void;
  className?: string;
}

// Distinct from an empty-state Card (same shape, different color/copy) so a
// failed read never looks like a successful-but-empty one.
export function ErrorState({ permissionDenied, onRetry, className }: ErrorStateProps) {
  const Icon = permissionDenied ? ShieldOff : AlertTriangle;
  const title = permissionDenied ? "Can't Access This" : "Couldn't Load";
  const message = permissionDenied
    ? "You don't have access to this right now."
    : 'Something went wrong loading this. Check your connection and try again.';

  return (
    <Card className={`text-center py-16 border-dashed border-danger/30 ${className || ''}`}>
      <Icon className="w-10 h-10 text-danger/60 mx-auto mb-3" />
      <h3 className="text-base font-display font-black uppercase italic text-danger mb-1">{title}</h3>
      <p className="text-muted max-w-xs mx-auto text-xs leading-relaxed mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="bg-foreground text-background px-5 py-2 rounded-xl font-display font-black text-[10px] uppercase tracking-tight"
      >
        Try Again
      </button>
    </Card>
  );
}
