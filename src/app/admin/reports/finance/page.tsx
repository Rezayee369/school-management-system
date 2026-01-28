
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n';
import { Skeleton } from '@/components/Skeleton';
import BackButton from '@/components/BackButton';


const getMonthOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const monthNum = date.getMonth() + 1;
        const monthStr = String(monthNum).padStart(2, '0');
        const monthValue = `${year}-${monthStr}`;
        const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        options.push({ value: monthValue, label: monthLabel });
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

interface ReportData {
    totalExpected: number;
    totalCollected: number;
    totalUnpaid: number;
    feeCount: number;
}

export default function FinanceReportPage() {
    const db = useFirestore();
    const { t } = useTranslation();

    const monthOptions = useMemo(getMonthOptions, []);
    const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0].value);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db || !selectedMonth) return;

        const generateReport = async () => {
            setIsLoading(true);
            setReportData(null);
            try {
                const feesQuery = query(collection(db, "fees"), where("month", "==", selectedMonth));
                const snapshot = await getDocs(feesQuery);
                
                let totalExpected = 0;
                let totalCollected = 0;
                let totalUnpaid = 0;
                const feeCount = snapshot.size;

                snapshot.forEach(doc => {
                    const fee = doc.data();
                    const amount = fee.amount || 0;
                    const discount = fee.discount || 0;
                    const amountDue = amount - discount;

                    totalExpected += amount;
                    if (fee.status === 'paid') {
                        totalCollected += amountDue;
                    } else {
                        totalUnpaid += amountDue;
                    }
                });

                setReportData({ totalExpected, totalCollected, totalUnpaid, feeCount });

            } catch (error) {
                console.error("Failed to generate finance report:", error);
                toast.error(t('financeReport.loadError'));
            } finally {
                setIsLoading(false);
            }
        };

        generateReport();
    }, [db, selectedMonth, t]);

    const formatNumber = (amount: number) => {
        return new Intl.NumberFormat('en-US').format(amount);
    }

    const StatCard = ({ title, value, icon, color, isLoading }: { title: string, value: string, icon: React.ReactNode, color: string, isLoading: boolean }) => (
        <div className={`p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-opacity-30 ${color}`}>
             {isLoading ? (
                <div className="animate-pulse">
                    <Skeleton className="h-5 w-3/4 mb-3"/>
                    <Skeleton className="h-10 w-1/2"/>
                </div>
            ) : (
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-4xl font-bold text-foreground mt-2">{value}</p>
                    </div>
                    <div className={`p-3 bg-opacity-10 rounded-lg ${color.replace('border-', 'bg-')}`}>
                        {icon}
                    </div>
                </div>
            )}
        </div>
    );
    
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
            <div className="w-full max-w-5xl animate-fade-in-slide-up">
                <div className="flex justify-between items-center mb-8">
                    <BackButton />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-8">{t('financeReport.title')}</h1>

                <div className="mb-8 max-w-xs">
                    <label htmlFor="month-select" className="block text-sm font-medium text-muted-foreground mb-2">{t('financeReport.selectMonth')}</label>
                     <select
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard 
                        title={t('financeReport.totalExpected')} 
                        value={`${formatNumber(reportData?.totalExpected ?? 0)} افغانی`} 
                        icon={<Wallet className="w-6 h-6"/>} 
                        color="border-primary text-primary"
                        isLoading={isLoading}
                    />
                     <StatCard 
                        title={t('financeReport.totalCollected')}
                        value={`${formatNumber(reportData?.totalCollected ?? 0)} افغانی`} 
                        icon={<TrendingUp className="w-6 h-6"/>} 
                        color="border-green-400 text-green-400"
                        isLoading={isLoading}
                    />
                     <StatCard 
                        title={t('financeReport.totalUnpaid')}
                        value={`${formatNumber(reportData?.totalUnpaid ?? 0)} افغانی`} 
                        icon={<TrendingDown className="w-6 h-6"/>} 
                        color="border-destructive text-destructive"
                        isLoading={isLoading}
                    />
                </div>

                {!isLoading && reportData?.feeCount === 0 && (
                    <div className="mt-12 flex flex-col items-center justify-center h-48 text-center bg-background/60 border border-dashed border-muted rounded-xl">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-md font-semibold text-foreground">{t('financeReport.noDataTitle')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('financeReport.noDataDesc')}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
