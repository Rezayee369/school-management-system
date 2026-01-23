'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';

export default function TeacherDashboard() {
  const isLoading = useAuthGuard('teacher');

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <DashboardHeader userRole="teacher" />
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <p className="text-lg text-gray-700">Welcome to the teacher dashboard. You have access.</p>
        </div>
      </div>
    </main>
  );
}
