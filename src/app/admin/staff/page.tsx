
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n';

export default function RedirectPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace('/admin/users?role=staff');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-background">
      <p>Redirecting...</p>
    </main>
  );
}
