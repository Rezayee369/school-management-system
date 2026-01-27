'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, getDocs, setDoc, doc, serverTimestamp, documentId } from 'firebase/firestore';
import { Calendar as CalendarIcon, Check, X, Minus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PermissionDenied from '@/components/PermissionDenied';
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Data Interfaces
interface ClassData {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  name: string;
}

interface AttendanceRecord {
    status: 'present' | 'absent' | 'leave';
}

export default function TeacherAttendancePage() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [marking, setMarking] = useState<{studentId: string, status: string} | null>(null);

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
    });

    return () => unsubscribe();
  }, [isAuthorized, user, db]);

  // Fetch students and attendance when class or date changes
  useEffect(() => {
    if (!selectedClassId || !date || !db) {
        setStudents([]);
        return;
    };

    const dateString = format(date, 'yyyy-MM-dd');
    let unsubscribeStudents = () => {};
    let unsubscribeAttendance = () => {};

    const fetchData = async () => {
        setIsLoadingStudents(true);
        setStudents([]);
        setAttendance(new Map());

        try {
            // Get class doc to find student IDs
            const classDocRef = doc(db, 'classes', selectedClassId);
            const classSnap = await getDocs(query(collection(db, 'classes'), where(documentId(), '==', selectedClassId)));
            const classData = classSnap.docs[0]?.data();
            const studentIds = classData?.studentIds || [];

            if (studentIds.length > 0) {
                // Fetch student details
                const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
                const studentsSnapshot = await getDocs(studentsQuery);
                const studentData = studentsSnapshot.docs.map(d => ({ id: d.id, name: d.data().fullName as string }));
                setStudents(studentData);
                
                // Fetch today's attendance for the selected class
                const attendanceQuery = query(
                  collection(db, 'attendance'),
                  where('classId', '==', selectedClassId),
                  where('date', '==', dateString)
                );
                unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
                  const newAttendance = new Map<string, AttendanceRecord>();
                  snapshot.forEach(doc => {
                      newAttendance.set(doc.data().studentId, { status: doc.data().status });
                  });
                  setAttendance(newAttendance);
                });

            }
        } catch (error) {
            console.error("Error fetching student/attendance data:", error);
            toast.error("Failed to load student data.");
        } finally {
            setIsLoadingStudents(false);
        }
    };
    
    fetchData();

    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
    };
  }, [selectedClassId, date, db]);

  const handleMarkAttendance = async (student: StudentData, status: 'present' | 'absent' | 'leave') => {
    if (!selectedClassId || !date || !user || !db || marking) return;

    setMarking({studentId: student.id, status});
    const dateString = format(date, 'yyyy-MM-dd');
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    try {
        const attendanceId = `${selectedClassId}_${student.id}_${dateString}`;
        const attendanceRef = doc(db, 'attendance', attendanceId);
        
        await setDoc(attendanceRef, {
            classId: selectedClassId,
            className: selectedClass?.name || '',
            studentId: student.id,
            studentName: student.name,
            teacherId: user.uid,
            date: dateString,
            status: status,
            markedAt: serverTimestamp(),
        }, { merge: true });

        toast.success(`Marked ${student.name} as ${status}.`);

    } catch (e) {
        toast.error("Failed to mark attendance.");
        console.error(e);
    } finally {
        setMarking(null);
    }
  };
  
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present': return 'border-green-500 bg-green-500/10';
      case 'absent': return 'border-red-500 bg-red-500/10';
      case 'leave': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-muted/20';
    }
  };

  if (isLoadingAuth) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl animate-fade-in-slide-up">
        <div className="mb-8">
            <Link href="/teacher" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
            </Link>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-8">Mark Attendance</h1>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
                  <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      disabled={isLoadingClasses || classes.length === 0}
                      className="mt-1 block w-full appearance-none px-4 py-2 bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                  >
                      {isLoadingClasses ? (
                          <option>Loading classes...</option>
                      ) : classes.length > 0 ? (
                          classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      ) : (
                          <option>No classes assigned</option>
                      )}
                  </select>
              </div>
              <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1",
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
          
          <h2 className="text-2xl font-semibold text-foreground mb-4">Student List ({students.length})</h2>
          <div className="space-y-3">
              {isLoadingStudents ? (
                  <p className="text-muted-foreground text-center py-8">Loading students...</p>
              ) : students.length > 0 ? students.map(student => {
                  const currentStatus = attendance.get(student.id)?.status;
                  const isMarkingPresent = marking?.studentId === student.id && marking?.status === 'present';
                  const isMarkingAbsent = marking?.studentId === student.id && marking?.status === 'absent';
                  const isMarkingLeave = marking?.studentId === student.id && marking?.status === 'leave';
                  return (
                      <div key={student.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 ${getStatusColor(currentStatus)}`}>
                          <p className="text-lg text-foreground/90 font-medium">{student.name}</p>
                          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                              <button 
                                  onClick={() => handleMarkAttendance(student, 'present')} 
                                  disabled={!!marking}
                                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${currentStatus === 'present' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'}`}>
                                  {isMarkingPresent ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Check size={16}/>}
                                  Present
                              </button>
                              <button 
                                  onClick={() => handleMarkAttendance(student, 'absent')} 
                                  disabled={!!marking}
                                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'}`}>
                                  {isMarkingAbsent ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <X size={16}/>}
                                  Absent
                              </button>
                              <button 
                                  onClick={() => handleMarkAttendance(student, 'leave')} 
                                  disabled={!!marking}
                                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${currentStatus === 'leave' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40'}`}>
                                  {isMarkingLeave ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <Minus size={16}/>}
                                  Leave
                              </button>
                          </div>
                      </div>
                  );
              }) : (
                  <p className="text-muted-foreground text-center py-8">No students enrolled in this class, or class not selected.</p>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}
