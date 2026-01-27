'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, documentId, getDocs } from 'firebase/firestore';
import { ClipboardEdit, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import BackButton from '@/components/BackButton';

// Interfaces
interface ClassData {
  id: string;
  name: string;
  teacherId: string;
  studentIds?: string[];
}

interface StudentData {
  id: string;
  name: string;
}

interface GradeData {
  examScore: number;
  assignmentScore: number;
}

interface ScoreInput {
  exam: string;
  assignment: string;
}

export default function ManageGradesPage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [scores, setScores] = useState<Map<string, ScoreInput>>(new Map());
  const [isSaving, setIsSaving] = useState<Set<string>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Initial data loading for class and students
  useEffect(() => {
    if (!user || !db || !classId) return;

    const classDocRef = doc(db, 'classes', classId);
    const unsubscribeClass = onSnapshot(classDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as ClassData;
        if (data.teacherId === user.uid) {
          setClassData(data);
          const studentIds = data.studentIds || [];
          if (studentIds.length > 0) {
            const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
            getDocs(studentsQuery).then(snapshot => {
              const studentData = snapshot.docs.map(d => ({ id: d.id, name: d.data().fullName as string }));
              setStudents(studentData);
            });
          } else {
            setStudents([]);
          }
        } else {
          toast.error("You are not authorized for this class.");
          setClassData(null);
        }
      } else {
        toast.error("Class not found.");
        setClassData(null);
      }
      setIsLoadingData(false);
    });

    return () => unsubscribeClass();
  }, [user, db, classId]);

  // Loading existing grades for the class
  useEffect(() => {
    if (!classId || !db) return;

    const gradesQuery = query(
      collection(db, 'grades'), 
      where('classId', '==', classId)
    );

    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      const newScores = new Map<string, ScoreInput>();
      snapshot.forEach(doc => {
        const grade = doc.data() as GradeData;
        const studentId = doc.data().studentId;
        newScores.set(studentId, {
          exam: String(grade.examScore ?? ''),
          assignment: String(grade.assignmentScore ?? ''),
        });
      });
      
      setScores(prevScores => {
        const merged = new Map(prevScores);
        newScores.forEach((value, key) => merged.set(key, value));
        return merged;
      });
    });

    return () => unsubscribeGrades();
  }, [classId, db]);

  const handleScoreChange = (studentId: string, type: 'exam' | 'assignment', value: string) => {
    const updatedScores = new Map(scores);
    const currentScores = updatedScores.get(studentId) || { exam: '', assignment: '' };
    currentScores[type] = value;
    updatedScores.set(studentId, currentScores);
    setScores(updatedScores);
  };

  const handleSaveGrades = async (student: StudentData) => {
    if (!classData || !user) return;
    
    const studentScores = scores.get(student.id) || { exam: '0', assignment: '0' };
    const examScore = parseFloat(studentScores.exam);
    const assignmentScore = parseFloat(studentScores.assignment);

    if (isNaN(examScore) || isNaN(assignmentScore) || examScore < 0 || examScore > 100 || assignmentScore < 0 || assignmentScore > 100) {
      toast.error('Scores must be numbers between 0 and 100.');
      return;
    }

    setIsSaving(prev => new Set(prev).add(student.id));

    try {
      const gradeId = `${classData.id}_${student.id}`;
      const gradeRef = doc(db, 'grades', gradeId);

      await setDoc(gradeRef, {
        classId: classData.id,
        className: classData.name,
        studentId: student.id,
        studentName: student.name,
        teacherId: user.uid,
        examScore,
        assignmentScore,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast.success(`Grades saved for ${student.name}.`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save grades.');
    } finally {
      setIsSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(student.id);
        return newSet;
      });
    }
  };
  
  const calculateAverage = (studentId: string) => {
    const studentScores = scores.get(studentId);
    if (!studentScores) return 'N/A';
    const exam = parseFloat(studentScores.exam);
    const assignment = parseFloat(studentScores.assignment);
    if (isNaN(exam) || isNaN(assignment)) return 'N/A';
    return ((exam + assignment) / 2).toFixed(1);
  };

  if (isLoadingData || isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="mb-8">
          <BackButton />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">{classData?.name || 'Grades'}</h1>
        <p className="text-muted-foreground mb-8">Manage student grades for this class.</p>

        {classData ? (
          <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardEdit className="w-7 h-7 text-secondary" />
              <h2 className="text-2xl font-semibold text-foreground">Gradebook</h2>
            </div>
            
            <div className="space-y-4">
              {students.length > 0 ? students.map(student => (
                <div key={student.id} className="p-4 border bg-background/50 border-muted/20 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="text-lg text-foreground/90 font-medium w-full md:w-1/4">{student.name}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 items-center gap-3 w-full md:w-auto">
                    <div>
                      <label className="text-xs text-muted-foreground">Exam</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores.get(student.id)?.exam ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                        placeholder="0-100"
                        className="w-full px-2 py-1.5 bg-background/70 text-foreground border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Assignment</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scores.get(student.id)?.assignment ?? ''}
                        onChange={(e) => handleScoreChange(student.id, 'assignment', e.target.value)}
                        placeholder="0-100"
                        className="w-full px-2 py-1.5 bg-background/70 text-foreground border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="text-center">
                      <label className="text-xs text-muted-foreground">Average</label>
                      <p className="text-lg font-bold text-primary">{calculateAverage(student.id)}</p>
                    </div>
                    <button
                      onClick={() => handleSaveGrades(student)}
                      disabled={isSaving.has(student.id)}
                      className="p-2 self-end text-primary-foreground bg-primary rounded-md transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-wait hover:bg-primary/90"
                    >
                      {isSaving.has(student.id) ? (
                        <div className="w-5 h-5 mx-auto border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save size={20} className="mx-auto"/>
                      )}
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-8">No students enrolled in this class.</p>
              )}
            </div>
          </div>
        ) : !isLoadingData && (
          <div className="p-6 bg-background/60 backdrop-blur-sm border border-destructive/30 rounded-xl shadow-lg text-center">
            <p className="text-destructive-foreground">Could not load class data.</p>
          </div>
        )}
      </div>
    </main>
  );
}
