'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDoc, onSnapshot, query, where, documentId, getDocs } from 'firebase/firestore';
import { BookOpen, CheckCircle, XCircle, MinusCircle, Users, ClipboardCheck } from 'lucide-react';

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

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<StudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);

  // Effect to fetch the parent's linked students
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
    });

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  // Effect to fetch data for the selected student
  useEffect(() => {
    if (!selectedStudentId || !db) {
      setClasses([]);
      setAttendance([]);
      setGrades([]);
      return;
    }

    const unsubscribes: (() => void)[] = [];
    
    // Fetch classes
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', selectedStudentId));
    unsubscribes.push(onSnapshot(classesQuery, (snapshot) => {
        setClasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ClassData)));
    }));

    // Fetch attendance
    const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', selectedStudentId));
    unsubscribes.push(onSnapshot(attendanceQuery, (snapshot) => {
        setAttendance(snapshot.docs.map(d => d.data() as AttendanceData));
    }));

    // Fetch grades
    const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', selectedStudentId));
    unsubscribes.push(onSnapshot(gradesQuery, (snapshot) => {
        setGrades(snapshot.docs.map(d => d.data() as GradeData));
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedStudentId, db]);

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
                        className="w-full sm:w-auto px-4 py-2 appearance-none bg-background/50 text-foreground border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {linkedStudents.map(student => (
                            <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                    </select>
                )}
             </div>

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
              This is your dashboard where you will be able to see your child's classes, grades, and attendance records.
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
