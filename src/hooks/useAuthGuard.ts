'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export function useAuthGuard(allowedRole: string) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.replace('/login');
        // A redirect is in progress, but we set loading to false to prevent a stuck screen.
        setIsLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === allowedRole) {
          // User is authorized, show the page content.
          setIsLoading(false);
        } else {
          // Role mismatch or no user document, redirect.
          router.replace('/login');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        router.replace('/login');
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [allowedRole, router]);

  return isLoading;
}
