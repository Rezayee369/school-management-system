
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { collection, query, onSnapshot, orderBy, doc, writeBatch, where, getDocs, getDoc, arrayRemove, deleteField } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { UserPlus, Users, Briefcase, UserCircle, Trash2, Pencil, GraduationCap, Shield, HardHat } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { SkeletonListRow } from '@/components/Skeleton';
import { useTranslation } from '@/i18n';
import BackButton from '@/components/BackButton';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  studentIds?: string[];
}

export default function AdminUsersPage() {
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get('role') || 'all';
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedFullName, setUpdatedFullName] = useState('');
  const [updatedRole, setUpdatedRole] = useState('');
  
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [allStudents, setAllStudents] = useState<UserData[]>([]);
  const [linkedStudentIds, setLinkedStudentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsLoadingUsers(true);
    let q;
    const usersCollection = collection(db, 'users');
    
    if (filter === 'all') {
      q = query(usersCollection, orderBy('createdAt', 'desc'));
    } else {
      q = query(usersCollection, where('role', '==', filter), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        // Fetch all data including studentIds for potential editing
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
  }, [db, filter]);

  const handleEditClick = async (user: UserData) => {
    if (user.role === 'admin') {
      toast.error("Admin users cannot be edited from this interface for security reasons.");
      return;
    }
    
    setEditingUser(user);
    setUpdatedFullName(user.fullName);
    setUpdatedRole(user.role);
    setLinkedStudentIds(new Set(user.studentIds || [])); // Use pre-fetched data

    if (user.role === 'parent' || updatedRole === 'parent') {
        // Fetch student list only if it's not already loaded
        if (allStudents.length === 0) {
            const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
            const querySnapshot = await getDocs(studentsQuery);
            setAllStudents(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserData)));
        }
    }
  };

  const handleStudentLinkToggle = (studentId: string) => {
    setLinkedStudentIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(studentId)) {
            newSet.delete(studentId);
        } else {
            newSet.add(studentId);
        }
        return newSet;
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsUpdating(true);
    const updateToast = toast.loading('Updating user...');

    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', editingUser.id);
        
        const newUserData: { [key: string]: any } = {
            fullName: updatedFullName,
            role: updatedRole,
        };

        if (updatedRole === 'parent') {
            newUserData.studentIds = Array.from(linkedStudentIds);
        } else if (editingUser.role === 'parent' && updatedRole !== 'parent') {
            newUserData.studentIds = deleteField();
        }

        batch.update(userDocRef, newUserData);

        if (editingUser.role === 'teacher' && updatedRole !== 'teacher') {
            const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', editingUser.id));
            const snapshot = await getDocs(classesQuery);
            snapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { teacherId: '', teacherName: 'Unassigned' });
            });
        }
        
        if (editingUser.role === 'student' && updatedRole !== 'student') {
            const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', editingUser.id));
            const snapshot = await getDocs(classesQuery);
            snapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { studentIds: arrayRemove(editingUser.id) });
            });
        }

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

        if (userToDelete.role === 'teacher') {
            const teacherClassesQuery = query(collection(db, 'classes'), where('teacherId', '==', userToDelete.id));
            const classesSnapshot = await getDocs(teacherClassesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { teacherId: '', teacherName: 'Unassigned' });
            });
        }

        if (userToDelete.role === 'student') {
            const studentClassesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', userToDelete.id));
            const classesSnapshot = await getDocs(studentClassesQuery);
            classesSnapshot.forEach(classDoc => {
                batch.update(classDoc.ref, { studentIds: arrayRemove(userToDelete.id) });
            });
        }
        
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5 text-destructive" />;
      case 'teacher': return <Briefcase className="w-5 h-5 text-primary" />;
      case 'student': return <GraduationCap className="w-5 h-5 text-accent" />;
      case 'parent': return <UserCircle className="w-5 h-5 text-green-400" />;
      case 'staff': return <HardHat className="w-5 h-5 text-secondary" />;
      default: return <UserCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRoleName = (role: string) => {
    const roleKey = `adminUsers.${role.toLowerCase()}`;
    const translatedRole = t(roleKey);
    if (translatedRole === roleKey) {
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
    return translatedRole;
  };
  
  const getPageTitle = () => {
    if (filter === 'all' || !filter) {
      return t('adminUsers.userManagement');
    }
    const roleName = getRoleName(filter);
    return t('adminUsers.filteredUserManagement', { role: roleName });
  };
  
  const filterOptions = [
    { role: 'all', icon: Users, label: t('adminUsers.all') },
    { role: 'student', icon: GraduationCap, label: t('adminUsers.student') },
    { role: 'teacher', icon: Briefcase, label: t('adminUsers.teacher') },
    { role: 'parent', icon: UserCircle, label: t('adminUsers.parent') },
    { role: 'staff', icon: HardHat, label: t('adminUsers.staff') },
  ];

  const handleFilterClick = (role: string) => {
    const href = role === 'all' ? '/admin/users' : `/admin/users?role=${role}`;
    router.push(href);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
            <BackButton />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-4xl font-bold text-foreground">{getPageTitle()}</h1>
            <Link href="/admin/users/create">
                <button className="flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                    <UserPlus className="w-5 h-5" />
                    <span>{t('adminUsers.createUser')}</span>
                </button>
            </Link>
        </div>
        
        <div className="mb-6 flex flex-wrap items-center gap-2">
            {filterOptions.map(({ role, icon: Icon, label }) => (
            <button
                key={role}
                onClick={() => handleFilterClick(role)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                filter === role
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-background/50 text-muted-foreground hover:bg-muted/30'
                }`}
            >
                <Icon size={16} />
                <span>{label}</span>
            </button>
            ))}
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {filter === 'all' ? t('adminUsers.allUsers') : `${getRoleName(filter)}`} ({users.length})
          </h2>
          <div className="space-y-3">
            {isLoadingUsers ? (
                <>
                    <SkeletonListRow />
                    <SkeletonListRow />
                    <SkeletonListRow />
                </>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="p-4 bg-background/50 border border-muted/20 rounded-lg transition-all hover:border-primary/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1 mb-2 sm:mb-0">
                          <p className="font-medium text-foreground/90">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center justify-between w-full sm:w-auto sm:gap-4">
                          <div className="flex items-center gap-2">
                              {getRoleIcon(user.role)}
                              <span className="text-sm font-semibold capitalize">{getRoleName(user.role)}</span>
                          </div>
                          <div className="flex items-center gap-2">
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
                                  className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Delete ${user.fullName}`}
                              >
                                  {isDeleting === user.id ? <div className="w-5 h-5 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={18} />}
                              </button>
                          </div>
                      </div>
                  </div>
                </div>
              ))
            ) : (
                <div className="text-center py-16">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{t('adminUsers.noUsersFound')}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{t('adminUsers.getStarted')}</p>
                    <div className="mt-6">
                        <Link href="/admin/users/create">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                                <UserPlus className="w-5 h-5" />
                                <span>{t('adminUsers.createUser')}</span>
                            </button>
                        </Link>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-scale">
          <div className="bg-background/80 border border-border p-8 rounded-2xl shadow-2xl shadow-primary/10 w-full max-w-lg m-4">
            <h2 className="text-2xl font-bold text-foreground mb-1">{t('adminUsers.editUser')}</h2>
            <p className="text-muted-foreground mb-6">{t('adminUsers.editingProfileFor')} <span className="font-semibold text-secondary">{editingUser.fullName}</span></p>
            
            <form onSubmit={handleUpdateUser} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-muted-foreground mb-2">{t('adminUsers.fullName')}</label>
                <input
                  id="fullName"
                  type="text"
                  value={updatedFullName}
                  onChange={(e) => setUpdatedFullName(e.target.value)}
                  className="w-full px-4 py-2 bg-background/50 text-foreground placeholder-muted-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-muted-foreground mb-2">{t('adminUsers.role')}</label>
                <select
                  id="role"
                  value={updatedRole}
                  onChange={(e) => setUpdatedRole(e.target.value)}
                  className="w-full appearance-none px-4 py-2 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="student">{t('adminUsers.student')}</option>
                  <option value="teacher">{t('adminUsers.teacher')}</option>
                  <option value="parent">{t('adminUsers.parent')}</option>
                </select>
              </div>

              {updatedRole === 'parent' && (
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Linked Students</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-background/70 border border-input rounded-md">
                        {allStudents.length > 0 ? allStudents.map(student => (
                            <div key={student.id} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id={`student-${student.id}`}
                                    checked={linkedStudentIds.has(student.id)}
                                    onChange={() => handleStudentLinkToggle(student.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                                <label htmlFor={`student-${student.id}`} className="text-sm text-foreground cursor-pointer">
                                    {student.fullName}
                                </label>
                            </div>
                        )) : <p className="text-sm text-muted-foreground">No students available to link.</p>}
                    </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2 font-semibold text-muted-foreground bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {t('adminUsers.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-2 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[150px] disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                      <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{t('adminUsers.saving')}</span>
                      </>
                  ) : (
                      t('adminUsers.saveChanges')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
    )}

    <ConfirmDialog
        open={isConfirmOpen}
        title={t('adminUsers.deleteUserTitle', { user: userToDelete?.fullName || 'User' })}
        description={t('adminUsers.deleteUserDesc')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText={t('adminUsers.deleteUserConfirm')}
        isLoading={isDeleting === userToDelete?.id}
    />
    </main>
  );
}
