'use client';
import { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '.';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
    const firebase = useMemo(() => initializeFirebase(), []);
    return <FirebaseProvider value={firebase}>{children}</FirebaseProvider>;
}
