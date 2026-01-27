'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PermissionDenied from '@/components/PermissionDenied';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    // This effect handles the redirection for logged-out users.
    // The check `user === null` is specific for when the auth state is resolved and we know the user is not logged in.
    if (user === null) {
      router.replace('/');
    }
  }, [user, router]);

  // While the user object is being determined (it's `undefined`), show a loading screen.
  if (user === undefined) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  // If the user is logged in and their role is 'admin', they are authorized.
  if (user && user.role === 'admin') {
    return <>{children}</>; // Render the requested admin page.
  }

  // If the user is `null` (logged out), this will be shown for a brief moment before the useEffect redirects.
  // If the user is logged in but has the wrong role (e.g., 'student'), this will be permanently shown.
  return <PermissionDenied userRole={user?.role} />;
}
