'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

interface AuthGuardResult {
  isLoading: boolean;
  isAuthorized: boolean;
  userRole: string | undefined;
}

export function useAuthGuard(allowedRole: string): AuthGuardResult {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // user is undefined when loading, null when not logged in, and an object when logged in.
    if (user === undefined) {
      setIsLoading(true);
      return; // Still loading, wait for user state to resolve.
    }

    if (!user) {
      // Not logged in, redirect to login.
      router.replace('/');
      // The component will unmount, so no need to update state.
      return;
    }

    // User is logged in, check role.
    if (user.role === allowedRole) {
      // Role matches, allow access.
      setIsAuthorized(true);
    } else {
      // Role mismatch, not authorized.
      console.warn(`Role mismatch: user role is '${user.role}', required '${allowedRole}'.`);
      setIsAuthorized(false);
    }
    // In either case of a logged-in user, loading is complete.
    setIsLoading(false);
  }, [user, allowedRole, router]);

  return { isLoading, isAuthorized, userRole: user?.role };
}
