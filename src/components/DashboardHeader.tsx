'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  userRole: string;
}

export default function DashboardHeader({ userRole }: DashboardHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setUser(auth.currentUser);

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

  return (
    <header className="flex w-full justify-between items-center mb-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 capitalize">
          {userRole} Dashboard
        </h1>
      </div>

      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center justify-center h-11 w-11 rounded-full bg-gray-200 text-gray-600 font-bold text-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
          className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-10 transition-all duration-150 ease-out
            ${isDropdownOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
        >
          <div className="py-1">
            {user?.email && (
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Signed in as</p>
                <p className="truncate text-sm text-gray-500">{user.email}</p>
              </div>
            )}
            <div className="p-1">
               <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-400 hover:bg-gray-100 cursor-not-allowed"
                disabled
              >
                <Settings className="h-4 w-4 text-gray-400" />
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
