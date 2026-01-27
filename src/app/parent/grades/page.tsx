
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import PermissionDenied from '@/components/PermissionDenied';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, onSnapshot, query, where, documentId, getDocs, getDoc, orderBy } from 'firebase/firestore';
import BackButton from '@/components/BackButton';
import { Award, ClipboardList, TrendingUp, Download } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { vazirmatnFont } from '@/lib/vazir-font';


// Interfaces
interface StudentData {
  id: string;
  name: string;
}

interface ExamData {
  id: string;
  subject: string;
  type: string;
  date: string;
  classId: string;
}

interface ExamGradeData {
  examId: string;
  score: number;
  maxScore: number;
  submittedAt: { toDate: () => Date };
}

interface ReportCardItem extends ExamData {
    score: number;
    maxScore: number;
    percentage: number;
}

export default function ParentGradesPage() {
  const { isLoading: isLoadingAuth, isAuthorized } = useAuthGuard('parent');
  const user = useUser();
  const db = useFirestore();

  const [isLoading, setIsLoading] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<StudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [reportCardItems, setReportCardItems] = useState<ReportCardItem[]>([]);
  const [className, setClassName] = useState<string>('');
  const [isLoadingClassName, setIsLoadingClassName] = useState(true);


  // Fetch parent's linked students
  useEffect(() => {
    if (!isAuthorized || !user || !db) {
        if (!isLoadingAuth) setIsLoading(false);
        return;
    }

    const parentRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(parentRef, async (snap) => {
        if (snap.exists()) {
            const studentIds = snap.data()?.studentIds || [];
            if (studentIds.length > 0) {
                const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
                const studentSnaps = await getDocs(studentsQuery);
                const studentsData = studentSnaps.docs.map(d => ({ id: d.id, name: d.data().fullName as string }));
                setLinkedStudents(studentsData);
                if (!selectedStudentId || !studentIds.includes(selectedStudentId)) {
                    setSelectedStudentId(studentsData[0]?.id || null);
                }
            } else {
                setLinkedStudents([]);
                setSelectedStudentId(null);
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, () => setIsLoading(false));

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  // Fetch grades for the selected student
  useEffect(() => {
    if (!selectedStudentId || !db) {
        setReportCardItems([]);
        if (selectedStudentId === null) setIsLoading(false); // Only set loading to false if we know there are no students
        return;
    }
    
    setIsLoading(true);

    const gradesQuery = query(collection(db, 'examGrades'), where('studentId', '==', selectedStudentId), orderBy('submittedAt', 'desc'));
    const unsubscribeGrades = onSnapshot(gradesQuery, async (gradesSnap) => {
        const gradesData = gradesSnap.docs.map(doc => doc.data() as ExamGradeData);
        if (gradesData.length === 0) {
            setReportCardItems([]);
            setIsLoading(false);
            return;
        }

        const examIds = [...new Set(gradesData.map(g => g.examId))];
        const examsQuery = query(collection(db, 'exams'), where(documentId(), 'in', examIds));
        const examsSnap = await getDocs(examsQuery);
        const examsMap = new Map(examsSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as ExamData]));

        const items: ReportCardItem[] = gradesData.map(grade => {
            const exam = examsMap.get(grade.examId);
            if (!exam) return null;
            return {
                ...exam,
                score: grade.score,
                maxScore: grade.maxScore,
                percentage: (grade.score / grade.maxScore) * 100,
            };
        }).filter((item): item is ReportCardItem => item !== null);
        
        setReportCardItems(items);
        setIsLoading(false);

    }, () => {
        setIsLoading(false);
    });

    return () => unsubscribeGrades();
  }, [selectedStudentId, db]);
  
  // Fetch class name for the report card
    useEffect(() => {
        if (reportCardItems.length > 0 && db) {
            setIsLoadingClassName(true);
            const firstClassId = reportCardItems[0].classId;
            if (firstClassId) {
                const classRef = doc(db, 'classes', firstClassId);
                getDoc(classRef).then(docSnap => {
                    if (docSnap.exists()) {
                        setClassName(docSnap.data().name);
                    }
                    setIsLoadingClassName(false);
                }).catch(() => setIsLoadingClassName(false));
            } else {
                setIsLoadingClassName(false);
            }
        } else {
            setClassName('');
            if (reportCardItems.length === 0 && !isLoading) {
                setIsLoadingClassName(false);
            }
        }
    }, [reportCardItems, db, isLoading]);


  const overallAverage = useMemo(() => {
    if (reportCardItems.length === 0) return null;
    const totalPercentage = reportCardItems.reduce((sum, item) => sum + item.percentage, 0);
    return totalPercentage / reportCardItems.length;
  }, [reportCardItems]);
  
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-primary';
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 70) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-destructive';
  };

  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId);

  const handleDownloadPdf = () => {
    if (!selectedStudent || reportCardItems.length === 0 || isLoadingClassName) return;

    const doc = new jsPDF();
    
    // Add Vazirmatn font for Persian support. This is required for RTL languages.
    doc.addFileToVFS('Vazirmatn-Regular.ttf', vazirmatnFont);
    doc.addFont('Vazirmatn-Regular.ttf', 'Vazirmatn', 'normal');
    doc.setFont('Vazirmatn');
    doc.setR2L(true);

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // Header
    doc.setFontSize(16);
    doc.text('دبیرستان سلام‌کار', pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.text('کارنامه تحصیلی', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Student Info
    doc.setFontSize(11);
    doc.text(`نام دانش‌آموز: ${selectedStudent.name}`, pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.text(`صنف: ${className}`, pageWidth - margin, y, { align: 'right' });
    y += 7;
    doc.text(`تاریخ صدور: ${format(new Date(), 'yyyy/MM/dd')}`, pageWidth - margin, y, { align: 'right' });
    y += 12;

    // Grades Table
    // The order in the array is reversed by jsPDF-autotable in RTL mode.
    // So this is effectively: [Subject, Score, Max Score, Percentage]
    const tableHead = [['موضوع امتحان', 'نمره', 'حداکثر نمره', 'درصد']];
    const tableBody = reportCardItems.map(item => [
      `${item.subject} (${item.type})`,
      item.score,
      item.maxScore,
      `%${item.percentage.toFixed(1)}`
    ]);

    autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: y,
        theme: 'grid',
        styles: {
            font: 'Vazirmatn',
            cellPadding: 3, // Increased padding
            halign: 'center', // Center-align by default
        },
        headStyles: {
            fillColor: [45, 55, 72],
            textColor: 255,
            fontStyle: 'bold',
        },
        alternateRowStyles: {
            fillColor: [248, 249, 250]
        },
        columnStyles: {
            0: { halign: 'right' }, // Right-align subject names
        }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('Vazirmatn', 'bold');
    doc.text('خلاصه عملکرد', pageWidth - margin, y, { align: 'right' });
    y += 8;

    doc.setFontSize(11);
    doc.setFont('Vazirmatn', 'normal');

    const totalScore = reportCardItems.reduce((sum, item) => sum + item.score, 0);
    const totalMaxScore = reportCardItems.reduce((sum, item) => sum + item.maxScore, 0);
    doc.text(`مجموع نمرات: ${totalScore} از ${totalMaxScore}`, pageWidth - margin, y, { align: 'right' });
    y += 7;

    if (totalMaxScore > 0) {
        const finalPercentage = (totalScore / totalMaxScore) * 100;
        doc.text(`فیصدی کل: %${finalPercentage.toFixed(1)}`, pageWidth - margin, y, { align: 'right' });
        y += 7;

        let resultLabel = '';
        if (finalPercentage >= 85) {
            resultLabel = 'عالی';
        } else if (finalPercentage >= 70) {
            resultLabel = 'خوب';
        } else if (finalPercentage >= 50) {
            resultLabel = 'قابل قبول';
        } else {
            resultLabel = 'نیاز به تلاش بیشتر';
        }
        
        doc.setFont('Vazirmatn', 'bold');
        doc.text(`نتیجه: ${resultLabel}`, pageWidth - margin, y, { align: 'right' });
    }


    doc.save(`کارنامه-${selectedStudent.name.replace(/ /g, '_')}.pdf`);
  };

  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }
  if (!isAuthorized) {
    return <PermissionDenied userRole="parent" />;
  }

  const LoadingSkeleton = () => (
    <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <Skeleton className="h-6 w-24 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="h-5 w-1/2 mb-12" />
        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg space-y-4">
             <div className="p-6 bg-primary/10 border border-primary/30 rounded-xl animate-pulse">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-10 w-1/2" />
            </div>
            <div className="border-b border-muted/30 grid grid-cols-4 gap-4 p-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-muted/20 grid grid-cols-4 gap-4 items-center p-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-5 w-1/2 justify-self-center" />
                    <Skeleton className="h-5 w-1/2 justify-self-end" />
                </div>
            ))}
        </div>
    </div>
  );
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-transparent">
        {isLoading ? <LoadingSkeleton /> : (
            <div className="w-full max-w-4xl animate-fade-in-slide-up">
                <div className="flex justify-between items-center mb-8">
                    <BackButton />
                    <button
                        onClick={handleDownloadPdf}
                        disabled={reportCardItems.length === 0 || isLoadingClassName || isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-primary-foreground bg-primary rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download size={18} />
                        <span>دانلود کارنامه (PDF)</span>
                    </button>
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Report Card</h1>
                {linkedStudents.length > 0 && selectedStudent && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <p className="text-muted-foreground text-lg">
                            Showing grades for <span className="font-semibold text-primary">{selectedStudent.name}</span>
                        </p>
                        {linkedStudents.length > 1 && (
                            <select
                                value={selectedStudentId ?? ''}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 appearance-none bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {linkedStudents.map(student => (
                                    <option key={student.id} value={student.id}>{student.name}</option>
                                ))}
                            </select>
                        )}
                    </div>
                )}
                
                {selectedStudent ? (
                     <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                        {overallAverage !== null && (
                             <div className="mb-8 p-6 bg-primary/10 border border-primary/30 rounded-xl">
                                <p className="text-sm text-primary flex items-center gap-2">
                                    <TrendingUp size={16}/>
                                    Overall Performance
                                </p>
                                <p className={`text-4xl font-bold mt-1 ${getPercentageColor(overallAverage)}`}>
                                    {overallAverage.toFixed(1)}%
                                </p>
                                <p className="text-lg font-semibold text-primary/90">
                                   Average Score
                                </p>
                            </div>
                        )}
                        
                        <div className="overflow-x-auto">
                            <div className="w-full text-left">
                                <div className="border-b border-muted/30 grid grid-cols-4 gap-4 p-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Exam Subject</h3>
                                    <h3 className="text-sm font-semibold text-muted-foreground">Date</h3>
                                    <h3 className="text-sm font-semibold text-muted-foreground text-center">Score</h3>
                                    <h3 className="text-sm font-semibold text-muted-foreground text-right">Percentage</h3>
                                </div>
                                <div className='space-y-2 mt-2'>
                                {reportCardItems.length > 0 ? (
                                    reportCardItems.map(item => (
                                        <div key={item.id} className="grid grid-cols-4 gap-4 items-center p-3 rounded-lg hover:bg-muted/10">
                                            <div className="font-medium text-foreground/90 capitalize">{item.subject} ({item.type})</div>
                                            <div className="text-muted-foreground">{format(new Date(item.date.replace(/-/g, '/')), 'MMM d, yyyy')}</div>
                                            <div className="text-center text-muted-foreground font-semibold">{item.score} / {item.maxScore}</div>
                                            <div className={`text-right font-bold text-lg ${getPercentageColor(item.percentage)}`}>{item.percentage.toFixed(1)}%</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-center">
                                        <ClipboardList className="h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-md font-semibold text-foreground">No Grades Available</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">No exam grades have been posted for this student yet.</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl shadow-lg">
                        <Award className="mx-auto h-16 w-16 text-primary" />
                        <h2 className="mt-6 text-2xl font-bold text-foreground">No Student Linked</h2>
                        <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
                            An administrator needs to link your account to a student's profile before you can view their report card.
                        </p>
                    </div>
                )}
            </div>
        )}
    </main>
  );
}
