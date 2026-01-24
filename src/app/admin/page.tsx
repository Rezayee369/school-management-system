'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, Briefcase, CheckSquare, Megaphone, BarChart2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const isLoadingAuth = useAuthGuard('admin');
  const db = useFirestore();

  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);

  useEffect(() => {
    if (isLoadingAuth || !db) return;

    // Listener for teachers
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTeacherCount(snapshot.size);
    });

    // Listener for students
    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudentCount(snapshot.size);
    });

    // Listener for classes
    const classesQuery = collection(db, 'classes');
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      setClassCount(snapshot.size);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeStudents();
      unsubscribeClasses();
    };
  }, [isLoadingAuth, db]);

  if (isLoadingAuth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="admin" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Teachers Card */}
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Teachers</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-primary">{teacherCount ?? '—'}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--primary))]">
                        <Briefcase className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
            
            {/* Total Students Card */}
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-secondary/30 transition-all duration-300 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-secondary">{studentCount ?? '—'}</p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_20px_hsl(var(--secondary))]">
                        <Users className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>

            {/* Total Classes Card */}
            <Link href="/admin/classes" className="block group">
                <div className="p-6 h-full bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-accent/30 transition-all duration-300 hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Classes</p>
                            <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-accent">{classCount ?? '—'}</p>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_20px_hsl(var(--accent))]">
                            <BookOpen className="w-6 h-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    </div>
                </div>
            </Link>

            {/* Attendance Today Card */}
             <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-destructive/30 transition-all duration-300 hover:border-destructive hover:shadow-xl hover:shadow-destructive/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Attendance Today</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-destructive">0</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg transition-all duration-300 group-hover:bg-destructive/20 group-hover:shadow-[0_0_20px_hsl(var(--destructive))]">
                        <CheckSquare className="w-6 h-6 text-destructive transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12">
             <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Actions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/classes" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <BookOpen className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Manage Classes</h2>
                    </div>
                    <p className="text-muted-foreground">Add, edit, or view school classes and schedules.</p>
                  </div>
                </Link>

                <Link href="/admin/users" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-secondary/30 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                        <Users className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Manage Users</h2>
                    </div>
                    <p className="text-muted-foreground">Administer student, teacher, and parent accounts.</p>
                  </div>
                </Link>
                
                <Link href="#" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-accent/30 hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_15px_hsl(var(--accent))]">
                        <Megaphone className="w-6 h-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
                    </div>
                    <p className="text-muted-foreground">Create and send announcements to all users.</p>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <BarChart2 className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Analytics & Reports</h2>
                    </div>
                    <p className="text-muted-foreground">View school performance and user engagement data.</p>
                  </div>
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
