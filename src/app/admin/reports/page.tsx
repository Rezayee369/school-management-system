'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { TrendingUp, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

// Data interfaces
interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface StudentData {
  id:string;
  fullName: string;
  email: string;
  role: string;
}

interface AttendanceData {
  classId: string;
  studentId: string;
  status: 'present' | 'absent' | 'leave';
}

// Report interfaces
interface ClassReport extends ClassData {
    totalMarked: number;
    attendancePercentage: string;
}

interface HighAbsenceReport {
    studentId: string;
    studentName: string;
    studentEmail: string;
    absenceCount: number;
}

const HIGH_ABSENCE_THRESHOLD = 3; // Let's set a threshold

export default function AdminReportsPage() {
    const db = useFirestore();

    const [classReport, setClassReport] = useState<ClassReport[]>([]);
    const [highAbsenceReport, setHighAbsenceReport] = useState<HighAbsenceReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateReports = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                // Fetch all necessary data in parallel
                const [classSnap, userSnap, attendanceSnap] = await Promise.all([
                    getDocs(collection(db, "classes")),
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "attendance")),
                ]);

                const classes = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
                const users = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData));
                const students = users.filter(u => u.role === 'student');
                const attendance = attendanceSnap.docs.map(doc => doc.data() as AttendanceData);
                
                // --- Process Class Attendance Report ---
                const attendanceByClass = attendance.reduce((acc, record) => {
                    if (!acc[record.classId]) {
                        acc[record.classId] = { total: 0, present: 0 };
                    }
                    acc[record.classId].total++;
                    if (record.status === 'present') {
                        acc[record.classId].present++;
                    }
                    return acc;
                }, {} as Record<string, { total: number; present: number }>);
                
                const finalClassReport = classes.map(c => {
                    const stats = attendanceByClass[c.id] || { total: 0, present: 0 };
                    const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
                    return {
                        ...c,
                        totalMarked: stats.total,
                        attendancePercentage: percentage.toFixed(1),
                    };
                }).sort((a,b) => parseFloat(a.attendancePercentage) - parseFloat(b.attendancePercentage));
                setClassReport(finalClassReport);

                // --- Process High Absence Report ---
                const absencesByStudent = attendance.reduce((acc, record) => {
                    if (record.status === 'absent') {
                        acc[record.studentId] = (acc[record.studentId] || 0) + 1;
                    }
                    return acc;
                }, {} as Record<string, number>);

                const finalHighAbsenceReport = Object.entries(absencesByStudent)
                    .filter(([_, count]) => count >= HIGH_ABSENCE_THRESHOLD)
                    .map(([studentId, absenceCount]) => {
                        const studentInfo = students.find(s => s.id === studentId);
                        return {
                            studentId,
                            absenceCount,
                            studentName: studentInfo?.fullName || 'Unknown Student',
                            studentEmail: studentInfo?.email || 'N/A',
                        };
                    })
                    .sort((a, b) => b.absenceCount - a.absenceCount);
                setHighAbsenceReport(finalHighAbsenceReport);

            } catch (error) {
                console.error("Failed to generate reports:", error);
                toast.error("Could not load report data. Please check permissions.");
            } finally {
                setIsLoading(false);
            }
        };

        generateReports();
    }, [db]);

    const SkeletonReportTable = ({rows = 3, cols = 4}: {rows?: number, cols?: number}) => (
        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg animate-pulse">
            <div className="h-8 w-1/2 bg-muted/40 rounded-md mb-6"></div>
            <div className="space-y-3">
                {/* Table Header */}
                <div className="grid gap-4" style={{gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`}}>
                   {[...Array(cols)].map((_, i) => <div key={i} className="h-4 bg-muted/40 rounded"></div>)}
                </div>
                {/* Table Body */}
                {[...Array(rows)].map((_, i) => (
                    <div key={i} className="grid gap-4 p-3 bg-background/50 rounded-lg" style={{gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`}}>
                        {[...Array(cols)].map((_, j) => <div key={j} className="h-5 bg-muted/40 rounded"></div>)}
                    </div>
                ))}
            </div>
        </div>
    );
    
    if (isLoading) {
        return (
             <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
                <div className="w-full max-w-7xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="h-6 w-40 bg-muted/40 rounded-md animate-pulse"></div>
                    </div>
                    <div className="h-10 w-72 bg-muted/40 rounded-md animate-pulse mb-12"></div>
                    <div className="flex flex-col gap-12">
                        <SkeletonReportTable cols={4} rows={3}/>
                        <SkeletonReportTable cols={3} rows={2}/>
                    </div>
                </div>
            </main>
        );
    }
    
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
            <div className="w-full max-w-7xl animate-fade-in-slide-up">
                <div className="flex justify-between items-center mb-8">
                    <BackButton />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-12">Analytics & Reports</h1>

                <div className="flex flex-col gap-12">
                    {/* Class Attendance Report */}
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="w-7 h-7 text-primary" />
                            <h2 className="text-2xl font-semibold text-foreground">Class Attendance Report</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-muted/30">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground">Class Name</th>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground">Teacher</th>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground text-center">Total Marked Days</th>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Attendance %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classReport.length > 0 ? classReport.map(c => (
                                        <tr key={c.id} className="border-b border-muted/20 hover:bg-muted/10 transition-colors">
                                            <td className="p-3 font-medium text-foreground/90">{c.name}</td>
                                            <td className="p-3 text-muted-foreground">{c.teacherName}</td>
                                            <td className="p-3 text-muted-foreground text-center">{c.totalMarked}</td>
                                            <td className={`p-3 text-right font-bold ${parseFloat(c.attendancePercentage) < 80 ? 'text-red-400' : 'text-green-400'}`}>{c.attendancePercentage}%</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center text-muted-foreground py-8">No attendance data available to generate this report.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* High Absence Report */}
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-destructive/30 rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <UserX className="w-7 h-7 text-destructive" />
                            <h2 className="text-2xl font-semibold text-foreground">Students with High Absences (&ge;{HIGH_ABSENCE_THRESHOLD})</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-muted/30">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground">Student Name</th>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground">Email</th>
                                        <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Number of Absences</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {highAbsenceReport.length > 0 ? highAbsenceReport.map(s => (
                                        <tr key={s.studentId} className="border-b border-muted/20 hover:bg-muted/10 transition-colors">
                                            <td className="p-3 font-medium text-foreground/90">{s.studentName}</td>
                                            <td className="p-3 text-muted-foreground">{s.studentEmail}</td>
                                            <td className="p-3 text-right font-bold text-destructive">{s.absenceCount}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="text-center text-muted-foreground py-8">No students meet the high absence criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
