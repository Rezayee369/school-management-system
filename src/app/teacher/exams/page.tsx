'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Calendar as CalendarIcon, FilePenLine } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';

interface ClassData {
  id: string;
  name: string;
}

export default function TeacherExamsPage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('monthly');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Fetch teacher's classes
  useEffect(() => {
    if (!isAuthorized || !user) return;
    
    setIsLoadingClasses(true);
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(classesData);
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      setIsLoadingClasses(false);
    }, (err) => {
        toast.error("Failed to load classes.");
        console.error(err);
        setIsLoadingClasses(false);
    });

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subject.trim() || !maxScore || !date || !user) {
      toast.error('Please fill out all required fields.');
      return;
    }

    const score = parseInt(maxScore);
    if (isNaN(score) || score <= 0) {
        toast.error('Max score must be a positive number.');
        return;
    }

    setIsSaving(true);
    const dateString = format(date, 'yyyy-MM-dd');

    try {
        // Prevent duplicates by querying for an existing exam
        const q = query(collection(db, 'exams'), 
            where('classId', '==', selectedClassId),
            where('subject', '==', subject.trim()),
            where('date', '==', dateString),
            where('type', '==', examType)
        );
        const existingExams = await getDocs(q);
        if (!existingExams.empty) {
            toast.error('An exam with the same details already exists.');
            setIsSaving(false);
            return;
        }

        await addDoc(collection(db, 'exams'), {
            classId: selectedClassId,
            teacherId: user.uid,
            subject: subject.trim(),
            type: examType,
            maxScore: score,
            date: dateString,
            createdAt: serverTimestamp(),
        });
        
        toast.success(`Exam "${subject.trim()}" created successfully!`);
        // Reset form
        setSubject('');
        setMaxScore('100');
        setExamType('monthly');

    } catch (error) {
        toast.error('Failed to create exam.');
        console.error(error);
    } finally {
        setIsSaving(false);
    }
  };


  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-3xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Create New Exam</h1>
        
        <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
          
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-muted-foreground mb-2">Class</label>
            <select
              id="class-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={isLoadingClasses || classes.length === 0}
              className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              {isLoadingClasses ? (
                <option>Loading classes...</option>
              ) : classes.length > 0 ? (
                classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
              ) : (
                <option>No classes assigned to you</option>
              )}
            </select>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-2">Subject</label>
                <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics"
                    className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                />
            </div>
            <div>
              <label htmlFor="exam-type" className="block text-sm font-medium text-muted-foreground mb-2">Exam Type</label>
              <select
                id="exam-type"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="monthly">Monthly</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="max-score" className="block text-sm font-medium text-muted-foreground mb-2">Max Score</label>
                <input
                    id="max-score"
                    type="number"
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Exam Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal py-3 h-auto",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving || classes.length === 0}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                 <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                 </>
              ) : (
                <>
                    <FilePenLine className="w-5 h-5" />
                    <span>Save Exam</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
