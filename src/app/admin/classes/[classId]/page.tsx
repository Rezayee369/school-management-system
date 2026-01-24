'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, doc, onSnapshot, query, where, updateDoc, arrayUnion, arrayRemove, documentId } from 'firebase/firestore';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  fullName: string;
}

interface ClassData {
    name: string;
    teacherName: string;
    studentIds?: string[];
}

export default function ManageStudentsPage() {
  const db = useFirestore();
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!db || !classId) return;

    // Fetch all students in the system (for the 'available' list)
    const allStudentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubscribeAllStudents = onSnapshot(allStudentsQuery, (querySnapshot) => {
        setAllStudents(querySnapshot.docs.map(doc => ({ id: doc.id, fullName: doc.data().fullName } as Student)));
    }, (e) => {
        console.error("Failed to fetch student list:", e);
        toast.error("Failed to load student list.");
    });
    
    // Watch the class document for changes to studentIds
    let unsubscribeEnrolledStudents: () => void = () => {};
    const classDocRef = doc(db, 'classes', classId);
    const unsubscribeClass = onSnapshot(classDocRef, (classSnap) => {
        if (classSnap.exists()) {
            const data = classSnap.data() as ClassData;
            setClassData(data);
            
            unsubscribeEnrolledStudents(); // Unsubscribe from the previous listener
            
            const studentIds = data.studentIds || [];
            if (studentIds.length > 0) {
                const enrolledQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
                unsubscribeEnrolledStudents = onSnapshot(enrolledQuery, (enrolledSnap) => {
                    setEnrolledStudents(enrolledSnap.docs.map(doc => ({ id: doc.id, fullName: doc.data().fullName } as Student)));
                }, (err) => {
                     console.error("Error fetching enrolled students:", err);
                     toast.error("Failed to load enrolled students.");
                });
            } else {
                setEnrolledStudents([]);
            }
        } else {
            toast.error("Class not found.");
            router.push('/admin/classes');
        }
    }, (e) => {
        console.error("Error fetching class details:", e);
        toast.error("Failed to load class details.");
    });

    return () => {
      unsubscribeClass();
      unsubscribeAllStudents();
      unsubscribeEnrolledStudents();
    };
  }, [db, classId, router]);
  
  const handleEnroll = async (student: Student) => {
    try {
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {
            studentIds: arrayUnion(student.id)
        });
        toast.success(`${student.fullName} enrolled successfully.`);
    } catch (e) {
        console.error("Error enrolling student:", e);
        toast.error("Failed to enroll student.");
    }
  };

  const handleUnenroll = async (student: Student) => {
    if (!window.confirm(`Are you sure you want to unenroll ${student.fullName}?`)) {
        return;
    }
    try {
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {
            studentIds: arrayRemove(student.id)
        });
        toast.success(`${student.fullName} unenrolled successfully.`);
    } catch (e) {
        console.error("Error unenrolling student:", e);
        toast.error("Failed to unenroll student.");
    }
  };

  const unenrolledStudents = allStudents.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id)
  );

  if (!classData) {
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
            <Link href="/admin/classes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back to Classes</span>
            </Link>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Manage Students for {classData.name}</h1>
        <p className="text-muted-foreground mb-8">Teacher: {classData.teacherName}</p>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Enrolled Students */}
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg transition-all duration-300 hover:border-secondary hover:shadow-secondary/20">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Enrolled Students ({enrolledStudents.length})</h2>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {enrolledStudents.length > 0 ? (
                        enrolledStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg transition-all duration-200 hover:scale-[1.03] hover:bg-background/80">
                                <span className="text-foreground/90 font-medium">{student.fullName}</span>
                                <button 
                                    onClick={() => handleUnenroll(student)} 
                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                                    aria-label={`Unenroll ${student.fullName}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground text-center">No students enrolled yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unenrolled Students */}
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg transition-all duration-300 hover:border-primary hover:shadow-primary/20">
                <h2 className="text-2xl font-semibold text-foreground mb-4">Available Students ({unenrolledStudents.length})</h2>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {unenrolledStudents.length > 0 ? (
                        unenrolledStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg transition-all duration-200 hover:scale-[1.03] hover:bg-background/80">
                                <span className="text-foreground/90 font-medium">{student.fullName}</span>
                                <button 
                                    onClick={() => handleEnroll(student)} 
                                    className="p-2 text-green-400 hover:bg-green-400/10 rounded-full transition-colors"
                                    aria-label={`Enroll ${student.fullName}`}
                                >
                                    <UserPlus size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <p className="text-muted-foreground text-center">All available students are enrolled.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
