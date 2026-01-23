'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Mail, Lock, GraduationCap } from 'lucide-react';

// Google Icon SVG
const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.438,36.338,48,30.418,48,24c0-3.592-0.75-7.001-2.085-10.025l-6.238,5.034C39.9,20.169,40,22.064,40,24c0,1.354-0.125,2.673-0.36,3.917L43.611,20.083z"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Shared function to handle post-login logic
  const handleSuccessfulLogin = async (user: User) => {
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
          setError('User role not found. Please contact an administrator.');
          auth.signOut();
          break;
      }
    } else {
      // This is important for social logins where the user might not be in our DB
      setError('Your account is not registered. Please contact an administrator.');
      auth.signOut(); // Sign them out as they are not authorized
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
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
      await handleSuccessfulLogin(userCredential.user);
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

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(result.user);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError('Failed to sign in with Google. Please try again.');
      }
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#020617] p-4">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-8 animate-fade-in-slide-up">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
        </div>

        <h1 className="text-center text-3xl font-bold text-white">
          School Management System
        </h1>
        <p className="text-center text-sm text-indigo-200 mt-2 mb-8">
          Login to your dashboard
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLoading}
              className="w-full pl-10 py-3 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none border-transparent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300 w-5 h-5" />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              className="w-full pl-10 py-3 rounded-xl bg-white/20 text-white placeholder-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none border-transparent"
            />
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="mx-4 flex-shrink text-sm text-indigo-200">Or continue with</span>
            <div className="flex-grow border-t border-white/20"></div>
        </div>

        <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white/20 py-3 font-semibold text-white transition duration-300 ease-in-out hover:bg-white/30 disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Sign in with Google</span>
        </button>
      </div>
    </main>
  );
}
