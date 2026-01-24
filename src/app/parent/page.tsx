'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';

export default function ParentDashboard() {
  const { isLoading, isAuthorized, userRole } = useAuthGuard('parent');

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

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-background text-foreground">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="parent" />
        <div className="p-8 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg">
          <p className="text-lg text-foreground">Welcome to the parent dashboard. You have access.</p>
        </div>
      </div>
    </main>
  );
}
