'use client';

import { useAuth, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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
    const handleLogin = () => {
      switch (user.role) {
        case 'admin':
          router.replace('/admin');
          break;
        case 'teacher':
          router.replace('/teacher');
          break;
        case 'student':
          router.replace('/student');
          break;
        case 'parent':
          router.replace('/parent');
          break;
        default:
          // For staff or any other unhandled roles, redirect to login
          // as they do not have a dedicated dashboard.
          router.replace('/login');
          break;
      }
    };

    handleLogin();
  }, [user, router, auth]);

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center p-24 font-sans`}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">Salamkar School</h1>
        <p className="mt-4 text-lg text-foreground">
          Loading your dashboard...
        </p>
      </div>
    </main>
  );
}
