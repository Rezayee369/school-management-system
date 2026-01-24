'use client';

import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, Briefcase, CheckSquare, Megaphone, BarChart2 } from 'lucide-react';

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
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="admin" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 transition-all duration-300 hover:border-primary hover:shadow-primary/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Teachers</p>
                        <p className="text-4xl font-bold text-foreground mt-2">—</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>
            <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-secondary/30 transition-all duration-300 hover:border-secondary hover:shadow-secondary/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Students</p>
                        <p className="text-4xl font-bold text-foreground mt-2">—</p>
                    </div>
                    <div className="p-3 bg-secondary/10 rounded-lg">
                        <Users className="w-6 h-6 text-secondary" />
                    </div>
                </div>
            </div>
            <Link href="/admin/classes" className="block">
                <div className="p-6 h-full bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-accent/30 transition-all duration-300 hover:border-accent hover:shadow-accent/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Classes</p>
                            <p className="text-4xl font-bold text-foreground mt-2">—</p>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-lg">
                            <BookOpen className="w-6 h-6 text-accent" />
                        </div>
                    </div>
                </div>
            </Link>
             <div className="p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-primary/30 transition-all duration-300 hover:border-primary hover:shadow-primary/20">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Attendance Today</p>
                        <p className="text-4xl font-bold text-foreground mt-2">—</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <CheckSquare className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>
        </div>

        <div className="mt-12">
             <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Actions</h2>
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

                <Link href="/admin/users" className="group">
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
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-accent/20 transition-shadow duration-300 border border-accent/30 hover:border-accent">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-accent/10 rounded-lg">
                        <Megaphone className="w-6 h-6 text-accent" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
                    </div>
                    <p className="text-muted-foreground">Create and send announcements to all users.</p>
                  </div>
                </Link>

                <Link href="#" className="group">
                  <div className="flex flex-col h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 border border-primary/30 hover:border-primary">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <BarChart2 className="w-6 h-6 text-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Analytics & Reports</h2>
                    </div>
                    <p className="text-muted-foreground">View school performance and user engagement data.</p>
                  </div>
                </Link>
            </div>
        </div>
      </div>
    </main>
  );
}
