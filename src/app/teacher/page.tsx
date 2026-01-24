'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { CalendarCheck, BookOpen, Users } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  studentIds?: string[];
}

export default function TeacherDashboard() {
  const isLoadingAuth = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  useEffect(() => {
    if (isLoadingAuth || !user) return;

    setIsLoadingClasses(true);
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassData));
      setClasses(classesData);
      setIsLoadingClasses(false);
    }, (error) => {
      console.error("Error fetching classes:", error);
      setIsLoadingClasses(false);
    });

    return () => unsubscribe();
  }, [isLoadingAuth, user, db]);

  if (isLoadingAuth || isLoadingClasses) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background text-foreground">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="teacher" />
        
        <div className="mt-8">
             <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Actions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/teacher/attendance" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 border border-primary/30 hover:border-primary">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <CalendarCheck className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Mark Attendance</h2>
                    </div>
                    <p className="text-muted-foreground">Mark daily attendance for your assigned classes.</p>
                  </div>
                </Link>
            </div>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">My Classes</h2>
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                {classes.length > 0 ? (
                    <div className="space-y-4">
                        {classes.map(c => (
                            <div key={c.id} className="p-4 bg-background/30 border border-muted/20 rounded-lg flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <BookOpen className="w-5 h-5 text-secondary" />
                                    <p className="text-lg text-foreground/90 font-semibold">{c.name}</p>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-5 h-5" />
                                    <span>{c.studentIds?.length || 0} Students</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">You are not assigned to any classes yet.</p>
                )}
            </div>
        </div>

      </div>
    </main>
  );
}
