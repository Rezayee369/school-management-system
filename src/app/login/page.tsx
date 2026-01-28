'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-transparent">
      <p>Redirecting...</p>
    </main>
  );
}
