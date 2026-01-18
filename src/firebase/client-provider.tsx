'use client';

import { FirebaseProvider } from './provider';

// This provider is used to ensure that Firebase is only initialized on the client side.
// It wraps the FirebaseProvider and should be used at the root of your application.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
