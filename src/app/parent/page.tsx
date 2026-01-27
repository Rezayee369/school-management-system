'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, onSnapshot, query, where, documentId, getDocs, orderBy } from 'firebase/firestore';
import { BookOpen, Users, ClipboardCheck, Percent, CalendarDays, Wallet, CalendarClock } from 'lucide-react';
import { format, parse } from 'date-fns';

interface StudentData {
  id: string;
  name: string;
}

interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface AttendanceData {
  status: 'present' | 'absent' | 'leave';
  date: string; // YYYY-MM-DD
}

interface GradeData {
  className: string;
  examScore: number;
  assignmentScore: number;
}

interface FeeData {
    id: string;
    month: string;
    status: 'paid' | 'unpaid';
    amount: number;
    discount?: number;
}

// Generate month options for the filter dropdown
const getMonthOptions = () => {
    const options = [];
    let date = new Date();
    for (let i = 0; i < 12; i++) {
        const value = format(date, 'yyyy-MM');
        const label = format(date, 'MMMM yyyy');
        options.push({ value, label });
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

export default function ParentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('parent');
  const user = useUser();
  const db = useFirestore();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<StudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Data for the selected student
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceData[]>([]);
  const [allFees, setAllFees] = useState<FeeData[]>([]);

  // State for attendance history filtering
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const monthOptions = useMemo(getMonthOptions, []);

  // Fetch parent's linked students
  useEffect(() => {
    if (!isAuthorized || !user || !db) {
        if (!isLoadingAuth) setIsLoadingData(false);
        return;
    }

    setIsLoadingData(true);
    const parentRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(parentRef, async (snap) => {
        if (snap.exists()) {
            const studentIds = snap.data()?.studentIds || [];
            if (studentIds.length > 0) {
                const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
                const studentSnaps = await getDocs(studentsQuery);
                const studentsData = studentSnaps.docs.map(d => ({ id: d.id, name: d.data().fullName as string }));
                setLinkedStudents(studentsData);
                if (!selectedStudentId || !studentIds.includes(selectedStudentId)) {
                    setSelectedStudentId(studentsData[0]?.id || null);
                }
            } else {
                setLinkedStudents([]);
                setSelectedStudentId(null);
            }
        }
        setIsLoadingData(false);
    }, () => setIsLoadingData(false));

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  // Fetch data for the selected student
  useEffect(() => {
    if (!selectedStudentId || !db) {
      setClasses([]); setGrades([]); setAllAttendance([]); setAllFees([]);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    
    // Classes
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', selectedStudentId));
    unsubscribes.push(onSnapshot(classesQuery, snap => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassData)))));

    // Grades
    const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', selectedStudentId));
    unsubscribes.push(onSnapshot(gradesQuery, snap => setGrades(snap.docs.map(d => d.data() as GradeData))));

    // Attendance (all records)
    const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', selectedStudentId));
    unsubscribes.push(onSnapshot(attendanceQuery, (snapshot) => {
        const records = snapshot.docs.map(d => d.data() as AttendanceData).sort((a,b) => b.date.localeCompare(a.date));
        setAllAttendance(records);
    }));

    // Fetch all fees for the student
    const feesQuery = query(collection(db, 'fees'), where('studentId', '==', selectedStudentId), orderBy('month', 'desc'));
    unsubscribes.push(onSnapshot(feesQuery, snap => {
        const feeData = snap.docs.map(d => ({id: d.id, ...d.data()}) as FeeData);
        setAllFees(feeData);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedStudentId, db]);
  
  const feeStatus = useMemo(() => {
    const currentMonthForFee = format(new Date(), 'yyyy-MM');
    return allFees.find(fee => fee.month === currentMonthForFee) || null;
  }, [allFees]);
  
  const feeHistory = allFees;

  // Derived state for summary cards and history list
  const { attendanceToday, monthlyAttendance, filteredAttendanceHistory } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const monthStartStr = format(new Date(), 'yyyy-MM');
    
    const todayRecord = allAttendance.find(a => a.date === todayStr) || null;
    const monthlyRecords = allAttendance.filter(a => a.date.startsWith(monthStartStr));
    const presentCount = monthlyRecords.filter(a => a.status === 'present').length;
    
    const historyRecords = allAttendance.filter(a => a.date.startsWith(selectedMonth));

    return {
        attendanceToday: todayRecord,
        monthlyAttendance: { present: presentCount, total: monthlyRecords.length },
        filteredAttendanceHistory: historyRecords,
    }
  }, [allAttendance, selectedMonth]);
  
  const monthlyAttendancePercentage = useMemo(() => {
    if(monthlyAttendance.total === 0) return null;
    return (monthlyAttendance.present / monthlyAttendance.total) * 100;
  }, [monthlyAttendance]);
  
  const getAverageColor = (avg: number) => {
    if (avg >= 90) return 'text-primary'; if (avg >= 80) return 'text-green-400';
    if (avg >= 70) return 'text-yellow-400'; if (avg >= 60) return 'text-orange-400';
    return 'text-red-400';
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'absent': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'leave': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };
  
  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId);

  if (isLoadingAuth || isLoadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  const StatCard = ({ title, value, icon, subtext }: { title: string; value: string; icon: React.ReactNode, subtext?: string }) => (
    <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-2">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-secondary/10 rounded-lg">{icon}</div>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="parent" />

        {linkedStudents.length > 0 && selectedStudent ? (
           <>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-semibold text-foreground">
                    Showing data for: <span className="text-primary">{selectedStudent.name}</span>
                </h2>
                {linkedStudents.length > 1 && (
                    <select
                        value={selectedStudentId ?? ''}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 appearance-none bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {linkedStudents.map(student => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                    </select>
                )}
             </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              <StatCard 
                title="Attendance Today"
                value={attendanceToday ? attendanceToday.status.charAt(0).toUpperCase() + attendanceToday.status.slice(1) : 'N/A'}
                subtext={attendanceToday ? format(new Date(), 'MMMM d, yyyy') : 'Not yet marked'}
                icon={<CalendarDays className={`w-6 h-6 ${attendanceToday?.status === 'present' ? 'text-green-400' : attendanceToday?.status === 'absent' ? 'text-red-400' : 'text-yellow-400'}`} />}
              />
              <StatCard 
                title="Monthly Attendance"
                value={monthlyAttendancePercentage !== null ? `${monthlyAttendancePercentage.toFixed(0)}%` : 'N/A'}
                subtext={monthlyAttendance.total > 0 ? `${monthlyAttendance.present} / ${monthlyAttendance.total} days` : 'No records this month'}
                icon={<Percent className="w-6 h-6 text-secondary" />}
              />
              <StatCard 
                title="Current Month's Fee"
                value={feeStatus ? feeStatus.status.charAt(0).toUpperCase() + feeStatus.status.slice(1) : 'N/A'}
                subtext={feeStatus?.status === 'unpaid' ? `Due: $${(feeStatus.amount - (feeStatus.discount || 0)).toFixed(2)}` : (feeStatus ? 'Cleared' : 'No fees posted')}
                icon={<Wallet className={`w-6 h-6 ${feeStatus?.status === 'paid' ? 'text-green-400' : feeStatus?.status === 'unpaid' ? 'text-red-400' : 'text-muted-foreground' }`} />}
              />
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="grid grid-cols-1 gap-8 content-start">
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <ClipboardCheck className="w-6 h-6 text-secondary"/>
                            <h3 className="text-xl font-semibold text-foreground">Grades</h3>
                        </div>
                        <div className="space-y-2">
                            {grades.length > 0 ? grades.map((grade, i) => {
                                 const avg = (grade.examScore + grade.assignmentScore) / 2;
                                return (
                                    <div key={i} className="grid grid-cols-4 items-center p-3 bg-background/30 border-b border-muted/20">
                                        <p className="col-span-2 font-medium">{grade.className}</p>
                                        <p className="text-center text-muted-foreground">{grade.examScore}</p>
                                        <p className={`text-right font-bold ${getAverageColor(avg)}`}>{avg.toFixed(1)}%</p>
                                    </div>
                                )
                            }) : (
                                 <p className="text-muted-foreground text-center py-4">No grades posted.</p>
                            )}
                        </div>
                    </div>
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Wallet className="w-6 h-6 text-secondary"/>
                            <h3 className="text-xl font-semibold text-foreground">Fee History</h3>
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {feeHistory.length > 0 ? feeHistory.map((fee) => {
                                const amountDue = fee.amount - (fee.discount || 0);
                                return (
                                    <div key={fee.id} className="grid grid-cols-3 items-center p-3 bg-background/30 border-b border-muted/20">
                                        <div>
                                            <p className="font-medium text-foreground/90">{format(parse(fee.month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</p>
                                            <p className="text-xs text-muted-foreground">Due: ${amountDue.toFixed(2)}</p>
                                        </div>
                                        <div className="text-center text-muted-foreground">
                                            <p className="text-xs">Fee: ${fee.amount.toFixed(2)}</p>
                                            {fee.discount && fee.discount > 0 ? <p className="text-xs">Disc: ${fee.discount.toFixed(2)}</p> : null}
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                                                fee.status === 'paid' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                            }`}>
                                                {fee.status}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <p className="text-muted-foreground text-center py-4">No fee history found.</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-8 content-start">
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Enrolled Classes</h3>
                        {classes.length > 0 ? (
                            <div className="space-y-4">
                                {classes.map(c => (
                                    <div key={c.id} className="p-3 bg-background/30 border border-muted/20 rounded-lg flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-secondary flex-shrink-0" />
                                        <div>
                                            <p className="text-md text-foreground/90 font-semibold">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">Teacher: {c.teacherName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">Student not enrolled in any classes.</p>
                        )}
                    </div>
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <div className="flex justify-between items-center gap-3 mb-4">
                            <div className='flex items-center gap-3'>
                                <CalendarClock className="w-6 h-6 text-secondary"/>
                                <h3 className="text-xl font-semibold text-foreground">Attendance History</h3>
                            </div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="text-sm px-2 py-1 appearance-none bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredAttendanceHistory.length > 0 ? filteredAttendanceHistory.map((record, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-background/30 border-b border-muted/20">
                                    <p className="font-medium text-foreground/90">{format(parse(record.date, 'yyyy-MM-dd', new Date()), 'MMMM dd, yyyy')}</p>
                                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusBadge(record.status)}`}>
                                        {record.status}
                                    </span>
                                </div>
                            )) : (
                                 <p className="text-muted-foreground text-center py-4">No attendance records for this month.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
           </>
        ) : (
          <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl shadow-lg">
            <Users className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">Welcome, Parent!</h2>
            <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
              This is your dashboard where you can see your child's classes, grades, and attendance records.
            </p>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary/90">
                    Currently, no students are linked to your account. An administrator must link your account to your child's profile before you can view their data.
                </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
