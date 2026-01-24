'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { BookOpen, Users, ChevronRight } from 'lucide-react';

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
      <main className="flex min-h-screen flex-col items-center p-12 bg-background text-foreground">
        <div className="w-full max-w-4xl">
          <DashboardHeader userRole="teacher" />
          
          <div className="mt-12">
              <div className="h-8 w-48 bg-muted/50 rounded-md animate-pulse mb-6"></div>
              <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                  <div className="space-y-4">
                      <div className="h-20 bg-muted/30 rounded-lg animate-pulse"></div>
                      <div className="h-20 bg-muted/30 rounded-lg animate-pulse"></div>
                  </div>
              </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-background text-foreground">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="teacher" />
        
        <div className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">My Classes</h2>
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                {classes.length > 0 ? (
                    <div className="space-y-4">
                        {classes.map(c => (
                             <Link key={c.id} href={`/teacher/classes/${c.id}/attendance`} className="block group">
                                <div className="p-4 bg-background/30 border border-muted/20 rounded-lg flex justify-between items-center transition-all duration-300 group-hover:border-primary/50 group-hover:bg-primary/10">
                                    <div className="flex items-center gap-4">
                                        <BookOpen className="w-5 h-5 text-secondary" />
                                        <p className="text-lg text-foreground/90 font-semibold">{c.name}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="w-5 h-5" />
                                            <span>{c.studentIds?.length || 0} Students</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span>Mark Attendance</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
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
