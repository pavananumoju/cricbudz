'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Trophy, Zap, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const { user, loading, login: handleLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) router.push('/dashboard');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-sans">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <nav className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-5 pt-safe pt-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center -rotate-3 shadow-lg shadow-primary/20">
            <Trophy className="text-primary-foreground" size={18} />
          </div>
          <span className="font-display font-black text-lg uppercase tracking-tighter italic">CricBudz</span>
        </div>
      </nav>

      <main className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-5 pt-14 pb-16 relative">
        <div className="text-center space-y-6 lg:max-w-xl lg:mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-tint border border-primary/20 text-primary font-mono text-[10px] uppercase tracking-widest font-black"
          >
            <Zap size={12} className="fill-current" />
            Season 2026 Live
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-5xl sm:text-6xl font-display font-black uppercase tracking-tighter italic leading-[0.9]"
          >
            The Ultimate <br />
            <span className="text-primary">Fantasy Arena</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="text-base text-muted font-medium leading-relaxed max-w-sm mx-auto"
          >
            Draft your 3-player trio, tag your MVP, and battle your friends for the top of the table.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-4"
          >
            <Button size="lg" onClick={handleLogin} className="w-full">
              Continue with Google
              <ChevronRight size={18} />
            </Button>
          </motion.div>
        </div>

        <div className="grid gap-3 mt-16 sm:grid-cols-3 lg:gap-4">
          {[
            { icon: Zap, label: 'Live Sync', desc: 'Fixtures and rosters pulled straight from the live IPL schedule.' },
            { icon: Shield, label: 'Secure Draft', desc: 'Your picks are tied to your account and locked before toss.' },
            { icon: Trophy, label: 'Friend Rankings', desc: 'Climb the table and settle the group chat arguments.' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="p-5 rounded-3xl bg-surface border border-border shadow-sm flex items-center gap-4 sm:flex-col sm:items-start"
            >
              <div className="w-11 h-11 rounded-2xl bg-primary-tint flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm uppercase tracking-tight italic">{feature.label}</h3>
                <p className="text-muted text-xs font-medium leading-relaxed mt-0.5">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-5 py-10 border-t border-border mt-6 flex items-center justify-center gap-2 text-muted opacity-60">
        <Trophy size={14} />
        <span className="font-display font-black text-xs uppercase tracking-widest">CricBudz &copy; 2026</span>
      </footer>
    </div>
  );
}
