'use client';

import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface PermissionDeniedProps {
  userRole?: string;
}

export default function PermissionDenied({ userRole }: PermissionDeniedProps) {
  const router = useRouter();

  const handleGoToDashboard = () => {
    if (userRole && ['admin', 'teacher', 'student', 'parent'].includes(userRole)) {
      router.replace(`/${userRole}`);
    } else {
      router.replace('/login'); 
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background text-foreground">
      <div className="w-full max-w-lg text-center animate-fade-in-slide-up">
        <div className="p-8 bg-background/60 backdrop-blur-sm border border-destructive/30 rounded-xl shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have the necessary permissions to view this page.
          </p>
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
            <span>Go to Your Dashboard</span>
          </button>
        </div>
      </div>
    </main>
  );
}
