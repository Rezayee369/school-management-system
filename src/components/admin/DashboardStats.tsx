'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { Users, BookOpen, HardHat } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface Stat {
  title: string;
  count: number;
  icon: React.ReactNode;
}

const StatCard = ({ stat }: { stat: Stat }) => (
  <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-border">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{stat.title}</p>
        <p className="text-4xl font-bold text-foreground mt-2">{stat.count}</p>
      </div>
      <div className="p-3 bg-primary/10 rounded-lg">{stat.icon}</div>
    </div>
  </div>
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
  const db = useFirestore();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const fetchStats = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const classesCollection = collection(db, 'classes');

        const [
          studentsSnapshot,
          teachersSnapshot,
          staffSnapshot,
          classesSnapshot,
        ] = await Promise.all([
          getCountFromServer(query(usersCollection, where('role', '==', 'student'))),
          getCountFromServer(query(usersCollection, where('role', '==', 'teacher'))),
          getCountFromServer(query(usersCollection, where('role', '==', 'staff'))),
          getCountFromServer(classesCollection),
        ]);

        const fetchedStats: Stat[] = [
          { title: t('adminDashboard.totalStudents'), count: studentsSnapshot.data().count, icon: <Users className="w-6 h-6 text-primary" /> },
          { title: t('adminDashboard.totalTeachers'), count: teachersSnapshot.data().count, icon: <Users className="w-6 h-6 text-primary" /> },
          { title: t('adminDashboard.totalStaff'), count: staffSnapshot.data().count, icon: <HardHat className="w-6 h-6 text-primary" /> },
          { title: t('adminDashboard.totalClasses'), count: classesSnapshot.data().count, icon: <BookOpen className="w-6 h-6 text-primary" /> },
        ];
        
        setStats(fetchedStats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Don't show toast for this, UI will show loading state or empty state
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [db, t]);

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
      return null; // Don't show anything if stats failed to load, to prevent a broken look.
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat) => (
        <StatCard key={stat.title} stat={stat} />
      ))}
    </div>
  );
}
