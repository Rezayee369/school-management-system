'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import toast from 'react-hot-toast';

import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Lock, Phone, HardHat } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { useTranslation } from '@/i18n';

export default function CreateStaffPage() {
    const router = useRouter();
    const db = useFirestore();
    const { t } = useTranslation();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [staffType, setStaffType] = useState('manager');
    const [isLoading, setIsLoading] = useState(false);
    
    const staffTypes = ["manager", "accountant", "clerk", "supervisor", "guard", "IT"];

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !email || !password || !phone || !staffType) {
            toast.error('All fields are required.');
            return;
        }
        setIsLoading(true);
        
        const tempAppName = `temp-staff-creation-${Date.now()}`;
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        
        const loadingToastId = toast.loading('Creating user...');

        try {
            const tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const newUser = userCredential.user;

            await setDoc(doc(db, 'users', newUser.uid), {
                fullName,
                email,
                phone,
                staffType,
                role: 'staff',
                createdAt: serverTimestamp(),
                photoURL: null,
            });

            toast.success('Staff member created successfully!', { id: loadingToastId });
            router.push('/admin/staff');

        } catch (error: any) {
            console.error('Error creating user:', error);
            let errorMessage = 'Failed to create user. Please check the console for details.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }
            toast.error(errorMessage, { id: loadingToastId });
        } finally {
            await deleteApp(tempApp).catch(delError => console.error("Failed to delete temp app", delError));
            setIsLoading(false);
        }
    };
    
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-background">
             <div className="w-full max-w-md animate-fade-in-slide-up">
                <div className="mb-8">
                    <BackButton />
                </div>
                
                <div className="rounded-2xl bg-background/60 backdrop-blur-lg border border-secondary/20 shadow-2xl shadow-secondary/10 p-6 md:p-8">
                    <div className="flex flex-col items-center mb-6">
                        <h1 className="text-center text-3xl font-bold text-foreground tracking-wider">
                            {t('adminStaff.createTitle')}
                        </h1>
                        <p className="text-center text-sm text-secondary/80 mt-2">
                            {t('adminStaff.createSubtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder={t('adminStaff.fullName')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('adminStaff.email')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('adminStaff.password')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t('adminStaff.phone')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-background/50 text-foreground placeholder-gray-400 focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            />
                        </div>
                        <div className="relative">
                            <HardHat className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <select
                                value={staffType}
                                onChange={(e) => setStaffType(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 appearance-none rounded-xl bg-background/50 text-foreground focus:ring-2 focus:ring-ring focus:outline-none border border-secondary/30"
                            >
                                {staffTypes.map(type => (
                                    <option key={type} value={type} className="capitalize">{type}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase flex items-center justify-center gap-3 hover:scale-105 hover:shadow-lg hover:shadow-secondary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{t('adminStaff.creating')}</span>
                                </>
                            ) : t('adminStaff.createStaff')}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
