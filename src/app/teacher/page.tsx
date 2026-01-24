'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import Link from 'next/link';
import { CalendarCheck } from 'lucide-react';

export default function TeacherDashboard() {
  const isLoading = useAuthGuard('teacher');

  if (isLoading) {
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

      </div>
    </main>
  );
}
