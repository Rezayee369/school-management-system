'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  Loader2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { suggestDashboardTabs } from '@/ai/flows/dashboard-tab-suggestion';
import { UserRole } from '@/lib/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const allTabs = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Doctor', 'Receptionist'] },
  { name: 'Patient Registration', href: '/patient-registration', icon: UserPlus, roles: ['Admin', 'Receptionist'] },
  { name: 'Queue Management', href: '/queue-management', icon: Users, roles: ['Admin', 'Doctor', 'Receptionist'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['Admin', 'Doctor'] },
];

export function MainNav({
  className,
  isCollapsed,
  ...props
}: React.HTMLAttributes<HTMLElement> & { isCollapsed: boolean }) {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [sortedTabs, setSortedTabs] = useState(allTabs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role) {
      setLoading(true);
      suggestDashboardTabs({ userRole: userProfile.role as UserRole })
        .then(({ suggestedTabs }) => {
          const userTabs = allTabs.filter(tab => tab.roles.includes(userProfile.role));
          const orderedTabs = suggestedTabs
            .map(tabName => userTabs.find(tab => tab.name === tabName))
            .filter((tab): tab is typeof allTabs[0] => tab !== undefined);

          // Add any tabs not in the suggestion to the end
          userTabs.forEach(tab => {
            if (!orderedTabs.includes(tab)) {
              orderedTabs.push(tab);
            }
          });

          setSortedTabs(orderedTabs);
        })
        .catch(error => {
          console.error("Failed to get suggested tabs:", error);
          // Fallback to default role-based filtering
          setSortedTabs(allTabs.filter(tab => tab.roles.includes(userProfile.role)));
        })
        .finally(() => setLoading(false));
    }
  }, [userProfile?.role]);
  
  if (loading) {
    return (
       <div className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
         <Loader2 className="h-6 w-6 animate-spin" />
       </div>
    );
  }

  return (
    <TooltipProvider>
      <nav
        className={cn('flex items-center space-x-2 lg:space-x-4', className)}
        {...props}
      >
        {sortedTabs.map((tab) => (
          isCollapsed ? (
            <Tooltip key={tab.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={tab.href}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname === tab.href ? 'bg-accent text-accent-foreground' : 'transparent'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="sr-only">{tab.name}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {tab.name}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === tab.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className="flex items-center p-2">
                <tab.icon className="mr-2 h-5 w-5" />
                {tab.name}
              </div>
            </Link>
          )
        ))}
      </nav>
    </TooltipProvider>
  );
}
