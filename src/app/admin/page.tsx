'use client';

import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { BookOpen, Users, Megaphone, BarChart2 } from 'lucide-react';

export default function AdminDashboard() {
  const isLoading = useAuthGuard('admin');

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gray-50">
      <div className="w-full max-w-5xl">
        <DashboardHeader userRole="admin" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manage Classes Card */}
            <Link href="/admin/classes" className="group">
              <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:border-indigo-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Manage Classes</h2>
                </div>
                <p className="text-gray-600">Add, edit, or view school classes and schedules.</p>
              </div>
            </Link>

            {/* Manage Users Card */}
            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:border-green-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Manage Users</h2>
                </div>
                <p className="text-gray-600">Administer student, teacher, and parent accounts.</p>
              </div>
            </Link>
            
            {/* Announcements Card */}
            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:border-yellow-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Megaphone className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
                </div>
                <p className="text-gray-600">Create and send announcements to all users.</p>
              </div>
            </Link>

            {/* Reports Card */}
            <Link href="#" className="group">
              <div className="flex flex-col h-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 hover:border-red-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <BarChart2 className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Analytics & Reports</h2>
                </div>
                <p className="text-gray-600">View school performance and user engagement data.</p>
              </div>
            </Link>
        </div>
      </div>
    </main>
  );
}
