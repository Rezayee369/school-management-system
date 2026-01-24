'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoading = useAuthGuard('admin');

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  return <>{children}</>;
}
