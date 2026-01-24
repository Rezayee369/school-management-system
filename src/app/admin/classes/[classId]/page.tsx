'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore } from '@/firebase';
import { collection, doc, getDoc, onSnapshot, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  fullName: string;
}

interface ClassData {
    name: string;
    teacherName: string;
}

export default function ManageStudentsPage() {
  const isLoading = useAuthGuard('admin');
  const db = useFirestore();
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !classId) return;

    // Fetch class details
    const classDocRef = doc(db, 'classes', classId);
    const unsubscribeClass = onSnapshot(classDocRef, (doc) => {
      if (doc.exists()) {
        setClassData(doc.data() as ClassData);
      } else {
        setError("Class not found.");
        router.push('/admin/classes');
      }
    });

    // Fetch all students in the system
    const fetchAllStudents = async () => {
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const querySnapshot = await getDocs(studentsQuery);
        setAllStudents(querySnapshot.docs.map(doc => ({ id: doc.id, fullName: doc.data().fullName })));
    };
    fetchAllStudents().catch(e => setError("Failed to fetch student list."));
    
    // Fetch enrolled students for this class
    const enrolledStudentsRef = collection(db, 'classes', classId, 'students');
    const unsubscribeEnrolled = onSnapshot(enrolledStudentsRef, (snapshot) => {
      setEnrolledStudents(snapshot.docs.map(doc => ({ id: doc.id, fullName: doc.data().studentName })));
    });

    return () => {
      unsubscribeClass();
      unsubscribeEnrolled();
    };
  }, [isLoading, db, classId, router]);
  
  const handleEnroll = async (student: Student) => {
    try {
        const studentDocRef = doc(db, 'classes', classId, 'students', student.id);
        await setDoc(studentDocRef, {
            studentId: student.id,
            studentName: student.fullName
        });
    } catch (e) {
        console.error("Error enrolling student:", e);
        setError("Failed to enroll student.");
    }
  };

  const handleUnenroll = async (studentId: string) => {
    try {
        const studentDocRef = doc(db, 'classes', classId, 'students', studentId);
        await deleteDoc(studentDocRef);
    } catch (e) {
        console.error("Error unenrolling student:", e);
        setError("Failed to unenroll student.");
    }
  };

  const unenrolledStudents = allStudents.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id)
  );

  if (isLoading || !classData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="mb-8">
            <Link href="/admin/classes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft size={18} />
                <span>Back to Classes</span>
            </Link>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Manage Students for {classData.name}</h1>
        <p className="text-muted-foreground mb-8">Teacher: {classData.teacherName}</p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid md:grid-cols-2 gap-8">
            {/* Enrolled Students */}
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Enrolled Students ({enrolledStudents.length})</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {enrolledStudents.length > 0 ? (
                        enrolledStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                                <span className="text-foreground/90">{student.fullName}</span>
                                <button onClick={() => handleUnenroll(student.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No students enrolled yet.</p>
                    )}
                </div>
            </div>

            {/* Unenrolled Students */}
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Available Students ({unenrolledStudents.length})</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {unenrolledStudents.length > 0 ? (
                        unenrolledStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                                <span className="text-foreground/90">{student.fullName}</span>
                                <button onClick={() => handleEnroll(student)} className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md">
                                    <UserPlus size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">All students are enrolled.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
