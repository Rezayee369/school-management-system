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
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === allowedRole) {
            setIsLoading(false);
          } else {
            // Role mismatch, redirect
            router.replace('/login');
          }
        } else {
          // No user document found, redirect
          console.error('No user document found in Firestore for UID:', user.uid);
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        router.replace('/login');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [allowedRole, router]);

  return isLoading;
}
