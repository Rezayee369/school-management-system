
'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useTranslation } from '@/i18n';
import { HardHat } from 'lucide-react';

export default function StaffDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('staff');
  const { t } = useTranslation();

  if (isLoadingAuth) {
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
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-transparent text-foreground">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="staff" />
        <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-secondary/30 rounded-xl shadow-lg">
            <HardHat className="mx-auto h-16 w-16 text-secondary" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">Staff Dashboard</h2>
            <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
                Welcome to the staff dashboard. Your tools and information will be available here.
            </p>
        </div>
      </div>
    </main>
  );
}
