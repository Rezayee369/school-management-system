'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ClipboardCheck, Percent, TrendingUp, Users } from 'lucide-react';
import PermissionDenied from '@/components/PermissionDenied';
import { Skeleton } from '@/components/Skeleton';
import BackButton from '@/components/BackButton';
import { useTranslation } from '@/i18n';

// Interfaces
interface ClassData {
  id: string;
  name: string;
}

interface ExamData {
  id: string;
  subject: string;
  type: string;
}

interface GradeData {
  id: string;
  studentName: string;
  score: number;
  maxScore: number;
}

export default function AdminGradesPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('admin');
  const db = useFirestore();
  const { t } = useTranslation();

  // State
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

  // Fetch classes
  useEffect(() => {
    if (!isAuthorized || !db) return;
    
    setIsLoadingClasses(true);
    const classesQuery = query(collection(db, 'classes'), orderBy('name'));
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
      setClasses(classesData);
      if (classesData.length > 0 && !selectedClassId) {
        setSelectedClassId(classesData[0].id);
      }
      setIsLoadingClasses(false);
    }, () => setIsLoadingClasses(false));

    return () => unsubscribe();
  }, [isAuthorized, db]);

  // Fetch exams for the selected class
  useEffect(() => {
    if (!selectedClassId || !db) {
        setExams([]);
        setSelectedExamId('');
        return;
    };
    
    setIsLoadingExams(true);
    const examsQuery = query(collection(db, 'exams'), where('classId', '==', selectedClassId), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(examsQuery, (snapshot) => {
      const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamData));
      setExams(examsData);
      if (examsData.length > 0) {
        setSelectedExamId(examsData[0].id);
      } else {
        setSelectedExamId('');
      }
      setIsLoadingExams(false);
    }, () => setIsLoadingExams(false));
    
    return () => unsubscribe();
  }, [selectedClassId, db]);

  // Fetch grades for the selected exam
  useEffect(() => {
    if (!selectedExamId || !db) {
        setGrades([]);
        return;
    }
    
    setIsLoadingGrades(true);
    const gradesQuery = query(collection(db, 'examGrades'), where('examId', '==', selectedExamId), orderBy('score', 'desc'));
    const unsubscribe = onSnapshot(gradesQuery, (snapshot) => {
      const gradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GradeData));
      setGrades(gradesData);
      setIsLoadingGrades(false);
    }, () => setIsLoadingGrades(false));

    return () => unsubscribe();
  }, [selectedExamId, db]);

  // Calculate average score
  const averageScore = useMemo(() => {
    if (grades.length === 0) return null;
    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const maxScore = grades[0]?.maxScore || 100;
    const average = (totalScore / grades.length);
    const percentage = (average / maxScore) * 100;
    return { average, percentage };
  }, [grades]);
  
  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }
  if (!isAuthorized) {
    return <PermissionDenied />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
      <div className="w-full max-w-5xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
            <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">{t('adminGrades.title')}</h1>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div>
                  <label htmlFor="class-select" className="text-sm font-medium text-muted-foreground">{t('adminGrades.selectClass')}</label>
                  <select
                      id="class-select"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={isLoadingClasses || classes.length === 0}
                      className="mt-1 block w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                      {isLoadingClasses ? (
                          <option>{t('adminGrades.loadingClasses')}</option>
                      ) : classes.length > 0 ? (
                          classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      ) : (
                          <option>{t('adminGrades.noClasses')}</option>
                      )}
                  </select>
              </div>
              <div>
                  <label htmlFor="exam-select" className="text-sm font-medium text-muted-foreground">{t('adminGrades.selectExam')}</label>
                  <select
                      id="exam-select"
                      value={selectedExamId}
                      onChange={(e) => setSelectedExamId(e.target.value)}
                      disabled={isLoadingExams || exams.length === 0}
                      className="mt-1 block w-full appearance-none px-4 py-3 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                      {isLoadingExams ? (
                          <option>{t('adminGrades.loadingExams')}</option>
                      ) : exams.length > 0 ? (
                          exams.map(e => <option key={e.id} value={e.id}>{e.subject} ({e.type})</option>)
                      ) : (
                          <option>{t('adminGrades.noExams')}</option>
                      )}
                  </select>
              </div>
          </div>
          
          <div className="mt-6 border-t border-border pt-6">
            {isLoadingGrades ? (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : grades.length > 0 ? (
                <>
                    <div className="mb-6 p-6 bg-primary/10 border border-primary/30 rounded-xl">
                        <p className="text-sm text-primary flex items-center gap-2">
                            <TrendingUp size={16}/>
                            {t('adminGrades.classAverage')}
                        </p>
                        <p className="text-4xl font-bold text-primary mt-1">
                            {averageScore?.average.toFixed(1)} <span className="text-2xl text-primary/80">/ {grades[0].maxScore}</span>
                        </p>
                        <p className="text-lg font-semibold text-primary/90">
                           ({averageScore?.percentage.toFixed(1)}%)
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-muted/30">
                                <tr>
                                    <th className="p-3 text-sm font-semibold text-muted-foreground">{t('adminGrades.studentName')}</th>
                                    <th className="p-3 text-sm font-semibold text-muted-foreground text-right">{t('adminGrades.score')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map(grade => (
                                    <tr key={grade.id} className="border-b border-muted/20 hover:bg-muted/10">
                                        <td className="p-3 font-medium text-foreground/90">{grade.studentName}</td>
                                        <td className="p-3 text-right font-semibold text-foreground">{grade.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-md font-semibold text-foreground">{t('adminGrades.noGradesTitle')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t('adminGrades.noGradesDesc')}</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}