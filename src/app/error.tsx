'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      <AlertTriangle className="w-12 h-12 text-danger/60 mb-4" />
      <h3 className="text-lg font-display font-black uppercase italic text-danger mb-2">Something Broke</h3>
      <p className="text-muted max-w-xs mx-auto text-sm leading-relaxed mb-6">
        This page hit an unexpected error. Try again, or head back and pick a different screen.
      </p>
      <button
        onClick={reset}
        className="bg-foreground text-background px-5 py-2.5 rounded-xl font-display font-black text-[10px] uppercase tracking-tight"
      >
        Try Again
      </button>
    </div>
  );
}
