'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { School, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        switch (role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'teacher':
            router.push('/teacher');
            break;
          case 'student':
            router.push('/student');
            break;
          case 'parent':
            router.push('/parent');
            break;
          default:
            setError('User role not found. Redirecting to home.');
            router.push('/');
            break;
        }
      } else {
        setError('No user data found in Firestore.');
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setError('Invalid email or password.');
      } else {
          setError('An unexpected error occurred. Please try again.');
      }
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start pt-24 sm:pt-32 px-4 bg-gradient-to-b from-indigo-900 via-purple-900 to-gray-900 text-white">
      <div className="w-full max-w-sm space-y-10 animate-fade-in-slide-up">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-white/10 p-4 shadow-lg">
            <School className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">School Portal</h1>
          <p className="mt-3 text-lg text-gray-300">Sign in to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border-2 border-transparent bg-white/10 px-4 py-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
              placeholder="Email address"
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border-2 border-transparent bg-white/10 px-4 py-4 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
              placeholder="Password"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-white py-4 font-bold text-indigo-700 transition duration-300 ease-in-out hover:bg-gray-200 disabled:opacity-50 transform hover:scale-105 disabled:transform-none"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
}
