
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ListX, DollarSign, Filter, TrendingDown, Loader2 } from 'lucide-react';
import PermissionDenied from '@/components/PermissionDenied';
import { SkeletonListRow } from '@/components/Skeleton';
import { Skeleton } from '@/components/Skeleton';
import BackButton from '@/components/BackButton';
import { useTranslation } from '@/i18n';

interface FeeData {
  id: string;
  studentId: string;
  studentName: string;
  month: string;
  amount: number;
  discount: number;
  status: 'paid' | 'unpaid';
}

interface ClassData {
    name: string;
    studentIds: string[];
}

interface UnpaidFeeReportItem {
    fee: FeeData;
    className: string | null; // Allow null for loading state
    amountDue: number;
}

const getMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
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


export default function UnpaidFeesPage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('admin');
  const db = useFirestore();
  const { t } = useTranslation();

  const [reportItems, setReportItems] = useState<UnpaidFeeReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const monthOptions = useMemo(getMonthOptions, []);

  useEffect(() => {
    if (!isAuthorized || !db) {
        if(!isLoadingAuth) setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const fetchData = async () => {
        try {
            // 1. Fetch unpaid fees first and render them immediately
            const feesQuery = query(collection(db, 'fees'), where('status', '==', 'unpaid'));
            const feesSnap = await getDocs(feesQuery);
            const unpaidFees = feesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeData));

            const initialItems: UnpaidFeeReportItem[] = unpaidFees.map(fee => ({
                fee,
                className: null, // Set class name to null initially (loading state)
                amountDue: fee.amount - (fee.discount || 0)
            }));
            setReportItems(initialItems);
            setIsLoading(false);

            // 2. Asynchronously fetch class data and update the state
            const classesQuery = collection(db, 'classes');
            const classesSnap = await getDocs(classesQuery);
            
            const studentClassMap = new Map<string, string>();
            classesSnap.forEach(doc => {
                const classData = doc.data() as ClassData;
                classData.studentIds?.forEach(studentId => {
                    if (!studentClassMap.has(studentId)) {
                        studentClassMap.set(studentId, classData.name);
                    }
                });
            });

            // 3. Update report items with the fetched class names
            setReportItems(prevItems => prevItems.map(item => ({
                ...item,
                className: studentClassMap.get(item.fee.studentId) || 'N/A',
            })));

        } catch (error) {
            console.error("Failed to fetch unpaid fees report:", error);
            setIsLoading(false);
        }
    };
    
    fetchData();
  }, [isAuthorized, db]);
  
  const filteredItems = useMemo(() => {
    if (selectedMonth === 'all') {
      return reportItems.sort((a,b) => b.fee.month.localeCompare(a.fee.month));
    }
    return reportItems.filter(item => item.fee.month === selectedMonth);
  }, [reportItems, selectedMonth]);

  const totalUnpaid = useMemo(() => {
    return filteredItems.reduce((total, item) => total + item.amountDue, 0);
  }, [filteredItems]);


  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">{t('adminUnpaidFees.title')}</h1>
        
        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-xl">
                    <p className="text-sm text-destructive-foreground/80 flex items-center gap-2">
                        <TrendingDown size={16}/>
                        {t('adminUnpaidFees.totalUnpaid')}
                    </p>
                     {isLoading ? (
                        <Skeleton className="h-10 w-48 mt-2"/>
                     ) : (
                        <p className="text-4xl font-bold text-destructive mt-1">
                            ${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                     )}
                </div>
                <div>
                    <label htmlFor="month-filter" className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><Filter size={14}/> {t('adminUnpaidFees.filterByMonth')}</label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="all">{t('adminUnpaidFees.allMonths')}</option>
                        {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                  <div className="space-y-3">
                      <SkeletonListRow />
                      <SkeletonListRow />
                      <SkeletonListRow />
                  </div>
              ) : filteredItems.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="border-b border-muted/30">
                              <tr>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">{t('adminUnpaidFees.studentName')}</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">{t('adminUnpaidFees.class')}</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">{t('adminUnpaidFees.feeMonth')}</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground text-right">{t('adminUnpaidFees.feeAmount')}</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground text-right">{t('adminUnpaidFees.discount')}</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground text-right">{t('adminUnpaidFees.amountDue')}</th>
                              </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(({ fee, className, amountDue }) => (
                                <tr key={fee.id} className="border-b border-muted/20 hover:bg-muted/10">
                                    <td className="p-3 font-medium text-foreground/90">{fee.studentName}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {className === null ? (
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="w-4 h-4 animate-spin"/>
                                            </div>
                                        ) : className}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{fee.month}</td>
                                    <td className="p-3 text-right text-muted-foreground">${fee.amount.toFixed(2)}</td>
                                    <td className="p-3 text-right text-muted-foreground">${fee.discount.toFixed(2)}</td>
                                    <td className="p-3 text-right font-semibold text-destructive">
                                        <div className='flex items-center justify-end gap-1.5'>
                                          <DollarSign size={14} />
                                          {amountDue.toFixed(2)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <ListX className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-md font-semibold text-foreground">{t('adminUnpaidFees.noUnpaidFees')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedMonth === 'all' ? t('adminUnpaidFees.noOutstanding') : t('adminUnpaidFees.noUnpaidForMonth')}
                    </p>
                </div>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}
