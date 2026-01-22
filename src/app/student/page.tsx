
'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function StudentDashboard() {
  const router = useRouter();
  const isLoading = useAuthGuard('student');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      // You could add a user-facing error message here
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <p className="text-lg text-gray-700">Welcome to the student dashboard. You have access.</p>
        </div>
      </div>
    </main>
  );
}
