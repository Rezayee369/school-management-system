'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import PermissionDenied from '@/components/PermissionDenied';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthorized, userRole } = useAuthGuard('admin');

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return <>{children}</>;
}
