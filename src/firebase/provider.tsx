'use client';

import { createContext, useContext, ReactNode } from 'react';
import { type FirebaseApp } from 'firebase/app';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({
    children,
    value,
}: {
    children: ReactNode;
    value: FirebaseContextValue;
}) {
    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
}

export function useFirebase() {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}

export function useFirebaseApp() {
    return useFirebase().app;
}

export function useAuth() {
    return useFirebase().auth;
}

export function useFirestore() {
    return useFirebase().db;
}
