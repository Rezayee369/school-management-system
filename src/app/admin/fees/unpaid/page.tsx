'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { ArrowLeft, ListX, DollarSign, Filter } from 'lucide-react';
import PermissionDenied from '@/components/PermissionDenied';
import { SkeletonListRow } from '@/components/Skeleton';

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
    className: string;
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
  const router = useRouter();

  const [reportItems, setReportItems] = useState<UnpaidFeeReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // Default to current month YYYY-MM
  
  const monthOptions = useMemo(getMonthOptions, []);

  useEffect(() => {
    if (!isAuthorized || !db) {
        if(!isLoadingAuth) setIsLoading(false);
        return;
    }

    setIsLoading(true);

    const fetchData = async () => {
        try {
            const feesQuery = query(collection(db, 'fees'), where('status', '==', 'unpaid'));
            const classesQuery = collection(db, 'classes');
            
            const [feesSnap, classesSnap] = await Promise.all([
                getDocs(feesQuery),
                getDocs(classesQuery)
            ]);

            const unpaidFees = feesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeData));
            
            const studentClassMap = new Map<string, string>();
            classesSnap.forEach(doc => {
                const classData = doc.data() as ClassData;
                classData.studentIds?.forEach(studentId => {
                    // For simplicity, we'll just show the first class found for a student.
                    if (!studentClassMap.has(studentId)) {
                        studentClassMap.set(studentId, classData.name);
                    }
                });
            });

            const items: UnpaidFeeReportItem[] = unpaidFees.map(fee => ({
                fee,
                className: studentClassMap.get(fee.studentId) || 'N/A',
                amountDue: fee.amount - (fee.discount || 0)
            }));

            setReportItems(items);
        } catch (error) {
            console.error("Failed to fetch unpaid fees report:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchData();
  }, [isAuthorized, db]);
  
  const filteredItems = useMemo(() => {
    if (selectedMonth === 'all') {
      return reportItems.sort((a,b) => a.fee.month.localeCompare(b.fee.month));
    }
    return reportItems.filter(item => item.fee.month === selectedMonth);
  }, [reportItems, selectedMonth]);

  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-5xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Unpaid Fees</h1>
        
        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <label htmlFor="month-filter" className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2"><Filter size={14}/> Filter by Month</label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full appearance-none px-4 py-2.5 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <option value="all">All Months</option>
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
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">Student Name</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">Class</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">Fee Month</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Amount Due</th>
                              </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(({ fee, className, amountDue }) => (
                                <tr key={fee.id} className="border-b border-muted/20 hover:bg-muted/10">
                                    <td className="p-3 font-medium text-foreground/90">{fee.studentName}</td>
                                    <td className="p-3 text-muted-foreground">{className}</td>
                                    <td className="p-3 text-muted-foreground">{fee.month}</td>
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
                    <h3 className="mt-4 text-md font-semibold text-foreground">No Unpaid Fees Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedMonth === 'all' ? 'There are no outstanding fees.' : `No unpaid fees were found for the selected month.`}
                    </p>
                </div>
              )}
            </div>
        </div>
      </div>
    </main>
  );
}
