'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';
import { Megaphone, Loader2 } from 'lucide-react';
import { dispatchNotification } from '@/services/notificationService';
import { useTranslation } from '@/i18n';

type TargetRole = 'all' | 'parent' | 'teacher' | 'student' | 'staff';

export default function AdminNotificationsPage() {
  const db = useFirestore();
  const { t } = useTranslation();

  const roles: { value: TargetRole, label: string }[] = [
      { value: 'all', label: t('adminNotifications.allUsers') },
      { value: 'parent', label: t('adminNotifications.parents') },
      { value: 'teacher', label: t('adminNotifications.teachers') },
      { value: 'student', label: t('adminNotifications.students') },
      { value: 'staff', label: t('adminNotifications.staff') },
  ];

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t('adminNotifications.titleMessageRequired'));
      return;
    }

    setIsSaving(true);
    const notificationData = {
        title: title.trim(),
        message: message.trim(),
        targetRole,
        createdAt: serverTimestamp(),
    };

    try {
      // Save notification to Firestore
      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      toast.success(t('adminNotifications.sendSuccess'));
      
      // Dispatch notification (SMS/WhatsApp) in the background
      dispatchNotification(notificationData).catch(err => {
        console.error("Failed to dispatch notification:", err);
        // This error is not shown to the user as the primary action (saving to DB) was successful.
      });

      // Reset form
      setTitle('');
      setMessage('');
      setTargetRole('all');

    } catch (error) {
      toast.error(t('adminNotifications.sendError'));
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-3xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">{t('adminNotifications.title')}</h1>
        
        <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">{t('adminNotifications.formTitle')}</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('adminNotifications.formTitlePlaceholder')}
              className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">{t('adminNotifications.formMessage')}</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('adminNotifications.formMessagePlaceholder')}
              rows={5}
              className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="target-role" className="block text-sm font-medium text-muted-foreground mb-2">{t('adminNotifications.formAudience')}</label>
            <select
                id="target-role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as TargetRole)}
                className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
              <span>{isSaving ? t('adminNotifications.sending') : t('adminNotifications.sendButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
