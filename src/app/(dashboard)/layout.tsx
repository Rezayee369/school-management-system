'use client';
import React from 'react';
import { MainNav } from '@/components/layout/main-nav';
import { UserNav } from '@/components/layout/user-nav';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const { userProfile } = useAuth();

  if (!userProfile) {
    return null; // AuthProvider handles redirects, this prevents flicker
  }
  
  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-background transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <h1
            className={cn(
              'text-xl font-bold font-headline text-primary whitespace-nowrap overflow-hidden',
              isCollapsed ? 'w-0' : 'w-auto'
            )}
          >
            HealthQueue Pro
          </h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'h-8 w-8 text-primary',
              isCollapsed ? 'w-8' : 'w-0'
            )}
          >
            <path d="M14.5 13.5h-5L7 21l7-1-2.5-7.5Z" />
            <path d="M12 3a2.5 2.5 0 0 0-4.14 3.46l-2.02 6.04" />
            <path d="M19.14 6.46A2.5 2.5 0 0 0 15 3" />
          </svg>
        </div>
        <nav className={cn('flex-1 p-2 space-y-2', isCollapsed && 'flex flex-col items-center')}>
          <MainNav isCollapsed={isCollapsed} />
        </nav>
      </aside>

      <div className="flex flex-col w-full">
        <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex"
          >
            {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </Button>
          <div className="w-full flex-1">
            <h2 className="text-xl font-semibold">Welcome, {userProfile.name}! ({userProfile.role})</h2>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
