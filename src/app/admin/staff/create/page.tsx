'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users/create');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-background">
      <p>Redirecting...</p>
    </main>
  );
}
