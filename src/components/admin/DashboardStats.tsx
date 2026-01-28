'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFirebaseApp } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Users, BookOpen, HardHat } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Stat {
  title: string;
  count: number;
  icon: React.ReactNode;
  link: string;
}

const StatCard = ({ stat }: { stat: Stat }) => (
  <Link href={stat.link} className="group">
    <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-border transition-all duration-300 hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{stat.title}</p>
          <p className="text-4xl font-bold text-foreground mt-2 transition-colors duration-300 group-hover:text-primary">{stat.count}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary))]">
          {stat.icon}
        </div>
      </div>
    </div>
  </Link>
);


const StatCardSkeleton = () => (
    <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-border animate-pulse">
        <div className="flex items-start justify-between">
            <div>
                <div className="h-4 w-24 bg-muted/50 rounded"></div>
                <div className="h-10 w-16 mt-2 bg-muted/50 rounded"></div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
                <div className="w-6 h-6 bg-muted/50 rounded-full"></div>
            </div>
        </div>
    </div>
);


export default function DashboardStats() {
  const app = useFirebaseApp();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!app) return;

    const fetchStats = async () => {
      try {
        const functions = getFunctions(app);
        const getDashboardStats = httpsCallable(functions, 'getDashboardStats');
        const result = await getDashboardStats();
        
        const data = result.data as {
            studentsCount: number;
            teachersCount: number;
            staffCount: number;
            classesCount: number;
        };

        const fetchedStats: Stat[] = [
          { title: t('adminDashboard.totalStudents'), count: data.studentsCount, icon: <Users className="w-6 h-6 text-primary" />, link: '/admin/users?role=student' },
          { title: t('adminDashboard.totalTeachers'), count: data.teachersCount, icon: <Users className="w-6 h-6 text-primary" />, link: '/admin/users?role=teacher' },
          { title: t('adminDashboard.totalStaff'), count: data.staffCount, icon: <HardHat className="w-6 h-6 text-primary" />, link: '/admin/users?role=staff' },
          { title: t('adminDashboard.totalClasses'), count: data.classesCount, icon: <BookOpen className="w-6 h-6 text-primary" />, link: '/admin/classes' },
        ];
        
        setStats(fetchedStats);
      } catch (error) {
        console.error("Error fetching dashboard stats via Cloud Function:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [app, t]);

  if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
        </div>
      );
  }

  if (stats.length === 0 && !isLoading) {
      return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </div>
  );
}
