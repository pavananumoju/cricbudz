"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, LogIn, LogOut, Trophy, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:rotate-12 transition-transform">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                IPL<span className="text-blue-500 font-black">FANTASY</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link href="/matches" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Matches</Link>
              <Link href="/leaderboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">Leaderboard</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  <LayoutDashboard size={18} />
                  DASHBOARD
                </Link>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Authenticated</p>
                    <p className="text-xs font-bold text-white leading-none">{user.displayName?.split(' ')[0]}</p>
                  </div>
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt="" 
                      className="w-10 h-10 rounded-xl border border-white/10"
                    />
                  )}
                  <button 
                    onClick={() => logout()}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl text-sm font-black hover:bg-gray-200 transition-all shadow-lg"
              >
                <LogIn size={18} />
                CONNECT GOOGLE
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0d0d0d] border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <Link href="/matches" className="block text-lg font-bold text-gray-400">MATCHES</Link>
              <Link href="/leaderboard" className="block text-lg font-bold text-gray-400">LEADERBOARD</Link>
              <div className="h-px bg-white/5" />
              {user ? (
                <>
                  <Link href="/dashboard" className="block text-lg font-bold text-gray-400">DASHBOARD</Link>
                  <button onClick={() => logout()} className="block text-lg font-bold text-red-500">LOGOUT</button>
                </>
              ) : (
                <button
                  onClick={() => loginWithGoogle()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold"
                >
                  <LogIn size={20} />
                  SIGN IN
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
