
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { LogOut, User as UserIcon, Settings, Shield, Briefcase, GraduationCap, HardHat } from 'lucide-react';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Skeleton } from './Skeleton';

interface DashboardHeaderProps {
  userRole: string;
}

export default function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const router = useRouter();
  const auth = useAuth();
  const user = useUser();
  const { t } = useTranslation();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    
    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsDropdownOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  }, [auth, router]);

  const getInitials = (email: string | null | undefined) => {
    return email ? email.charAt(0).toUpperCase() : <UserIcon size={20} />;
  };
  
  const getRoleInfo = (role: string): { key: string, icon: React.ReactNode, color: string } => {
      switch(role) {
          case 'admin': return { key: 'dashboardHeader.roleAdmin', icon: <Shield size={14}/>, color: 'text-destructive' };
          case 'teacher': return { key: 'dashboardHeader.roleTeacher', icon: <Briefcase size={14}/>, color: 'text-primary' };
          case 'student': return { key: 'dashboardHeader.roleStudent', icon: <GraduationCap size={14}/>, color: 'text-accent' };
          case 'parent': return { key: 'dashboardHeader.roleParent', icon: <UserIcon size={14}/>, color: 'text-green-400' };
          case 'staff': return { key: 'dashboardHeader.roleStaff', icon: <HardHat size={14}/>, color: 'text-secondary' };
          default: return { key: 'dashboardHeader.roleUnknown', icon: <UserIcon size={14}/>, color: 'text-muted-foreground' };
      }
  }

  const getPageTitleTranslationKey = (role: string): string => {
    const roleMap: {[key: string]: string} = {
      admin: 'dashboardHeader.admin',
      teacher: 'dashboardHeader.teacher',
      student: 'dashboardHeader.student',
      parent: 'dashboardHeader.parent',
      staff: 'dashboardHeader.staff',
    };
    return roleMap[role] || role;
  }
  
  if (user === undefined) {
      return (
         <header className="flex w-full justify-between items-center mb-10">
            <div>
                 <Skeleton className="h-10 w-64" />
            </div>
             <div className="flex items-center gap-2">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-11 w-11 rounded-full" />
            </div>
        </header>
      )
  }
  
  if (user === null) {
      return null;
  }
  
  const roleInfo = getRoleInfo(user.role || '');

  return (
    <header className="flex w-full justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground capitalize">
          {t(getPageTitleTranslationKey(userRole))}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher />
        
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center h-11 w-11 rounded-full bg-background/70 text-foreground font-bold text-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            aria-haspopup="true"
            aria-expanded={isDropdownOpen}
          >
            {user?.photoURL ? (
              <img
                className="h-full w-full rounded-full object-cover"
                src={user.photoURL}
                alt={t('dashboardHeader.userAvatarAlt')}
              />
            ) : (
              getInitials(user?.email)
            )}
          </button>

          <div
            ref={dropdownRef}
            className={`absolute end-0 mt-2 w-64 origin-top-right rounded-xl bg-popover text-popover-foreground border border-border shadow-2xl shadow-primary/10 ring-1 ring-black ring-opacity-5 z-10 transition-all duration-150 ease-out
              ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
            role="menu"
          >
            <div className="py-1">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{user.displayName || user.email}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                {user.role && (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-muted/50 ${roleInfo.color}`}>
                        {roleInfo.icon}
                        <span>{t(roleInfo.key)}</span>
                    </div>
                )}
              </div>
              <div className="p-1">
                <Link href="/profile" onClick={() => setIsDropdownOpen(false)} passHref legacyBehavior>
                    <a
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer"
                        role="menuitem"
                    >
                        <Settings className="h-4 w-4" />
                        <span>{t('dashboardHeader.profile')}</span>
                    </a>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('dashboardHeader.logout')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

    
