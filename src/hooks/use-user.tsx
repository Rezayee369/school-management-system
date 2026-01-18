'use client';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuth, useFirestore } from '../provider';
import type { UserProfile } from '@/lib/types';

export function useUser() {
  const auth = useAuth();
  const firestore = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoadingUser(false);
      if (!authUser) {
        // If no user, no profile to load
        setUserProfile(null);
        setLoadingProfile(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user && firestore) {
      setLoadingProfile(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
        setLoadingProfile(false);
      }, () => {
        // on error
        setLoadingProfile(false);
      });
      return () => unsubscribe();
    } else {
      // This case is handled by the onAuthStateChanged effect
    }
  }, [user, firestore]);

  return { user, userProfile, loading: loadingUser || loadingProfile };
}
