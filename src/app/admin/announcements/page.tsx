
'use client';

import { useState } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import BackButton from '@/components/BackButton';
import { Megaphone, Users, Loader2 } from 'lucide-react';
import { dispatchNotification } from '@/services/notificationService';

type TargetRole = 'all' | 'parent' | 'teacher' | 'student' | 'staff';

const roles: { value: TargetRole, label: string }[] = [
    { value: 'all', label: 'All Users' },
    { value: 'parent', label: 'Parents' },
    { value: 'teacher', label: 'Teachers' },
    { value: 'student', label: 'Students' },
    { value: 'staff', label: 'Staff' },
];

export default function AdminNotificationsPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('admin');
  const db = useFirestore();

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState<TargetRole>('all');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
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
      toast.success('Notification sent successfully!');
      
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
      toast.error('Failed to send notification.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-3xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Create Notification</h1>
        
        <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., School Closure Notice"
              className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-muted-foreground mb-2">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the details of the notification..."
              rows={5}
              className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="target-role" className="block text-sm font-medium text-muted-foreground mb-2">Target Audience</label>
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
              <span>Send Notification</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
