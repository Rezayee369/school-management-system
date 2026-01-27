'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Calendar as CalendarIcon, ArrowLeft, Users } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import { SkeletonListRow } from '@/components/Skeleton';

interface ClassData {
  id: string;
  name: string;
}

interface AttendanceData {
  id: string;
  studentName: string;
  status: 'present' | 'absent' | 'leave';
}

export default function AdminAttendancePage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('admin');
  const db = useFirestore();
  const router = useRouter();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceData[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    setIsLoadingClasses(true);
    const classesQuery = query(collection(db, 'classes'), orderBy('name'));
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(classesData);
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      setIsLoadingClasses(false);
    }, (err) => {
        toast.error("Failed to load classes.");
        console.error(err);
        setIsLoadingClasses(false);
    });

    return () => unsubscribe();
  }, [isAuthorized, db]);

  useEffect(() => {
    if (!selectedClassId || !date || !db) {
        setAttendanceRecords([]);
        return;
    };

    setIsLoadingAttendance(true);
    const dateString = format(date, 'yyyy-MM-dd');
    
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', selectedClassId),
      where('date', '==', dateString)
    );
    
    const unsubscribe = onSnapshot(attendanceQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceData));
      setAttendanceRecords(records);
      setIsLoadingAttendance(false);
    }, (err) => {
        toast.error("Failed to load attendance records.");
        console.error(err);
        setIsLoadingAttendance(false);
    });

    return () => unsubscribe();
  }, [selectedClassId, date, db]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'absent': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'leave': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
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
      <div className="w-full max-w-5xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Attendance History</h1>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                  <label htmlFor="class-select" className="text-sm font-medium text-muted-foreground">Class</label>
                  <select
                      id="class-select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={isLoadingClasses || classes.length === 0}
                      className="mt-1 block w-full appearance-none px-4 py-2 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                      {isLoadingClasses ? (
                          <option>Loading classes...</option>
                      ) : classes.length > 0 ? (
                          classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      ) : (
                          <option>No classes found</option>
                      )}
                  </select>
              </div>
              <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              </div>
          </div>
          
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Records for {date ? format(date, "MMMM d, yyyy") : '...'}</h2>
            <div className="space-y-3">
              {isLoadingAttendance ? (
                  <div className="space-y-3">
                      <SkeletonListRow />
                      <SkeletonListRow />
                      <SkeletonListRow />
                  </div>
              ) : attendanceRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="border-b border-muted/30">
                              <tr>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground">Student Name</th>
                                  <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.map(record => (
                                <tr key={record.id} className="border-b border-muted/20 hover:bg-muted/10">
                                    <td className="p-3 font-medium text-foreground/90">{record.studentName}</td>
                                    <td className="p-3 text-right">
                                        <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusBadge(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Users className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-md font-semibold text-foreground">No Records Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">No attendance was marked for this class on the selected date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
