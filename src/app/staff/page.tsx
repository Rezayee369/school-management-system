
'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useTranslation } from '@/i18n';
import { HardHat, CalendarCheck, BookOpen, Bell } from 'lucide-react';
import Link from 'next/link';


export default function StaffDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('staff');
  const { t } = useTranslation();

  if (isLoadingAuth) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }
  
  const staffActions = [
      {
          title: "Manage Attendance",
          description: "View and manage student attendance records.",
          icon: <CalendarCheck className="w-6 h-6 text-secondary" />,
          link: "/staff/attendance" // Example link
      },
      {
          title: "View Timetables",
          description: "Access class schedules and timetables.",
          icon: <BookOpen className="w-6 h-6 text-primary" />,
          link: "/staff/timetables" // Example link
      },
      {
          title: "School Announcements",
          description: "Stay updated with the latest school news.",
          icon: <Bell className="w-6 h-6 text-accent" />,
          link: "/staff/announcements" // Example link
      },
  ]

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-transparent text-foreground">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="staff" />
        <div className="mt-12">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Staff Actions</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffActions.map(action => (
                     <div key={action.title} className="group">
                        <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-secondary hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1 hover:scale-[1.02]">
                            <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-secondary/10 rounded-lg transition-all duration-300 group-hover:bg-secondary/20 group-hover:shadow-[0_0_15px_hsl(var(--secondary))]">
                                {action.icon}
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">{action.title}</h2>
                            </div>
                            <p className="text-muted-foreground">{action.description}</p>
                        </div>
                     </div>
                ))}
            </div>
        </div>
      </div>
    </main>
  );
}
