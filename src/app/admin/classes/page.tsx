'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ChevronRight, UserPlus } from 'lucide-react';

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
  const isLoading = useAuthGuard('admin');
  const db = useFirestore();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);

  // Fetch Teachers
  useEffect(() => {
    if (!isLoading) {
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
            setError("Could not load teachers. Please check permissions and try again.");
        } finally {
            setIsLoadingTeachers(false);
        }
      };
      fetchTeachers();
    }
  }, [isLoading, db]);

  // Fetch Classes
  useEffect(() => {
    if (!isLoading) {
      const q = query(collection(db, 'classes'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const classesData: ClassData[] = [];
        querySnapshot.forEach((doc) => {
          classesData.push({ id: doc.id, ...doc.data() } as ClassData);
        });
        setClasses(classesData);
      }, (err) => {
        console.error("Error fetching classes:", err);
        setError("Failed to fetch classes. Check permissions.");
      });

      return () => unsubscribe();
    }
  }, [isLoading, db]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim() === '' || !selectedTeacherId) {
      setError('Class name and teacher are required.');
      return;
    }
    setError(null);

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
    if (!selectedTeacher) {
      setError('Selected teacher not found.');
      return;
    }

    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
        teacherId: selectedTeacher.id,
        teacherName: selectedTeacher.fullName,
        createdAt: serverTimestamp(),
      });
      setNewClassName('');
    } catch (err) {
      console.error('Error adding class:', err);
      setError('Failed to add class. Check permissions.');
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
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
                  className="px-6 py-2 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                >
                  Add Class
                </button>
            </form>
          ) : (
            <div className="text-center p-4 border-2 border-dashed border-muted/30 rounded-lg">
                <p className="text-muted-foreground mb-4">You must create at least one teacher before you can create a class.</p>
                <Link href="/admin/users/create">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                        <UserPlus className="w-5 h-5" />
                        <span>Create Teacher</span>
                    </button>
                </Link>
            </div>
          )}
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
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
                  <Link href={`/admin/classes/${c.id}`}>
                    <div className="flex items-center text-secondary hover:text-primary cursor-pointer">
                      <span>Manage Students</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No classes found. Add one above to get started.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
