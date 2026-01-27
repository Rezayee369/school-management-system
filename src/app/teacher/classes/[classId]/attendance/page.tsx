'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function DeprecatedAttendancePage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Optional: redirect after a delay
    const timer = setTimeout(() => {
      router.replace('/teacher/attendance');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-transparent">
      <div className="w-full max-w-lg text-center animate-fade-in-slide-up">
        <div className="p-8 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-foreground mb-4">{t('teacherClassAttendance.pageMovedTitle')}</h1>
            <p className="text-muted-foreground mb-6">
                {t('teacherClassAttendance.pageMovedDesc')}
            </p>
            <Link href="/teacher/attendance">
                <button className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                    <ArrowLeft size={18} />
                    <span>{t('teacherClassAttendance.goToNewPage')}</span>
                </button>
            </Link>
        </div>
      </div>
    </main>
  );
}
