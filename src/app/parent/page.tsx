'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { LogOut, User } from 'lucide-react';

export default function ParentDashboard() {
  const router = useRouter();
  const isLoading = useAuthGuard('parent');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      // You could add a user-facing error message here
    }
  };
  
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
          <h1 className="text-4xl font-bold text-gray-800">Parent Dashboard</h1>
          
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-600 font-bold text-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {user?.photoURL ? (
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={user.photoURL}
                  alt="User avatar"
                />
              ) : (
                user?.email?.charAt(0).toUpperCase() || <User size={20} />
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

        </div>
        <div className="p-8 bg-white rounded-xl shadow-lg">
          <p className="text-lg text-gray-700">Welcome to the parent dashboard. You have access.</p>
        </div>
      </div>
    </main>
  );
}
