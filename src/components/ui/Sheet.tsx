'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[90]"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[100] mx-auto max-w-md bg-surface rounded-t-[2rem] border-t border-border shadow-2xl max-h-[85vh] overflow-y-auto pb-safe touch-none',
              className
            )}
          >
            <div className="sticky top-0 bg-surface pt-3 pb-2 flex flex-col items-center rounded-t-[2rem] touch-none">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>
            {title && (
              <div className="px-6 pb-3 flex items-center justify-between">
                <h3 className="font-display font-black text-lg uppercase tracking-tight italic text-foreground">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-muted hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="px-6 pb-6 touch-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
