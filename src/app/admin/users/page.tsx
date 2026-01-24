'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, writeBatch, where, getDocs, arrayRemove } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { UserPlus, Users, Briefcase, UserCircle, ArrowLeft, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const db = useFirestore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as UserData);
      });
      setUsers(usersData);
      setIsLoadingUsers(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Check Firestore permissions.");
      setIsLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleDeleteUser = async (userToDelete: UserData) => {
    if (!window.confirm(`Are you sure you want to delete ${userToDelete.fullName}? This will remove them from all associated classes. This action cannot be undone.`)) {
        return;
    }

    setIsDeleting(userToDelete.id);
    setError(null);

    try {
        const batch = writeBatch(db);

        // If user is a teacher, unassign them from classes
        if (userToDelete.role === 'teacher') {
            const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', userToDelete.id));
            const classesSnapshot = await getDocs(classesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { teacherId: '', teacherName: 'Unassigned' });
            });
        }

        // If user is a student, remove them from any classes they are enrolled in
        if (userToDelete.role === 'student') {
            const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', userToDelete.id));
            const classesSnapshot = await getDocs(classesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { studentIds: arrayRemove(userToDelete.id) });
            });
        }
        
        // Delete the user document itself. Note this does NOT delete the user from Firebase Auth.
        const userDocRef = doc(db, 'users', userToDelete.id);
        batch.delete(userDocRef);
        
        await batch.commit();

    } catch (err) {
        console.error("Error deleting user:", err);
        setError(`Failed to delete user ${userToDelete.fullName}.`);
    } finally {
        setIsDeleting(null);
    }
  };

  if (isLoadingUsers) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
        <p>Loading...</p>
      </main>
    );
  }
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Briefcase className="w-5 h-5 text-primary" />;
      case 'teacher': return <Users className="w-5 h-5 text-secondary" />;
      case 'student': return <UserCircle className="w-5 h-5 text-accent" />;
      default: return <UserCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="mb-8">
            <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
            </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-foreground">User Management</h1>
            <Link href="/admin/users/create">
                <button className="flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                    <UserPlus className="w-5 h-5" />
                    <span>Create User</span>
                </button>
            </Link>
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">All Users</h2>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <div className="space-y-3">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 bg-background/50 border border-muted/20 rounded-lg transition-all hover:border-primary/50">
                  <div className="font-medium text-foreground/90">{user.fullName}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role)}
                    <span className="text-sm font-semibold capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-end">
                    <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={isDeleting === user.id}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label={`Delete ${user.fullName}`}
                    >
                        {isDeleting === user.id ? <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No users found.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
