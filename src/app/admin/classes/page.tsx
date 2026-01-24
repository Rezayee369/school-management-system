'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuthGuard } from '@/hooks/useAuthGuard';

interface ClassData {
  id: string;
  name: string;
}

export default function AdminClassesPage() {
  const isLoading = useAuthGuard('admin');
  const db = useFirestore();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    if (newClassName.trim() === '') {
      setError('Class name cannot be empty.');
      return;
    }
    setError(null);

    try {
      await addDoc(collection(db, 'classes'), {
        name: newClassName,
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
          <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Enter class name"
              className="flex-grow px-4 py-2 bg-background/50 text-foreground placeholder-gray-400 border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-6 py-2 font-semibold text-primary-foreground bg-gradient-to-r from-secondary to-primary rounded-lg shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Add Class
            </button>
          </form>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Existing Classes</h2>
          <div className="space-y-4">
            {classes.length > 0 ? (
              classes.map((c) => (
                <div key={c.id} className="p-4 border border-muted/20 rounded-lg">
                  <p className="text-lg text-foreground/90">{c.name}</p>
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
