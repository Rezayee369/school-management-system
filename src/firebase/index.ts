'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';


function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore; } {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    return { app, auth, db };
}

export { 
    initializeFirebase,
    FirebaseProvider,
    FirebaseClientProvider,
    useUser,
    useFirebase,
    useFirebaseApp,
    useFirestore,
    useAuth,
};
