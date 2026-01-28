'use client';

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useTranslation, type Language } from '@/i18n';
import BackButton from '@/components/BackButton';
import { User, Mail, Phone, Globe, Shield, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

interface ProfileData {
    fullName: string;
    phone: string;
    email: string;
    role: string;
}

export default function ProfilePage() {
    const user = useUser();
    const db = useFirestore();
    const router = useRouter();
    const { t, language, setLanguage } = useTranslation();

    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    
    // Refs for keyboard navigation
    const formRef = useRef<HTMLFormElement>(null);
    const fullNameRef = useRef<HTMLInputElement>(null);
    const phoneRef = useRef<HTMLInputElement>(null);
    const languageRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (!isLoading) {
            fullNameRef.current?.focus();
        }
    }, [isLoading]);

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


    // Redirect if not logged in
    useEffect(() => {
        if (user === null) {
            router.replace('/');
        }
    }, [user, router]);

    // Fetch profile data
    useEffect(() => {
        if (user && db) {
            const fetchProfile = async () => {
                setIsLoading(true);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(userDocRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as ProfileData;
                        setProfileData(data);
                        setFullName(data.fullName || '');
                        setPhone(data.phone || '');
                    } else {
                        toast.error(t('profile.fetchError'));
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    toast.error(t('profile.fetchError'));
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProfile();
        }
    }, [user, db, t]);
    
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !db || !fullName.trim()) {
            toast.error(t('profile.validationError'));
            return;
        }

        setIsSaving(true);
        const userDocRef = doc(db, 'users', user.uid);

        try {
            await updateDoc(userDocRef, {
                fullName: fullName.trim(),
                phone: phone.trim(),
                // 'updatedAt' is a good practice, assuming it exists in the schema
                // updatedAt: serverTimestamp(),
            });
            toast.success(t('profile.updateSuccess'));
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(t('profile.updateError'));
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading || user === undefined) {
        return (
             <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
                <div className="w-full max-w-2xl animate-fade-in-slide-up">
                     <Skeleton className="h-6 w-24 mb-8" />
                     <Skeleton className="h-10 w-48 mb-2" />
                     <Skeleton className="h-5 w-64 mb-8" />
                    <div className="p-8 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg space-y-8">
                        <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                        <div className="flex justify-end"><Skeleton className="h-12 w-32" /></div>
                    </div>
                </div>
            </main>
        );
    }
    
    if (user === null) {
        // This will be shown briefly before the redirect effect kicks in.
        return null;
    }

    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
            <div className="w-full max-w-2xl animate-fade-in-slide-up">
                <div className="flex justify-between items-center mb-8">
                    <BackButton />
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{t('profile.title')}</h1>
                <p className="text-muted-foreground mb-8">{t('profile.subtitle')}</p>
                
                <form ref={formRef} onSubmit={handleSaveProfile} className="p-8 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-8">
                    
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-2">{t('profile.fullNameLabel')}</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                id="fullName"
                                ref={fullNameRef}
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                className="w-full pl-12 pr-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    
                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground mb-2">{t('profile.phoneLabel')}</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <input
                                id="phone"
                                ref={phoneRef}
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, languageRef)}
                                className="w-full pl-12 pr-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    
                    {/* Email (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">{t('profile.emailLabel')}</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <p className="w-full pl-12 pr-4 py-3 bg-muted/30 text-muted-foreground border border-input rounded-md">{profileData?.email}</p>
                        </div>
                    </div>
                    
                    {/* Role (Read-only) */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">{t('profile.roleLabel')}</label>
                        <div className="relative">
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <p className="w-full pl-12 pr-4 py-3 capitalize bg-muted/30 text-muted-foreground border border-input rounded-md">{profileData?.role}</p>
                        </div>
                    </div>

                    {/* Language */}
                     <div>
                        <label htmlFor="language" className="block text-sm font-medium text-muted-foreground mb-2">{t('profile.languageLabel')}</label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/60 w-5 h-5" />
                            <select
                                id="language"
                                ref={languageRef}
                                value={language}
                                onChange={(e) => setLanguage(e.target.value as Language)}
                                onKeyDown={(e) => handleKeyDown(e)}
                                className="w-full pl-12 pr-4 py-3 appearance-none bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="en">English</option>
                                <option value="fa">فارسی</option>
                                <option value="ps">پښتو</option>
                            </select>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            <span>{isSaving ? t('profile.savingButton') : t('profile.saveButton')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
