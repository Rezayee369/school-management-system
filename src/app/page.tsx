'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export default function HomePage() {
  const router = useRouter();
  const user = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (user === undefined) {
      // Still loading
      return;
    }
    if (user === null) {
      router.replace('/login');
      return;
    }

    // User is logged in, handle role-based redirection
    const handleLogin = async () => {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'receptionist') {
        router.replace('/receptionist');
      } else if (user.role === 'doctor') {
        router.replace('/doctor');
      } else {
        // Fallback for users with no/invalid role
        router.replace('/login');
      }
    };

    handleLogin();
  }, [user, router, auth]);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-24 ${ptSans.variable} font-sans`}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">HealthQueue Pro</h1>
        <p className="mt-4 text-lg text-foreground">
          Loading your dashboard...
        </p>
      </div>
    </main>
  );
}
