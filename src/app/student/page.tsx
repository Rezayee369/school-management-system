'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import PermissionDenied from '@/components/PermissionDenied';
import { Calendar } from '@/components/ui/calendar';

interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface AttendanceData {
  status: 'present' | 'absent' | 'leave';
  date: string; // YYYY-MM-DD
}

export default function StudentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('student');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (isLoadingAuth || !isAuthorized || !user) {
        if (!isLoadingAuth && !isAuthorized) setIsLoadingData(false);
        return;
    };

    // Fetch classes
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ClassData));
      setClasses(classesData);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching classes:", error);
      setIsLoadingData(false);
    });

    // Fetch attendance records for the student
    const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', user.uid));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => doc.data() as AttendanceData);
      setAttendance(attendanceData);
    });


    return () => {
      unsubscribeClasses();
      unsubscribeAttendance();
    };
  }, [isLoadingAuth, isAuthorized, user, db]);

  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<'present' | 'absent' | 'leave', number>);


  if (isLoadingAuth || isLoadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
        <div className="w-full max-w-7xl">
          <DashboardHeader userRole="student" />
          
          {/* Attendance Summary Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
          </div>

          {/* Schedule/Calendar Skeleton */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg flex justify-center items-center">
                <div className="w-full h-72 bg-muted/30 rounded-lg animate-pulse"></div>
            </div>
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <div className="h-6 w-40 bg-muted/40 rounded-md animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-16 bg-muted/30 rounded-lg animate-pulse"></div>
                  <div className="h-16 bg-muted/30 rounded-lg animate-pulse"></div>
                </div>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="student" />
        
        {/* Attendance Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {/* Present Card */}
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-green-500/30 transition-all duration-300 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days Present</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-green-400">{attendanceSummary.present ?? 0}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg transition-all duration-300 group-hover:bg-green-500/20 group-hover:shadow-[0_0_20px_#22c55e]">
                        <CheckCircle className="w-6 h-6 text-green-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
            
            {/* Absent Card */}
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/30 transition-all duration-300 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days Absent</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-red-400">{attendanceSummary.absent ?? 0}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg transition-all duration-300 group-hover:bg-red-500/20 group-hover:shadow-[0_0_20px_#ef4444]">
                        <XCircle className="w-6 h-6 text-red-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>

            {/* Leave Card */}
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-500/30 transition-all duration-300 hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days on Leave</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-yellow-400">{attendanceSummary.leave ?? 0}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg transition-all duration-300 group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_20px_#eab308]">
                        <MinusCircle className="w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
        </div>


        {/* Schedule/Calendar Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 p-4 sm:p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg flex justify-center items-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                />
            </div>

            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                    Today's Classes
                </h3>
                {classes.length > 0 ? (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                        {classes.map(c => (
                            <div key={c.id} className="p-3 bg-background/30 border border-muted/20 rounded-lg flex items-center gap-3 transition-all duration-300 hover:border-secondary/50 hover:bg-secondary/10">
                                <BookOpen className="w-5 h-5 text-secondary flex-shrink-0" />
                                <div>
                                    <p className="text-md text-foreground/90 font-semibold">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">Teacher: {c.teacherName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">You are not enrolled in any classes.</p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}
