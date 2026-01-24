'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export function useAuthGuard(allowedRole: string) {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // user is undefined when loading, null when not logged in, and an object when logged in.
    if (user === undefined) {
      return; // Still loading, wait for user state to resolve.
    }

    if (!user) {
      // Not logged in, redirect to login.
      router.replace('/login');
      setIsLoading(false);
      return;
    }

    // User is logged in, check role.
    if (user.role === allowedRole) {
      // Role matches, allow access.
      setIsLoading(false);
    } else {
      // Role mismatch, redirect.
      // Maybe redirect to their own dashboard or login? Login is safer.
      console.warn(`Role mismatch: user role is '${user.role}', required '${allowedRole}'. Redirecting to login.`);
      router.replace('/login');
      setIsLoading(false);
    }
  }, [user, allowedRole, router]);

  return isLoading;
}
