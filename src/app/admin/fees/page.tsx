'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, DollarSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';

interface Student {
  id: string;
  fullName: string;
}

const getMonthOptions = () => {
    const options = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        options.push(`${year}-${month}`);
        // Move to the previous month
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

export default function AdminFeesPage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('admin');
  const db = useFirestore();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [month, setMonth] = useState(getMonthOptions()[0]);
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [isSaving, setIsSaving] = useState(false);
  
  const monthOptions = getMonthOptions();

  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(studentsQuery);
        const studentsData = querySnapshot.docs.map(doc => ({ id: doc.id, fullName: doc.data().fullName } as Student));
        setStudents(studentsData);
        if (studentsData.length > 0) {
          setSelectedStudentId(studentsData[0].id);
        }
      } catch (error) {
        toast.error('Failed to load students.');
        console.error(error);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [isAuthorized, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !month || !amount) {
      toast.error('Student, month, and amount are required.');
      return;
    }
    
    const feeAmount = parseFloat(amount);
    if (isNaN(feeAmount) || feeAmount < 0) {
      toast.error('Please enter a valid, non-negative fee amount.');
      return;
    }

    setIsSaving(true);
    const feeId = `${selectedStudentId}_${month}`;
    const feeRef = doc(db, 'fees', feeId);

    try {
      const docSnap = await getDoc(feeRef);
      if (docSnap.exists()) {
        toast.error('A fee record for this student and month already exists.');
        setIsSaving(false);
        return;
      }

      const student = students.find(s => s.id === selectedStudentId);

      await setDoc(feeRef, {
        studentId: selectedStudentId,
        studentName: student?.fullName || 'N/A',
        month,
        amount: feeAmount,
        discount: parseFloat(discount) || 0,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Fee record saved successfully!');
      // Reset form
      setAmount('');
      setDiscount('');
      setStatus('unpaid');
      
    } catch (error) {
      toast.error('Failed to save fee record.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-2xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Manage Student Fees</h1>
        
        <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
          
          <div>
            <label htmlFor="student-select" className="block text-sm font-medium text-muted-foreground mb-2">Student</label>
            <select
              id="student-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={isLoadingStudents || students.length === 0}
              className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {isLoadingStudents ? (
                <option>Loading students...</option>
              ) : students.length > 0 ? (
                students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)
              ) : (
                <option>No students found</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="month-select" className="block text-sm font-medium text-muted-foreground mb-2">Month</label>
              <select
                id="month-select"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-muted-foreground mb-2">Fee Amount</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-muted-foreground mb-2">Discount (Optional)</label>
              <input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Payment Status</label>
              <div className="flex items-center justify-around h-[46px] p-1 bg-background/50 border border-input rounded-md">
                 <button type="button" onClick={() => setStatus('unpaid')} className={`w-1/2 py-1.5 text-sm font-semibold rounded ${status === 'unpaid' ? 'bg-destructive/80 text-white shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>Unpaid</button>
                 <button type="button" onClick={() => setStatus('paid')} className={`w-1/2 py-1.5 text-sm font-semibold rounded ${status === 'paid' ? 'bg-green-600 text-white shadow' : 'text-muted-foreground hover:bg-muted/30'}`}>Paid</button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving || students.length === 0}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
              <span>Save Fee Record</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
