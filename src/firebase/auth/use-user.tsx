'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

interface AppUser extends User {
    role?: string;
}

export function useUser() {
    const auth = useAuth();
    const db = useFirestore();
    const [user, setUser] = useState<AppUser | null | undefined>(undefined); // undefined for loading

    useEffect(() => {
        let unsubscribeDoc: Unsubscribe | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // First, unsubscribe from any previous document listener
            if (unsubscribeDoc) {
                unsubscribeDoc();
            }

            if (firebaseUser) {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                
                // Subscribe to the user's document in Firestore
                unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        // User document exists, merge auth data with Firestore data
                        const userData = docSnap.data();
                        setUser({
                            ...firebaseUser,
                            ...userData,
                            role: userData.role,
                        });
                    } else {
                        // User is authenticated, but no document in Firestore.
                        // This could be a new sign-up or an error state.
                        console.warn(`No Firestore document found for user ${firebaseUser.uid}`);
                        setUser(firebaseUser); // User object without role, which useAuthGuard will handle
                    }
                }, (error) => {
                    console.error("Error fetching user document:", error);
                    // On error, still provide the basic auth user object so the app doesn't hang
                    setUser(firebaseUser);
                });
            } else {
                // User is not logged in
                setUser(null);
            }
        });

        // Cleanup function for the useEffect hook
        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) {
                unsubscribeDoc();
            }
        };
    }, [auth, db]);

    return user;
}
