
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, deleteDoc, orderBy, documentId } from 'firebase/firestore';
import { Calendar as CalendarIcon, FilePenLine, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useTranslation } from '@/i18n';

interface ClassData {
  id: string;
  name: string;
}

interface ExamData {
  id: string;
  subject: string;
  type: string;
  date: string;
  classId: string;
  className?: string; // Will populate this
}

export default function TeacherExamsPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();
  const { t } = useTranslation();

  // State for form
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [examType, setExamType] = useState('monthly');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // State for exam list
  const [exams, setExams] = useState<ExamData[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [examToDelete, setExamToDelete] = useState<ExamData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  // Fetch teacher's classes for the form dropdown
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
    }, () => setIsLoadingClasses(false));

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  // Fetch created exams for the list
  useEffect(() => {
    if(!isAuthorized || !user) return;

    setIsLoadingExams(true);
    const examsQuery = query(collection(db, 'exams'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(examsQuery, async (snapshot) => {
        const examsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data() as Omit<ExamData, 'id'|'className'>}));

        // Enrich with class names
        const classIds = [...new Set(examsData.map(e => e.classId))];
        if (classIds.length > 0) {
            const classesQuery = query(collection(db, 'classes'), where(documentId(), 'in', classIds));
            const classesSnap = await getDocs(classesQuery);
            const classMap = new Map(classesSnap.docs.map(d => [d.id, d.data().name]));
            examsData.forEach(exam => {
                (exam as ExamData).className = classMap.get(exam.classId) || t('teacherExams.unknownClass');
            });
        }
        
        setExams(examsData as ExamData[]);
        setIsLoadingExams(false);
    }, () => setIsLoadingExams(false));

    return () => unsubscribe();
  }, [isAuthorized, user, db, t]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !subject.trim() || !maxScore || !date || !user) {
      toast.error(t('teacherExams.formRequiredError'));
      return;
    }
    const score = parseInt(maxScore);
    if (isNaN(score) || score <= 0) {
      toast.error(t('teacherExams.maxScoreError'));
      return;
    }
    setIsSaving(true);
    
    try {
      await addDoc(collection(db, 'exams'), {
        classId: selectedClassId,
        teacherId: user.uid,
        subject: subject.trim(),
        type: examType,
        maxScore: score,
        date: format(date, 'yyyy-MM-dd'),
        createdAt: serverTimestamp(),
      });
      toast.success(t('teacherExams.createSuccess'));
      setSubject(''); setMaxScore('100'); setExamType('monthly');
    } catch (error) {
      toast.error(t('teacherExams.createError'));
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, 'exams', examToDelete.id));
        // Note: This does not delete associated grades. A more robust system might use a cloud function.
        toast.success(t('teacherExams.deleteSuccess', { subject: examToDelete.subject }));
    } catch (e) {
        toast.error(t('teacherExams.deleteError'));
    } finally {
        setIsDeleting(false);
        setExamToDelete(null);
    }
  }


  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) return <PermissionDenied />;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-4xl animate-fade-in-slide-up space-y-12">
        <div>
            <div className="flex justify-between items-center mb-8">
            <BackButton />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-8">{t('teacherExams.title')}</h1>
            
            <form onSubmit={handleSubmit} className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-muted-foreground mb-2">{t('teacherExams.classLabel')}</label>
                        <select id="class-select" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} disabled={isLoadingClasses || classes.length === 0} className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
                        {isLoadingClasses ? <option>{t('teacherExams.loading')}</option> : classes.length > 0 ? classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>{t('teacherExams.noClasses')}</option>}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground mb-2">{t('teacherExams.subjectLabel')}</label>
                        <input id="subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('teacherExams.subjectPlaceholder')} className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="exam-type" className="block text-sm font-medium text-muted-foreground mb-2">{t('teacherExams.typeLabel')}</label>
                        <select id="exam-type" value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            <option value="monthly">{t('teacherExams.typeMonthly')}</option> <option value="midterm">{t('teacherExams.typeMidterm')}</option> <option value="final">{t('teacherExams.typeFinal')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="max-score" className="block text-sm font-medium text-muted-foreground mb-2">{t('teacherExams.maxScoreLabel')}</label>
                        <input id="max-score" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="e.g., 100" className="w-full px-4 py-3 bg-background/50 text-foreground placeholder-muted-foreground/50 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">{t('teacherExams.dateLabel')}</label>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal py-3 h-auto", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>{t('teacherExams.pickDate')}</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={isSaving || classes.length === 0} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-lg bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold tracking-wider uppercase hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>{t('teacherExams.saving')}</span></> : <><FilePenLine className="w-5 h-5" /><span>{t('teacherExams.createButton')}</span></>}
                    </button>
                </div>
            </form>
        </div>

        <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">{t('teacherExams.scheduledExamsTitle')}</h2>
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                <div className="space-y-4">
                    {isLoadingExams ? <p className="text-center text-muted-foreground">{t('teacherExams.loadingExams')}</p> : exams.length > 0 ? exams.map(exam => (
                        <div key={exam.id} className="p-4 bg-background/30 border border-muted/20 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                            <div>
                                <p className="text-lg text-foreground/90 font-semibold">{exam.subject} <span className="text-sm text-muted-foreground capitalize">({exam.type})</span></p>
                                <p className="text-sm text-muted-foreground">{exam.className} &bull; {format(new Date(exam.date.replace(/-/g, '/')), 'MMMM d, yyyy')}</p>
                            </div>
                            <div className="flex w-full sm:w-auto justify-end items-center gap-4">
                                <Link href={`/teacher/exams/${exam.id}`}>
                                <div className="flex items-center text-primary hover:text-primary/80 cursor-pointer">
                                    <span>{t('teacherExams.enterGradesLink')}</span>
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                                </Link>
                                <button onClick={() => setExamToDelete(exam)} disabled={isDeleting} className="p-2 text-destructive hover:bg-destructive/10 rounded-full transition-colors active:scale-95 disabled:opacity-50">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-muted-foreground py-8">{t('teacherExams.noExamsCreated')}</p>
                    )}
                </div>
            </div>
        </div>

      </div>
      <ConfirmDialog open={!!examToDelete} onCancel={() => setExamToDelete(null)} onConfirm={handleDeleteExam} isLoading={isDeleting} title={t('teacherExams.deleteTitle', { subject: examToDelete?.subject || '' })} description={t('teacherExams.deleteDesc')} confirmText={t('teacherExams.deleteConfirm')} />
    </main>
  );
}
