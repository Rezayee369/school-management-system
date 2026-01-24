'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

interface AppUser extends User {
    role?: string;
}

export function useUser() {
    const auth = useAuth();
    const db = useFirestore();
    const [user, setUser] = useState<AppUser | null | undefined>(undefined); // undefined for loading, null for no user

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                // Set initial user data from auth
                setUser(firebaseUser);

                // Subscribe to user document for role updates
                const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const userData = doc.data();
                        setUser(prevUser => prevUser ? ({ ...prevUser, ...userData, role: userData.role }) : null);
                    } else {
                        // Document might not exist right after sign-up, wait for it to be created
                        // Or handle case where user exists in auth but not firestore
                        setUser(firebaseUser); // Keep basic auth user
                    }
                }, (error) => {
                    console.error("Error fetching user document:", error);
                    setUser(firebaseUser); // Fallback to auth user
                });
                
                return () => unsubscribeDoc();

            } else {
                setUser(null);
            }
        });

        return () => unsubscribeAuth();
    }, [auth, db]);

    return user;
}
