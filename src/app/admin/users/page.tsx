'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, onSnapshot, orderBy, doc, writeBatch, where, getDocs, arrayRemove } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { UserPlus, Users, Briefcase, UserCircle, ArrowLeft, Trash2, LogOut, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonListRow } from '@/components/Skeleton';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedFullName, setUpdatedFullName] = useState('');
  const [updatedRole, setUpdatedRole] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      toast.error('Failed to log out.');
    }
  };

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
      toast.error("Failed to fetch users. Check Firestore permissions.");
      setIsLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleEditClick = (user: UserData) => {
    if (user.role === 'admin') {
      toast.error("Admin users cannot be edited from this interface for security reasons.");
      return;
    }
    setEditingUser(user);
    setUpdatedFullName(user.fullName);
    setUpdatedRole(user.role);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsUpdating(true);
    const updateToast = toast.loading('Updating user...');

    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', editingUser.id);
        
        const newUserData = {
            fullName: updatedFullName,
            role: updatedRole,
        };
        batch.update(userDocRef, newUserData);

        // If role changed FROM teacher, unassign from classes.
        if (editingUser.role === 'teacher' && updatedRole !== 'teacher') {
            const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', editingUser.id));
            const snapshot = await getDocs(classesQuery);
            snapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { teacherId: '', teacherName: 'Unassigned' });
            });
        }
        
        // If role changed FROM student, unenroll from classes.
        if (editingUser.role === 'student' && updatedRole !== 'student') {
            const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', editingUser.id));
            const snapshot = await getDocs(classesQuery);
            snapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { studentIds: arrayRemove(editingUser.id) });
            });
        }

        // If teacher name changed, update it in their classes.
        if (editingUser.role === 'teacher' && updatedFullName !== editingUser.fullName) {
             const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', editingUser.id));
             const snapshot = await getDocs(classesQuery);
             snapshot.forEach(classDoc => {
                 batch.update(classDoc.ref, { teacherName: updatedFullName });
             });
        }

        await batch.commit();
        toast.success(`User updated successfully.`, { id: updateToast });
        setEditingUser(null);
    } catch (err: any) {
        console.error('Error updating user:', err);
        toast.error(`Failed to update user: ${err.message}.`, { id: updateToast });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleDeleteClick = (user: UserData) => {
    if (user.role === 'admin') {
        toast.error("Admins cannot be deleted from the user interface for security reasons.");
        return;
    }
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsConfirmOpen(false);
    setIsDeleting(userToDelete.id);
    const deletionToast = toast.loading(`Deleting ${userToDelete.fullName}...`);

    try {
        const batch = writeBatch(db);

        // If user is a teacher, unassign them from any classes
        if (userToDelete.role === 'teacher') {
            const teacherClassesQuery = query(collection(db, 'classes'), where('teacherId', '==', userToDelete.id));
            const classesSnapshot = await getDocs(teacherClassesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { teacherId: '', teacherName: 'Unassigned' });
            });
        }

        // If user is a student, remove them from any classes they are enrolled in
        if (userToDelete.role === 'student') {
            const studentClassesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', userToDelete.id));
            const classesSnapshot = await getDocs(studentClassesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { studentIds: arrayRemove(userToDelete.id) });
            });
        }
        
        // Delete the user document itself.
        const userDocRef = doc(db, 'users', userToDelete.id);
        batch.delete(userDocRef);
        
        await batch.commit();
        toast.success(`User data for ${userToDelete.fullName} deleted successfully.`, { id: deletionToast });

    } catch (err: any) {
        console.error("Error deleting user:", err);
        toast.error(`Failed to delete user: ${err.message || 'Please check permissions.'}`, { id: deletionToast });
    } finally {
        setIsDeleting(null);
        setUserToDelete(null);
    }
  };

  if (isLoadingUsers) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8 bg-background">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <div className="h-6 w-40 bg-muted/40 rounded-md animate-pulse"></div>
            <div className="h-6 w-32 bg-muted/40 rounded-md animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-72 bg-muted/40 rounded-md animate-pulse"></div>
            <div className="h-12 w-36 bg-muted/40 rounded-lg animate-pulse"></div>
          </div>

          <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <div className="h-8 w-40 bg-muted/40 rounded-md animate-pulse mb-4"></div>
            <div className="space-y-3">
              <SkeletonListRow />
              <SkeletonListRow />
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          </div>
        </div>
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
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
            </button>
        </div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-foreground">User Management</h1>
            <Link href="/admin/users/create">
                <button className="flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                    <UserPlus className="w-5 h-5" />
                    <span>Create User</span>
                </button>
            </Link>
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">All Users</h2>
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
                  <div className="flex justify-end items-center gap-2">
                    <button
                        onClick={() => handleEditClick(user)}
                        disabled={user.role === 'admin'}
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Edit ${user.fullName}`}
                    >
                        <Pencil size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(user)}
                        disabled={isDeleting === user.id || user.role === 'admin'}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-scale">
          <div className="bg-background/80 border border-secondary/30 p-8 rounded-2xl shadow-2xl shadow-primary/10 w-full max-w-md m-4">
            <h2 className="text-2xl font-bold text-foreground mb-1">Edit User</h2>
            <p className="text-muted-foreground mb-6">Editing profile for <span className="font-semibold text-secondary">{editingUser.fullName}</span></p>
            
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={updatedFullName}
                  onChange={(e) => setUpdatedFullName(e.target.value)}
                  className="w-full px-4 py-2 bg-background/50 text-foreground placeholder-gray-400 border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-2">Role</label>
                <select
                  id="role"
                  value={updatedRole}
                  onChange={(e) => setUpdatedRole(e.target.value)}
                  className="w-full appearance-none px-4 py-2 bg-background/50 text-foreground border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2 font-semibold text-muted-foreground bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[150px] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                      <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving...</span>
                      </>
                  ) : (
                      'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
    )}

    <ConfirmDialog
        open={isConfirmOpen}
        title={`Delete ${userToDelete?.fullName || 'User'}`}
        description="Are you sure you want to delete this user's application data? This includes class enrollments. Note: This does not delete their login account."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete User"
        isLoading={isDeleting === userToDelete?.id}
    />
    </main>
  );
}
