'use client';

import { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Trophy, Zap, Shield, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) router.push('/dashboard');
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white selection:bg-blue-500 selection:text-white overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <nav className="container mx-auto px-6 py-8 flex justify-between items-center relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center rotate-3 border-2 border-white/20">
            <Trophy className="text-white w-6 h-6" />
          </div>
          <span className="font-display font-black text-2xl uppercase tracking-tighter italic">Arena</span>
        </div>
        <button 
          onClick={handleLogin}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all"
        >
          Enter Stadium
        </button>
      </nav>

      <main className="container mx-auto px-6 pt-20 pb-32 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] uppercase tracking-widest font-black"
          >
            <Zap size={12} className="fill-current" />
            2025 Prediction Engine Live
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-7xl md:text-9xl font-display font-black uppercase tracking-tighter italic leading-[0.8] mix-blend-difference"
          >
            The Ultimate <br />
            <span className="text-blue-500">Fantasy Arena</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-gray-400 font-medium leading-tight max-w-2xl mx-auto"
          >
            Draft your squad. Sync with live match data. Dominate the leaderboard in the most intense cricket simulation.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="pt-8"
          >
            <button 
              onClick={handleLogin}
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] blur opacity-75 group-hover:opacity-100 transition duration-500" />
              <div className="relative px-12 py-6 bg-white text-black rounded-[28px] font-display font-black text-2xl uppercase tracking-tight flex items-center gap-4 group-hover:scale-[0.98] transition-all">
                Start Drafting
                <ChevronRight size={28} className="translate-x-0 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-40">
          {[
            { icon: Zap, label: "Live Sync", desc: "Real-time squad updates connected to major series." },
            { icon: Shield, label: "Secure Draft", desc: "Your squad is protected by edge-level identity logic." },
            { icon: Trophy, label: "Arena Rank", desc: "Climb the rankings and become the ultimate strategist." }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-8 rounded-[40px] bg-white/2 border border-white/5 hover:bg-white/5 transition-all group scale-100 active:scale-95"
            >
              <feature.icon className="w-8 h-8 text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-2 italic">{feature.label}</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-6 py-20 border-t border-white/5 mt-20 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2 opacity-50">
          <Trophy size={16} />
          <span className="font-display font-black text-sm uppercase tracking-widest">Arena &copy; 2025</span>
        </div>
        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-[0.2em] font-black text-gray-500">
          <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-500 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}
