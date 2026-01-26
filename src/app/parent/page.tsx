'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useUser, useFirestore } from '@/firebase';
import { BookOpen, CheckCircle, XCircle, MinusCircle, Users, ClipboardCheck } from 'lucide-react';

// NOTE: The current data model does not explicitly link parents to students.
// The following interfaces and logic are placeholders for when that relationship is defined in Firestore.
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
}

interface GradeData {
  className: string;
  examScore: number;
  assignmentScore: number;
}


export default function ParentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('parent');
  const user = useUser();
  const db = useFirestore();

  const [linkedStudents, setLinkedStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isLoadingAuth || !isAuthorized || !user) {
        if (!isLoadingAuth && !isAuthorized) setIsLoadingData(false);
        return;
    };

    // --- Placeholder Logic ---
    // In a real application, you would fetch the parent's document,
    // get an array of linked student UIDs, and then fetch those students' data.
    // Since this link doesn't exist in the current schema, we'll simulate an empty state.
    console.log("Parent Dashboard: Fetching linked student data (placeholder). No link in Firestore schema.");
    setLinkedStudents([]);
    setIsLoadingData(false);
    
    // Example of what fetching logic might look like:
    /*
    const parentRef = doc(db, 'users', user.uid);
    const parentSnap = await getDoc(parentRef);
    if (parentSnap.exists() && parentSnap.data().studentIds) {
        const studentIds = parentSnap.data().studentIds;
        // fetch student docs, classes, attendance, grades...
    }
    */

  }, [isLoadingAuth, isAuthorized, user, db]);

  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<'present' | 'absent' | 'leave', number>);

  const getAverageColor = (avg: number) => {
    if (avg >= 90) return 'text-primary';
    if (avg >= 80) return 'text-green-400';
    if (avg >= 70) return 'text-yellow-400';
    if (avg >= 60) return 'text-orange-400';
    return 'text-red-400';
  }

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

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="parent" />

        {linkedStudents.length > 0 && selectedStudent ? (
           <>
             {/* This part of the UI would render if students were linked */}
             <h2 className="text-2xl font-semibold text-foreground mb-6">
                Showing data for: <span className="text-primary">{selectedStudent.name}</span>
             </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-green-500/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Days Present</p>
                            <p className="text-4xl font-bold text-foreground mt-2">{attendanceSummary.present ?? 0}</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>
                <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Days Absent</p>
                            <p className="text-4xl font-bold text-foreground mt-2">{attendanceSummary.absent ?? 0}</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-500" />
                        </div>
                    </div>
                </div>
                <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-500/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Days on Leave</p>
                            <p className="text-4xl font-bold text-foreground mt-2">{attendanceSummary.leave ?? 0}</p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 rounded-lg">
                            <MinusCircle className="w-6 h-6 text-yellow-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
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

                <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
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
            </div>
           </>
        ) : (
          <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl shadow-lg">
            <Users className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">Welcome, Parent!</h2>
            <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
              This is your dashboard where you will be able to see your child's classes and attendance records.
            </p>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary/90">
                    Currently, no students are linked to your account. An administrator will need to link your account to your child's profile.
                </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
