'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useFirestore, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { ChevronRight, UserPlus, ArrowLeft, Trash2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface TeacherData {
  id: string;
  fullName: string;
}

export default function AdminClassesPage() {
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [classToDelete, setClassToDelete] = useState<ClassData | null>(null);
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

  // Fetch Teachers
  useEffect(() => {
    setIsLoadingTeachers(true);
    const fetchTeachers = async () => {
      try {
          const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
          const querySnapshot = await getDocs(teachersQuery);
          const teachersData: TeacherData[] = [];
          querySnapshot.forEach((doc) => {
            teachersData.push({ id: doc.id, fullName: doc.data().fullName });
          });
          setTeachers(teachersData);
          if (teachersData.length > 0) {
            setSelectedTeacherId(teachersData[0].id);
          }
      } catch (e) {
          console.error("Failed to fetch teachers:", e);
          toast.error("Could not load teachers. Please check permissions and try again.");
      } finally {
          setIsLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, [db]);

  // Fetch Classes
  useEffect(() => {
    setIsLoadingClasses(true);
    const q = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classesData: ClassData[] = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() } as ClassData);
      });
      setClasses(classesData);
      setIsLoadingClasses(false);
    }, (err) => {
      console.error("Error fetching classes:", err);
      toast.error("Failed to fetch classes. Check permissions.");
      setIsLoadingClasses(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim() === '' || !selectedTeacherId) {
      toast.error('Class name and teacher are required.');
      return;
    }

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
    if (!selectedTeacher) {
      toast.error('Selected teacher not found.');
      return;
    }

    setIsAddingClass(true);
    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: selectedTeacher.id,
        teacherName: selectedTeacher.fullName,
        createdAt: serverTimestamp(),
      });
      setNewClassName('');
      toast.success(`Class "${newClassName}" created.`);
    } catch (err) {
      console.error('Error adding class:', err);
      toast.error('Failed to add class. Check permissions.');
    } finally {
      setIsAddingClass(false);
    }
  };

  const handleDeleteClick = (classData: ClassData) => {
    setClassToDelete(classData);
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setClassToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;

    setIsConfirmOpen(false);
    setIsDeleting(classToDelete.id);
    const deletionToast = toast.loading(`Deleting class "${classToDelete.name}"...`);

    try {
        await deleteDoc(doc(db, 'classes', classToDelete.id));
        toast.success(`Class "${classToDelete.name}" deleted successfully.`, { id: deletionToast });
        // Note: This does not delete associated attendance records, which will be orphaned.
    } catch (err) {
        console.error("Error deleting class:", err);
        toast.error('Failed to delete class.', { id: deletionToast });
    } finally {
        setIsDeleting(null);
        setClassToDelete(null);
    }
  };

  if (isLoadingTeachers || isLoadingClasses) {
    const SkeletonClassRow = () => (
      <div className="p-4 bg-background/30 border border-muted/20 rounded-lg flex justify-between items-center animate-pulse">
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    );

    return (
      <main className="flex min-h-screen flex-col items-center p-8 bg-background">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-64 mb-8" />

          <div className="mb-8 p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg animate-pulse">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex flex-col gap-4">
              <div className='flex flex-col sm:flex-row gap-4'>
                <Skeleton className="h-10 flex-grow" />
                <Skeleton className="h-10 flex-grow" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <Skeleton className="h-8 w-56 mb-4" />
            <div className="space-y-4">
              <SkeletonClassRow />
              <SkeletonClassRow />
              <SkeletonClassRow />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Manage Classes</h1>

        <div className="mb-8 p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Add New Class</h2>
          
          {isLoadingTeachers ? (
            <p className="text-muted-foreground">Loading available teachers...</p>
          ) : teachers.length > 0 ? (
            <form onSubmit={handleAddClass} className="flex flex-col gap-4">
                <div className='flex flex-col sm:flex-row gap-4'>
                    <input
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Enter class name"
                      className="flex-grow px-4 py-2 bg-background/50 text-foreground placeholder-gray-400 border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <select
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="flex-grow px-4 py-2 appearance-none bg-background/50 text-foreground border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                        {teachers.map(teacher => (
                            <option key={teacher.id} value={teacher.id}>{teacher.fullName}</option>
                        ))}
                    </select>
                </div>
                <button
                  type="submit"
                  disabled={isAddingClass}
                  className="px-6 py-2 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAddingClass ? (
                      <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Adding...</span>
                      </>
                  ) : (
                      'Add Class'
                  )}
                </button>
            </form>
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-4">You must create at least one teacher before you can create a class.</p>
                <Link href="/admin/users/create">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background active:scale-95 transition-transform">
                        <UserPlus className="w-5 h-5" />
                        <span>Create Teacher</span>
                    </button>
                </Link>
            </div>
          )}
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Existing Classes</h2>
          <div className="space-y-4">
            {classes.length > 0 ? (
              classes.map((c) => (
                <div key={c.id} className="p-4 bg-background/30 border border-muted/20 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-lg text-foreground/90 font-semibold">{c.name}</p>
                    <p className="text-sm text-muted-foreground">Teacher: {c.teacherName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/admin/classes/${c.id}`}>
                      <div className="flex items-center text-secondary hover:text-primary cursor-pointer">
                        <span>Manage Students</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(c)}
                      disabled={isDeleting === c.id}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                      aria-label={`Delete class ${c.name}`}
                    >
                      {isDeleting === c.id ? <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No classes found. Add one above to get started.</p>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        title={`Delete Class: ${classToDelete?.name || ''}`}
        description="Are you sure you want to delete this class? All student enrollments for this class will be removed. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete Class"
        isLoading={isDeleting === classToDelete?.id}
      />
    </main>
  );
}
