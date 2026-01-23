'use client';

import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, Megaphone, BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const isLoading = useAuthGuard('admin');

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-background text-foreground">
      <div className="w-full max-w-5xl animate-fade-in-slide-up">
        <DashboardHeader userRole="admin" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/classes" className="group">
              <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 border border-primary/30 hover:border-primary">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Manage Classes</h2>
                </div>
                <p className="text-muted-foreground">Add, edit, or view school classes and schedules.</p>
              </div>
            </Link>

            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-secondary/20 transition-shadow duration-300 border border-secondary/30 hover:border-secondary">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Manage Users</h2>
                </div>
                <p className="text-muted-foreground">Administer student, teacher, and parent accounts.</p>
              </div>
            </Link>
            
            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-shadow duration-300 border border-yellow-500/30 hover:border-yellow-500">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Megaphone className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
                </div>
                <p className="text-muted-foreground">Create and send announcements to all users.</p>
              </div>
            </Link>

            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-red-500/20 transition-shadow duration-300 border border-red-500/30 hover:border-red-500">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-red-500/10 rounded-lg">
                    <BarChart2 className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Analytics & Reports</h2>
                </div>
                <p className="text-muted-foreground">View school performance and user engagement data.</p>
              </div>
            </Link>
        </div>
      </div>
    </main>
  );
}
