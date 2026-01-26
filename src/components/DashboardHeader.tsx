'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth, useUser } from '@/firebase';
import { LogOut, User as UserIcon, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface DashboardHeaderProps {
  userRole: string;
}

export default function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const router = useRouter();
  const auth = useAuth();
  const user = useUser();
  const { theme, setTheme } = useTheme();
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
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  const getInitials = (email: string | null | undefined) => {
    return email ? email.charAt(0).toUpperCase() : <UserIcon size={20} />;
  };
  
  const getRoleTranslationKey = (role: string): string => {
    const roleMap: {[key: string]: string} = {
      admin: 'dashboardHeader.admin',
      teacher: 'dashboardHeader.teacher',
      student: 'dashboardHeader.student',
      parent: 'dashboardHeader.parent',
    };
    return roleMap[role] || role;
  }

  return (
    <header className="flex w-full justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground capitalize">
          {t(getRoleTranslationKey(userRole))}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="relative flex items-center justify-center h-11 w-11 rounded-full bg-background/70 text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
            <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>

        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-center h-11 w-11 rounded-full bg-background/70 text-foreground font-bold text-lg hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            {user?.photoURL ? (
              <img
                className="h-full w-full rounded-full object-cover"
                src={user.photoURL}
                alt="User avatar"
              />
            ) : (
              getInitials(user?.email)
            )}
          </button>

          <div
            ref={dropdownRef}
            className={`absolute end-0 mt-2 w-56 origin-top-right rounded-xl bg-background/80 backdrop-blur-lg border border-secondary/20 shadow-2xl shadow-primary/10 ring-1 ring-black ring-opacity-5 z-10 transition-all duration-150 ease-out
              ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          >
            <div className="py-1">
              {user?.email && (
                <div className="px-4 py-3 border-b border-secondary/20">
                  <p className="text-sm font-medium text-foreground">{t('dashboardHeader.signedInAs')}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
              )}
              <div className="p-1">
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-not-allowed"
                  disabled
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>{t('dashboardHeader.profile')}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
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
