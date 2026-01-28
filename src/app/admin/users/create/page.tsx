'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import toast from 'react-hot-toast';

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock, UserCheck, Phone, HardHat } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useTranslation } from '@/i18n';

export default function CreateUserPage() {
    const router = useRouter();
    const db = useFirestore();
    const { t } = useTranslation();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [phone, setPhone] = useState('');
    const [staffType, setStaffType] = useState('manager');
    const [isLoading, setIsLoading] = useState(false);

    const staffTypes = ["manager", "accountant", "clerk", "supervisor", "guard", "IT"];

    // Refs for keyboard navigation
    const formRef = useRef<HTMLFormElement>(null);
    const fullNameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const roleRef = useRef<HTMLSelectElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const staffTypeRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        fullNameRef.current?.focus();
    }, []);

    const handleKeyDown = (e: KeyboardEvent, nextFieldRef?: React.RefObject<HTMLElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldRef?.current) {
                nextFieldRef.current.focus();
            } else {
                formRef.current?.requestSubmit();
            }
        }
    };

    const handleRoleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (role === 'staff') {
                phoneRef.current?.focus();
            } else {
                formRef.current?.requestSubmit();
            }
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password || !role) {
            toast.error('All fields are required.');
            return;
        }
        if (role === 'staff' && (!phone || !staffType)) {
            toast.error('Phone and Staff Type are required for staff members.');
            return;
        }
        setIsLoading(true);
        
        const tempAppName = `temp-user-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        
        const loadingToastId = toast.loading(t('adminUsers.creating'));

        try {
            const tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUser = userCredential.user;

            const userData: any = {
                fullName,
                email,
                role,
                createdAt: serverTimestamp(),
                photoURL: null,
            };

            if (role === 'parent') {
                userData.studentIds = [];
            }
            if (role === 'staff') {
                userData.phone = phone;
                userData.staffType = staffType;
            }

            await setDoc(doc(db, 'users', newUser.uid), userData);

            toast.success(t('adminUsers.createUserSuccess'), { id: loadingToastId });
            router.replace('/admin/users');

        } catch (error: any) {
            console.error('Error creating user:', error);
            let errorMessage = t('adminUsers.createUserError');
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = t('adminUsers.emailInUseError');
            } else if (error.code === 'auth/weak-password') {
                errorMessage = t('adminUsers.weakPasswordError');
            }
            toast.error(errorMessage, { id: loadingToastId });
        } finally {
            await deleteApp(tempApp).catch(delError => console.error("Failed to delete temp app", delError));
            setIsLoading(false);
        }
    };


    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
             <div className="w-full max-w-md animate-fade-in-slide-up">
                <div className="mb-8">
                    <BackButton />
                </div>
                
                <div className="rounded-2xl bg-background/60 backdrop-blur-lg border border-secondary/20 shadow-2xl shadow-secondary/10 p-6 md:p-8">
                    <div className="flex flex-col items-center mb-6">
                        <h1 className="text-center text-3xl font-bold text-foreground tracking-wider">
                            {t('adminUsers.createUserTitle')}
                        </h1>
                        <p className="text-center text-sm text-secondary/80 mt-2">
                            {t('adminUsers.createUserSubtitle')}
                        </p>
                    </div>

                    <form ref={formRef} onSubmit={handleCreateUser} className="space-y-6">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                ref={fullNameRef}
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, emailRef)}
                                placeholder={t('adminUsers.fullName')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                ref={emailRef}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                placeholder={t('adminUsers.email')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                ref={passwordRef}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, roleRef)}
                                placeholder={t('adminUsers.password')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <select
                                ref={roleRef}
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                onKeyDown={handleRoleKeyDown}
                                className="w-full pl-12 pr-4 py-3 appearance-none rounded-xl bg-background/50 text-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            >
                                <option value="student">{t('adminUsers.student')}</option>
                                <option value="teacher">{t('adminUsers.teacher')}</option>
                                <option value="parent">{t('adminUsers.parent')}</option>
                                <option value="staff">{t('adminUsers.staff')}</option>
                            </select>
                        </div>
                        
                        {role === 'staff' && (
                            <>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                                    <input
                                        ref={phoneRef}
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, staffTypeRef)}
                                        placeholder={t('adminStaff.phone')}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                                    />
                                </div>
                                <div className="relative">
                                    <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                                    <select
                                        ref={staffTypeRef}
                                        value={staffType}
                                        onChange={(e) => setStaffType(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e)}
                                        className="w-full pl-12 pr-4 py-3 appearance-none rounded-xl bg-background/50 text-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                                    >
                                        {staffTypes.map(type => (
                                            <option key={type} value={type} className="capitalize">{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase flex items-center justify-center gap-3 hover:scale-105 hover:shadow-lg hover:shadow-secondary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('adminUsers.creating')}</span>
                                </>
                            ) : t('adminUsers.createUser')}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
