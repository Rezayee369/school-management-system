'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, Briefcase, Shield, Megaphone, BarChart2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { SkeletonCard } from '@/components/Skeleton';
import { useTranslation } from '@/i18n';

export default function AdminDashboard() {
  const db = useFirestore();
  const { t } = useTranslation();

  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [adminCount, setAdminCount] = useState<number | null>(null);

  useEffect(() => {
    if (!db) return;

    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const unsubscribeTeachers = onSnapshot(teachersQuery, (snapshot) => {
      setTeacherCount(snapshot.size);
    });

    const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
      setStudentCount(snapshot.size);
    });

    const classesQuery = collection(db, 'classes');
    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      setClassCount(snapshot.size);
    });

    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const unsubscribeAdmins = onSnapshot(adminsQuery, (snapshot) => {
      setAdminCount(snapshot.size);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeStudents();
      unsubscribeClasses();
      unsubscribeAdmins();
    };
  }, [db]);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 lg:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="admin" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teacherCount === null ? (
              <SkeletonCard />
            ) : (
              <Link href="/admin/users" className="block group">
                <div className="p-6 h-full bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('adminDashboard.totalTeachers')}</p>
                            <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-primary">{teacherCount}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_hsl(var(--primary))]">
                            <Briefcase className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    </div>
                </div>
              </Link>
            )}
            
            {studentCount === null ? (
              <SkeletonCard />
            ) : (
              <Link href="/admin/users" className="block group">
                <div className="p-6 h-full bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-secondary/30 transition-all duration-300 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{t('adminDashboard.totalStudents')}</p>
                            <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-secondary">{studentCount}</p>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_20px_hsl(var(--secondary))]">
                            <Users className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                        </div>
                    </div>
                </div>
              </Link>
            )}

            {classCount === null ? (
              <SkeletonCard />
            ) : (
              <Link href="/admin/classes" className="block group">
                  <div className="p-6 h-full bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-accent/30 transition-all duration-300 hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="flex items-start justify-between">
                          <div>
                              <p className="text-sm text-muted-foreground">{t('adminDashboard.totalClasses')}</p>
                              <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-accent">{classCount}</p>
                          </div>
                          <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_20px_hsl(var(--accent))]">
                              <BookOpen className="w-6 h-6 text-accent transition-transform duration-300 group-hover:scale-110" />
                          </div>
                      </div>
                  </div>
              </Link>
            )}
            
            {adminCount === null ? (
              <SkeletonCard />
            ) : (
              <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-destructive/30 transition-all duration-300 hover:border-destructive hover:shadow-xl hover:shadow-destructive/20 hover:-translate-y-1 hover:scale-[1.02]">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{t('adminDashboard.totalAdmins')}</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-destructive">{adminCount}</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg transition-all duration-300 group-hover:bg-destructive/20 group-hover:shadow-[0_0_20px_hsl(var(--destructive))]">
                        <Shield className="w-6 h-6 text-destructive transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
              </div>
            )}
        </div>

        <div className="mt-12">
             <h2 className="text-2xl font-semibold text-foreground mb-6">{t('adminDashboard.quickActions')}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/classes" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <BookOpen className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageClasses')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageClassesDesc')}</p>
                  </div>
                </Link>

                <Link href="/admin/users" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-secondary/30 hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                        <Users className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.manageUsers')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.manageUsersDesc')}</p>
                  </div>
                </Link>
                
                <div onClick={() => toast('Coming soon!')} className="group cursor-pointer">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-accent/30 hover:border-accent hover:shadow-xl hover:shadow-accent/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-accent/10 rounded-lg transition-all duration-300 group-hover:bg-accent/20 group-hover:shadow-[0_0_15px_hsl(var(--accent))]">
                        <Megaphone className="w-6 h-6 text-accent" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.announcements')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.announcementsDesc')}</p>
                  </div>
                </div>

                <Link href="/admin/reports" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
                        <BarChart2 className="w-6 h-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">{t('adminDashboard.analyticsAndReports')}</h2>
                    </div>
                    <p className="text-muted-foreground">{t('adminDashboard.analyticsAndReportsDesc')}</p>
                  </div>
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
