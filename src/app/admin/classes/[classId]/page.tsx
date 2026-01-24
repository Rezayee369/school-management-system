'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useAuth } from '@/firebase';
import { collection, doc, onSnapshot, query, where, updateDoc, arrayUnion, arrayRemove, documentId } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ArrowLeft, UserPlus, Trash2, LogOut, Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/Skeleton';

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
  const auth = useAuth();
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState<string | null>(null);

  const [studentToUnenroll, setStudentToUnenroll] = useState<Student | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout Error:', error);
      toast.error('Failed to log out.');
    }
  };

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
    setIsEnrolling(student.id);
    try {
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {
            studentIds: arrayUnion(student.id)
        });
        toast.success(`${student.fullName} enrolled successfully.`);
    } catch (e) {
        console.error("Error enrolling student:", e);
        toast.error("Failed to enroll student.");
    } finally {
        setIsEnrolling(null);
    }
  };
  
  const handleUnenrollClick = (student: Student) => {
    setStudentToUnenroll(student);
    setIsConfirmOpen(true);
  };

  const handleCancelUnenroll = () => {
    setIsConfirmOpen(false);
    setStudentToUnenroll(null);
  };
  
  const handleConfirmUnenroll = async () => {
    if (!studentToUnenroll) return;
    setIsUnenrolling(studentToUnenroll.id);

    try {
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {
            studentIds: arrayRemove(studentToUnenroll.id)
        });
        toast.success(`${studentToUnenroll.fullName} unenrolled successfully.`);
    } catch (e) {
        console.error("Error unenrolling student:", e);
        toast.error("Failed to unenroll student.");
    } finally {
        handleCancelUnenroll();
        setIsUnenrolling(null);
    }
  };

  const unenrolledStudents = allStudents.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id)
  );

  if (!classData) {
    const SkeletonStudentRow = () => (
      <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg animate-pulse">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
    return (
      <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-8">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/2 mb-8" />

          <div className="grid md:grid-cols-2 gap-8">
              <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <div className="space-y-3">
                      <SkeletonStudentRow />
                      <SkeletonStudentRow />
                      <SkeletonStudentRow />
                  </div>
              </div>
              <div className="p-6 bg-background/60 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg">
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <div className="space-y-3">
                      <SkeletonStudentRow />
                      <SkeletonStudentRow />
                      <SkeletonStudentRow />
                  </div>
              </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-6xl animate-fade-in-slide-up">
        <div className="flex justify-between items-center mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <LogOut size={18} />
                <span>Logout</span>
            </button>
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
                                    onClick={() => handleUnenrollClick(student)} 
                                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors active:scale-95"
                                    aria-label={`Unenroll ${student.fullName}`}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <Users className="h-10 w-10 text-muted-foreground" />
                            <h3 className="mt-4 text-md font-semibold text-foreground">No Students Enrolled</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Enroll students from the 'Available Students' list.</p>
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
                                    disabled={isEnrolling === student.id}
                                    className="p-2 text-green-400 hover:bg-green-400/10 rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Enroll ${student.fullName}`}
                                >
                                    {isEnrolling === student.id ? <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div> : <UserPlus size={18} />}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <UserCheck className="h-10 w-10 text-green-400" />
                            <h3 className="mt-4 text-md font-semibold text-foreground">All Students Enrolled</h3>
                            <p className="mt-1 text-sm text-muted-foreground">There are no more available students to enroll in this class.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        title={`Unenroll ${studentToUnenroll?.fullName || 'Student'}`}
        description="Are you sure you want to remove this student from the class? This will not delete their account."
        onConfirm={handleConfirmUnenroll}
        onCancel={handleCancelUnenroll}
        confirmText="Unenroll"
        isLoading={isUnenrolling === studentToUnenroll?.id}
      />
    </main>
  );
}
