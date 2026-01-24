'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AttendanceLandingPage() {
  const isLoading = useAuthGuard('teacher');

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-lg text-center animate-fade-in-slide-up">
        <div className="p-8 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-foreground mb-4">Mark Attendance</h1>
            <p className="text-muted-foreground mb-6">
                Please select a class from your dashboard to mark attendance.
            </p>
            <Link href="/teacher">
                <button className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                    <ArrowLeft size={18} />
                    <span>Go to Dashboard</span>
                </button>
            </Link>
        </div>
      </div>
    </main>
  );
}
