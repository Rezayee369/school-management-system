'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, type User } from 'firebase/auth';
import { useUser } from '@/firebase/auth/use-user';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { type UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const isAuthPage = pathname === '/login';

  // For protected routes, show a loader on both server and client
  // until authentication state and user profile are resolved.
  if (loading && !isAuthPage) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, handle redirects. Returning null is fine here as it's a transient state
  // before a redirect, which avoids rendering a page that will be immediately replaced.
  if ((!user && !isAuthPage) || (user && isAuthPage)) {
    return null;
  }

  // If loading is complete and no redirect is needed, render the provider and children.
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
