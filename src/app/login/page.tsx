
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Mail, Lock, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { t } = useTranslation();

  const handleSuccessfulLogin = useCallback(async (user: User) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;

        switch (role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'teacher':
            router.replace('/teacher');
            break;
          case 'student':
            router.replace('/student');
            break;
          case 'parent':
            router.replace('/parent');
            break;
          case 'staff':
            router.replace('/profile');
            break;
          default:
            toast.error(t('login.roleInvalid', { role: role || 'not set'}));
            await signOut(auth);
            break;
        }
      } else {
        toast.error(t('login.noProfile'));
        await signOut(auth);
      }
    } catch (error: any) {
      console.error("Error fetching user data after login:", error);
      toast.error(t('login.postLoginError', { message: error.message }));
      await signOut(auth);
    }
  }, [db, router, auth, t]);

  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast.error('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(userCredential.user);
    } catch (error: any) {
      console.error("Login process failed:", error);
      toast.error(`Error: ${error.code} - ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [auth, email, password, handleSuccessfulLogin]);

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          fullName: user.displayName,
          email: user.email,
          role: 'student',
          createdAt: serverTimestamp(),
          photoURL: user.photoURL
        });
      }
      
      await handleSuccessfulLogin(user);

    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("Google Sign-In Error: ", error);
        toast.error(`${error.code}: ${error.message}` || 'An error occurred during Google Sign-In.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth, db, handleSuccessfulLogin]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4 bg-transparent">
      <div className="absolute top-4 end-4 z-20 flex items-center gap-2">
          <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md animate-fade-in-scale">
        <div className="rounded-2xl bg-background/60 backdrop-blur-lg border border-border p-8 shadow-2xl shadow-primary/10">

          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <h1 className="text-center text-3xl font-bold text-foreground tracking-wider">
              {t('login.title')}
            </h1>
            <p className="text-center text-sm text-primary/80 mt-2">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="relative">
              <Mail className="absolute inset-y-0 start-4 my-auto h-5 w-5 text-primary/60" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-background/50 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-input transition-all duration-300 ps-12 pe-4"
              />
            </div>

            <div className="relative">
              <Lock className="absolute inset-y-0 start-4 my-auto h-5 w-5 text-primary/60" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-background/50 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-input transition-all duration-300 ps-12 pe-4"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-bold tracking-wider uppercase flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? (
                  <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('login.authenticating')}</span>
                  </>
              ) : t('login.signIn')}
            </button>
          </form>

          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-4 flex-shrink text-xs text-muted-foreground uppercase">{t('login.orContinueWith')}</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-transparent py-3 font-semibold text-foreground transition duration-300 ease-in-out border border-input hover:bg-accent active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
                <>
                    <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('login.signingIn')}</span>
                </>
            ) : (
                <>
                    <GoogleIcon />
                    <span>{t('login.signInWithGoogle')}</span>
                </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

    
