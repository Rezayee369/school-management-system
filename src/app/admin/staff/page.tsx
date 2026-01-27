'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { UserPlus, Users, Trash2, HardHat, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonListRow } from '@/components/Skeleton';
import { useTranslation } from '@/i18n';
import BackButton from '@/components/BackButton';


interface StaffData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  staffType: string;
}

export default function AdminStaffPage() {
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [staffToDelete, setStaffToDelete] = useState<StaffData | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!db) {
        setIsLoadingStaff(false);
        return;
    }
    const q = query(collection(db, 'users'), where('role', '==', 'staff'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const staffData: StaffData[] = [];
      querySnapshot.forEach((doc) => {
        staffData.push({ id: doc.id, ...doc.data() } as StaffData);
      });
      setStaff(staffData);
      setIsLoadingStaff(false);
    }, (err) => {
      console.error("Error fetching staff:", err);
      toast.error("Failed to fetch staff members. Check Firestore permissions.");
      setIsLoadingStaff(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDeleteClick = (user: StaffData) => {
    setStaffToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setStaffToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;

    setIsConfirmOpen(false);
    setIsDeleting(staffToDelete.id);
    const deletionToast = toast.loading(`Deleting ${staffToDelete.fullName}...`);

    try {
        // This action ONLY deletes the Firestore document, not the Firebase Auth user.
        // Deleting Auth users requires admin privileges and a backend environment (e.g., Cloud Functions).
        const userDocRef = doc(db, 'users', staffToDelete.id);
        await deleteDoc(userDocRef);
        toast.success(`Staff member ${staffToDelete.fullName} removed from database.`, { id: deletionToast });

    } catch (err: any) {
        console.error("Error deleting staff member:", err);
        toast.error(`Failed to delete staff member: ${err.message || 'Please check permissions.'}`, { id: deletionToast });
    } finally {
        setIsDeleting(null);
        setStaffToDelete(null);
    }
  };

  if (isLoadingStaff) {
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div className="h-6 w-40 bg-muted rounded-md animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-72 bg-muted rounded-md animate-pulse"></div>
            <div className="h-12 w-36 bg-muted rounded-lg animate-pulse"></div>
          </div>
          <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
            <div className="h-8 w-40 bg-muted rounded-md animate-pulse mb-4"></div>
            <div className="space-y-3">
              <SkeletonListRow />
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
            <BackButton />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">{t('adminStaff.title')}</h1>
            <Link href="/admin/staff/create">
                <button className="flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                    <UserPlus className="w-5 h-5" />
                    <span>{t('adminStaff.createStaff')}</span>
                </button>
            </Link>
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">{t('adminStaff.allStaff')}</h2>
          <div className="space-y-3">
            {staff.length > 0 ? (
              staff.map((user) => (
                <div key={user.id} className="p-4 bg-background/50 border border-muted/20 rounded-lg transition-all hover:border-primary/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <p className="font-medium text-foreground/90">{user.fullName}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-4 h-4 text-accent" />
                                <span className="font-semibold capitalize">{user.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HardHat className="w-4 h-4 text-secondary" />
                                <span className="font-semibold capitalize">{user.staffType}</span>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                            <button
                                onClick={() => handleDeleteClick(user)}
                                disabled={isDeleting === user.id}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Delete ${user.fullName}`}
                            >
                                {isDeleting === user.id ? <div className="w-5 h-5 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
              ))
            ) : (
                <div className="text-center py-16">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{t('adminStaff.noStaffFound')}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t('adminStaff.getStarted')}</p>
                    <div className="mt-6">
                        <Link href="/admin/staff/create">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                                <UserPlus className="w-5 h-5" />
                                <span>{t('adminStaff.createStaff')}</span>
                            </button>
                        </Link>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

    <ConfirmDialog
        open={isConfirmOpen}
        title={t('adminStaff.deleteStaffTitle', { user: staffToDelete?.fullName || 'Staff' })}
        description={t('adminStaff.deleteStaffDesc')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={t('adminStaff.deleteStaffConfirm')}
        isLoading={isDeleting === staffToDelete?.id}
    />
    </main>
  );
}
