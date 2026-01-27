
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, getDoc, documentId, getDocs, serverTimestamp } from 'firebase/firestore';
import { ClipboardEdit, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import BackButton from '@/components/BackButton';
import { Skeleton } from '@/components/Skeleton';
import { useTranslation } from '@/i18n';

// Interfaces
interface ExamData {
  id: string;
  subject: string;
  classId: string;
  teacherId: string;
  maxScore: number;
}

interface StudentData {
  id: string;
  fullName: string;
}

interface ExamGrade {
    score: number;
}

export default function GradeEntryPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const examId = params.examId as string;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [scores, setScores] = useState<Map<string, string>>(new Map());
  const [submittedGrades, setSubmittedGrades] = useState<Map<string, number>>(new Map());
  const [isSaving, setIsSaving] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch exam, class, and student data
  useEffect(() => {
    if (!user || !db || !examId) return;

    const examDocRef = doc(db, 'exams', examId);
    const unsubscribeExam = onSnapshot(examDocRef, async (examSnap) => {
      if (examSnap.exists()) {
        const exam = { id: examSnap.id, ...examSnap.data() } as ExamData;
        
        // Authorization check
        if (exam.teacherId !== user.uid) {
            toast.error(t('teacherExamGrades.authError'));
            router.push('/teacher');
            return;
        }
        setExamData(exam);

        // Fetch students for the class
        const classDocRef = doc(db, 'classes', exam.classId);
        const classSnap = await getDoc(classDocRef);
        if (classSnap.exists()) {
            const studentIds = classSnap.data()?.studentIds || [];
            if (studentIds.length > 0) {
                const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
                const studentsSnap = await getDocs(studentsQuery);
                const studentData = studentsSnap.docs.map(d => ({ id: d.id, fullName: d.data().fullName } as StudentData));
                setStudents(studentData);
            }
        }
        setIsLoading(false);
      } else {
        toast.error(t('teacherExamGrades.examNotFound'));
        router.push('/teacher/exams');
        setIsLoading(false);
      }
    });

    return () => unsubscribeExam();
  }, [user, db, examId, router, t]);
  
  // Fetch existing grades for this exam
  useEffect(() => {
      if (!examId || !db) return;
      const gradesQuery = query(collection(db, 'examGrades'), where('examId', '==', examId));
      const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
          const newSubmitted = new Map<string, number>();
          snapshot.forEach(doc => {
              newSubmitted.set(doc.data().studentId, doc.data().score);
          });
          setSubmittedGrades(newSubmitted);
      });
      return () => unsubscribeGrades();
  }, [examId, db]);


  const handleScoreChange = (studentId: string, value: string) => {
    const updatedScores = new Map(scores);
    updatedScores.set(studentId, value);
    setScores(updatedScores);
  };

  const handleSaveGrade = async (student: StudentData) => {
    if (!examData || !user) return;
    
    // Check if already submitted
    if (submittedGrades.has(student.id)) {
        toast.error(t('teacherExamGrades.alreadySubmittedError'));
        return;
    }
    
    const scoreStr = scores.get(student.id) || '';
    const score = parseFloat(scoreStr);

    if (scoreStr === '' || isNaN(score) || score < 0 || score > examData.maxScore) {
      toast.error(t('teacherExamGrades.scoreRangeError', { maxScore: String(examData.maxScore) }));
      return;
    }

    setIsSaving(prev => new Set(prev).add(student.id));

    try {
      const gradeId = `${examData.id}_${student.id}`;
      const gradeRef = doc(db, 'examGrades', gradeId);

      await setDoc(gradeRef, {
        examId: examData.id,
        classId: examData.classId,
        studentId: student.id,
        studentName: student.fullName,
        teacherId: user.uid,
        score,
        maxScore: examData.maxScore,
        submittedAt: serverTimestamp(),
      });

      toast.success(t('teacherExamGrades.saveSuccess', { name: student.fullName }));
    } catch (e) {
      console.error(e);
      toast.error(t('teacherExamGrades.saveError'));
    } finally {
      setIsSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };
  
  if (isLoading || isLoadingAuth) {
    return (
        <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
            <div className="w-full max-w-4xl">
                <Skeleton className="h-6 w-24 mb-8" />
                <Skeleton className="h-10 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2 mb-8" />
                <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-4">
                    {[...Array(3)].map((_, i) => (
                         <div key={i} className="p-4 border bg-background/50 border-muted/20 rounded-lg flex items-center justify-between gap-4">
                             <Skeleton className="h-6 w-48" />
                             <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-24" />
                                <Skeleton className="h-10 w-10" />
                             </div>
                         </div>
                    ))}
                </div>
            </div>
        </main>
    );
  }

  if (!isAuthorized) return <PermissionDenied />;
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <div className="mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{t('teacherExamGrades.title')}</h1>
        <p className="text-muted-foreground mb-8">
            {t('teacherExamGrades.subtitle', { subject: examData?.subject || '', maxScore: String(examData?.maxScore) })}
        </p>

        {examData ? (
          <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardEdit className="w-7 h-7 text-secondary" />
              <h2 className="text-2xl font-semibold text-foreground">{t('teacherExamGrades.studentScores')}</h2>
            </div>
            
            <div className="space-y-4">
              {students.length > 0 ? students.map(student => {
                  const isSubmitted = submittedGrades.has(student.id);
                  const submittedScore = submittedGrades.get(student.id);

                  return (
                    <div key={student.id} className="p-4 border bg-background/50 border-muted/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-lg text-foreground/90 font-medium w-full md:w-1/3">{student.fullName}</p>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <input
                                type="number"
                                min="0"
                                max={examData.maxScore}
                                value={isSubmitted ? submittedScore : scores.get(student.id) ?? ''}
                                onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                placeholder={`0 - ${examData.maxScore}`}
                                disabled={isSubmitted || isSaving.has(student.id)}
                                className="w-full px-3 py-2 bg-background/70 text-foreground border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted/30 disabled:cursor-not-allowed"
                            />
                            <button
                                onClick={() => handleSaveGrade(student)}
                                disabled={isSaving.has(student.id) || isSubmitted}
                                className="p-2.5 text-primary-foreground bg-primary rounded-md transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90"
                                aria-label={t('teacherExamGrades.saveGradeFor', { name: student.fullName })}
                            >
                                {isSaving.has(student.id) ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                  )
              }) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <h3 className="mt-4 text-md font-semibold text-foreground">{t('teacherExamGrades.noStudentsTitle')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t('teacherExamGrades.noStudentsDesc')}</p>
                </div>
              )}
            </div>
          </div>
        ) : !isLoading && (
          <div className="p-6 bg-background/60 backdrop-blur-sm border border-destructive/30 rounded-xl shadow-lg text-center">
            <p className="text-destructive-foreground">{t('teacherExamGrades.loadError')}</p>
          </div>
        )}
      </div>
    </main>
  );
}
