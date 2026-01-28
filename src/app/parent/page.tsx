
'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { Users } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ParentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('parent');
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
        <DashboardHeader userRole="parent" />
        
        <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl shadow-lg">
            <Users className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">{t('parentDashboard.welcome')}</h2>
            <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
              {t('parentDashboard.welcomeDesc')}
            </p>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary/90">
                    {t('parentDashboard.noStudentLinked')}
                </p>
            </div>
          </div>
      </div>
    </main>
  );
}
