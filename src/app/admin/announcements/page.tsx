
'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import BackButton from '@/components/BackButton';
import { Megaphone, Users, BookOpen, User, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';

// Interfaces
interface ClassData {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  fullName: string;
}

type TargetType = 'all_parents' | 'class' | 'student';

export default function AdminAnnouncementsPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('admin');
  const db = useFirestore();

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('all_parents');
  const [targetId, setTargetId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Data for dropdowns
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch classes and students when target type changes
  useEffect(() => {
    if (!db) return;
    
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        if (targetType === 'class' && classes.length === 0) {
          const classesQuery = query(collection(db, 'classes'), orderBy('name'));
          const snapshot = await getDocs(classesQuery);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
          setClasses(data);
          if (data.length > 0) setTargetId(data[0].id);
        } else if (targetType === 'student' && students.length === 0) {
          const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'), orderBy('fullName'));
          const snapshot = await getDocs(studentsQuery);
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentData));
          setStudents(data);
          if (data.length > 0) setTargetId(data[0].id);
        }
      } catch (error) {
        toast.error("Failed to load target data.");
        console.error(error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchData();
  }, [targetType, db, classes.length, students.length]);

  useEffect(() => {
    if(targetType === 'class' && classes.length > 0) {
        setTargetId(classes[0].id);
    } else if (targetType === 'student' && students.length > 0) {
        setTargetId(students[0].id);
    } else {
        setTargetId('');
    }
  }, [targetType, classes, students]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      return;
    }
    if ((targetType === 'class' || targetType === 'student') && !targetId) {
        toast.error(`Please select a specific ${targetType}.`);
        return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        targetType,
        targetId: targetType === 'all_parents' ? null : targetId,
        createdAt: serverTimestamp(),
      });

      toast.success('Announcement sent successfully!');
      // Reset form
      setTitle('');
      setMessage('');

    } catch (error) {
      toast.error('Failed to send announcement.');
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
  
  const renderTargetSelector = () => {
    if (targetType === 'all_parents') {
        return <p className="text-sm text-muted-foreground mt-2">This will be sent to all parents.</p>;
    }
    
    if (isLoadingData) {
        return <Skeleton className="h-12 w-full mt-2" />;
    }

    if (targetType === 'class') {
      return (
        <select
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          disabled={classes.length === 0}
          className="mt-2 w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        >
          {classes.length > 0 ? (
            classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
          ) : (
            <option>No classes found</option>
          )}
        </select>
      );
    }

    if (targetType === 'student') {
        return (
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            disabled={students.length === 0}
            className="mt-2 w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {students.length > 0 ? (
              students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)
            ) : (
              <option>No students found</option>
            )}
          </select>
        );
      }

    return null;
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-3xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Create Announcement</h1>
        
        <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Parent-Teacher Meeting"
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
              placeholder="Enter the details of the announcement..."
              rows={5}
              className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Target Audience</label>
            <div className="flex items-center justify-around h-[46px] p-1 bg-background/50 border border-input rounded-md">
                <button type="button" onClick={() => setTargetType('all_parents')} className={`w-1/3 py-1.5 text-sm font-semibold rounded flex items-center justify-center gap-2 ${targetType === 'all_parents' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-muted/30'}`}><Users size={16} /> All Parents</button>
                <button type="button" onClick={() => setTargetType('class')} className={`w-1/3 py-1.5 text-sm font-semibold rounded flex items-center justify-center gap-2 ${targetType === 'class' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-muted/30'}`}><BookOpen size={16} /> Class</button>
                <button type="button" onClick={() => setTargetType('student')} className={`w-1/3 py-1.5 text-sm font-semibold rounded flex items-center justify-center gap-2 ${targetType === 'student' ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-muted/30'}`}><User size={16} /> Student</button>
            </div>
            {renderTargetSelector()}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Megaphone className="w-5 h-5" />}
              <span>Send Announcement</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
