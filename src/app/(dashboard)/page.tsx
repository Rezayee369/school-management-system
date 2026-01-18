'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { StatCard } from '@/components/dashboard/stat-card';
import { Users, Clock, CheckCircle, UserPlus, LineChart } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface DashboardStats {
  patientsToday: number;
  patientsWaiting: number;
  patientsCompleted: number;
  avgWaitTime: number;
  error: string | null;
}

async function getDashboardStats() {
  if (!db) {
    return {
      patientsToday: 0,
      patientsWaiting: 0,
      patientsCompleted: 0,
      avgWaitTime: 0,
      error: "Connecting to database..."
    }
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStart = Timestamp.fromDate(today);
    const todayEnd = Timestamp.fromDate(tomorrow);
    
    // Patients registered today
    const patientsTodayQuery = query(
      collection(db, 'patients'),
      where('createdAt', '>=', todayStart),
      where('createdAt', '<', todayEnd)
    );
    const patientsTodaySnapshot = await getCountFromServer(patientsTodayQuery);
    const patientsTodayCount = patientsTodaySnapshot.data().count;

    // Patients currently waiting
    const waitingQuery = query(collection(db, 'queue'), where('status', '==', 'Waiting'));
    const waitingSnapshot = await getCountFromServer(waitingQuery);
    const waitingCount = waitingSnapshot.data().count;

    // Patients completed today
    const completedTodayQuery = query(
      collection(db, 'queue'),
      where('status', '==', 'Completed'),
      where('completedAt', '>=', todayStart),
      where('completedAt', '<', todayEnd)
    );
    const completedTodaySnapshot = await getCountFromServer(completedTodayQuery);
    const completedTodayCount = completedTodaySnapshot.data().count;
    
    // Average wait time - this is a simplified calculation for this example
    // A real implementation might use a cloud function to calculate this more accurately
    let averageWaitTime = 0;
    const completedDocs = await getDocs(completedTodayQuery);
    if (!completedDocs.empty) {
      let totalWaitSeconds = 0;
      completedDocs.forEach(doc => {
        const data = doc.data();
        if (data.calledAt && data.createdAt) {
          const wait = data.calledAt.seconds - data.createdAt.seconds;
          totalWaitSeconds += wait;
        }
      });
      averageWaitTime = Math.round(totalWaitSeconds / completedDocs.size / 60); // in minutes
    }


    return {
      patientsToday: patientsTodayCount,
      patientsWaiting: waitingCount,
      patientsCompleted: completedTodayCount,
      avgWaitTime: averageWaitTime,
      error: null
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      patientsToday: 0,
      patientsWaiting: 0,
      patientsCompleted: 0,
      avgWaitTime: 0,
      error: "Could not fetch dashboard data."
    }
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    patientsToday: 0,
    patientsWaiting: 0,
    patientsCompleted: 0,
    avgWaitTime: 0,
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getDashboardStats().then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients Registered Today"
          value={stats.patientsToday}
          icon={UserPlus}
          description="Total patients added to the system today."
          loading={loading}
        />
        <StatCard
          title="Patients Currently Waiting"
          value={stats.patientsWaiting}
          icon={Clock}
          description="Number of patients in 'Waiting' status."
          loading={loading}
        />
        <StatCard
          title="Patients Completed Today"
          value={stats.patientsCompleted}
          icon={CheckCircle}
          description="Patients who have completed their visit today."
          loading={loading}
        />
        <StatCard
          title="Average Wait Time (Mins)"
          value={stats.avgWaitTime > 0 ? `~${stats.avgWaitTime}` : 'N/A'}
          icon={LineChart}
          description="Average time from registration to being called."
          loading={loading}
        />
      </div>
      <div className="text-center text-muted-foreground pt-10">
        <h3 className="text-lg font-semibold">More analytics coming soon</h3>
        <p>Detailed charts and visualizations will be available here.</p>
      </div>
    </div>
  );
}
