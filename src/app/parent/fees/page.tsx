
'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import PermissionDenied from '@/components/PermissionDenied';
import BackButton from '@/components/BackButton';
import { CreditCard, History } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ParentFeesPage() {
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

  const FeeHistoryItemPlaceholder = ({ month, status }: { month: string, status: 'paid' | 'unpaid' }) => (
      <div className="p-4 bg-background/50 border border-muted/20 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <p className="text-lg text-foreground/90 font-semibold">{t('parentDashboard.fee')} - {month}</p>
            <p className="text-sm text-muted-foreground">Placeholder Amount: 5000 AFN</p>
        </div>
        <div className={`px-3 py-1 text-sm font-bold uppercase rounded-full border ${status === 'paid' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-destructive/20 text-destructive border-destructive/50'}`}>
            {status === 'paid' ? t('parentDashboard.fee_status_paid') : t('parentDashboard.fee_status_unpaid')}
        </div>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
        <div className="w-full max-w-4xl animate-fade-in-slide-up">
            <div className="flex justify-between items-center mb-8">
                <BackButton />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-8">{t('parentDashboard.feeHistory')}</h1>
            
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <History className="w-7 h-7 text-secondary" />
                    <h2 className="text-2xl font-semibold text-foreground">Fee Records</h2>
                </div>
                
                <div className="space-y-4">
                    {/* This is placeholder data. Logic to fetch real data will be added later. */}
                    <FeeHistoryItemPlaceholder month="January 2024" status="paid" />
                    <FeeHistoryItemPlaceholder month="February 2024" status="paid" />
                    <FeeHistoryItemPlaceholder month="March 2024" status="unpaid" />
                    
                    <div className="text-center py-8 text-muted-foreground">
                        <CreditCard className="mx-auto h-12 w-12" />
                        <p className="mt-4">{t('parentDashboard.noFeeHistory')}</p>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
}
