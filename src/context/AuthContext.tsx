'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';

const POPUP_FALLBACK_CODES = new Set([
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
]);
const POPUP_CANCELLED_CODES = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]);

function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not yet authorized for sign-in. Contact the app admin.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error during sign-in. Check your connection and try again.';
  }
  return 'Sign-in failed. Please try again.';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error('Google sign-in redirect failed:', error);
      toast.error(getAuthErrorMessage(error));
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const tokenResult = await user.getIdTokenResult();
        setIsAdmin(tokenResult.claims.admin === true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Popup avoids signInWithRedirect's cross-origin storage handoff through
      // the Firebase authDomain, which mobile Safari/Chrome frequently block
      // (third-party storage partitioning) — that failure is silent, with no
      // error and no signed-in user, which is worse than a blocked popup.
      await signInWithPopup(auth, provider);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (POPUP_CANCELLED_CODES.has(code ?? '')) return;
      if (POPUP_FALLBACK_CODES.has(code ?? '')) {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError) {
          console.error('Google sign-in redirect fallback failed:', redirectError);
          toast.error(getAuthErrorMessage(redirectError));
        }
        return;
      }
      console.error('Google sign-in failed:', error);
      toast.error(getAuthErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login: loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
