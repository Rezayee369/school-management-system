'use client';

import { useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import { StatCard } from '@/components/dashboard/stat-card';
import { UserPlus, Clock, CheckCircle, LineChart } from 'lucide-react';
import { type QueueItem } from '@/lib/types';


export default function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStart = Timestamp.fromDate(today);
  const todayEnd = Timestamp.fromDate(tomorrow);

  const { data: patientsToday, loading: loadingPatientsToday } = useCollection('patients', {
    where: [
        ['createdAt', '>=', todayStart],
        ['createdAt', '<', todayEnd],
    ]
  });

  const { data: waiting, loading: loadingWaiting } = useCollection('queue', {
    where: [['status', '==', 'Waiting']]
  });

  const { data: completedToday, loading: loadingCompletedToday } = useCollection<QueueItem>('queue', {
    where: [
        ['status', '==', 'Completed'],
        ['completedAt', '>=', todayStart],
        ['completedAt', '<', todayEnd],
    ]
  });

  const avgWaitTime = useMemo(() => {
    if (!completedToday || completedToday.length === 0) {
        return 0;
    }
    let totalWaitSeconds = 0;
    completedToday.forEach(doc => {
      if (doc.calledAt && doc.createdAt) {
        const wait = doc.calledAt.seconds - doc.createdAt.seconds;
        totalWaitSeconds += wait;
      }
    });
    return Math.round(totalWaitSeconds / completedToday.length / 60); // in minutes
  }, [completedToday]);

  const loading = loadingPatientsToday || loadingWaiting || loadingCompletedToday;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients Registered Today"
          value={patientsToday.length}
          icon={UserPlus}
          description="Total patients added to the system today."
          loading={loading}
        />
        <StatCard
          title="Patients Currently Waiting"
          value={waiting.length}
          icon={Clock}
          description="Number of patients in 'Waiting' status."
          loading={loading}
        />
        <StatCard
          title="Patients Completed Today"
          value={completedToday.length}
          icon={CheckCircle}
          description="Patients who have completed their visit today."
          loading={loading}
        />
        <StatCard
          title="Average Wait Time (Mins)"
          value={avgWaitTime > 0 ? `~${avgWaitTime}` : 'N/A'}
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
