'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, type User } from 'firebase/auth';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { type UserProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthLoadingScreen() {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <p className="text-lg text-muted-foreground">Loading HealthQueue Pro...</p>
        </div>
      </div>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useUser();
  const auth = useFirebaseAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user && isAuthPage) {
      router.push('/');
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const value = { user, userProfile, loading, logout };

  if (loading) {
    return <AuthLoadingScreen />;
  }

  const isAuthPage = pathname === '/login';
  if (!loading && !user && !isAuthPage) {
    return <AuthLoadingScreen />;
  }
  if (!loading && user && isAuthPage) {
    return <AuthLoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
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
