'use client';

import { useState, useEffect } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp, documentId } from 'firebase/firestore';
import { Calendar, Check, X, Minus } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
  studentIds?: string[];
}

interface StudentData {
  id: string;
  name: string;
}

interface AttendanceRecord {
    id: string;
    status: 'present' | 'absent' | 'leave';
}

export default function MarkAttendancePage() {
  const isLoading = useAuthGuard('teacher');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [attendance, setAttendance] = useState<Map<string, AttendanceRecord>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (isLoading || !user) return;
    
    const classesQuery = query(collection(db, 'classes'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(classesQuery, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassData));
        setClasses(classesData);
        if (classesData.length > 0 && !selectedClass) {
            setSelectedClass(classesData[0]);
        } else if (selectedClass) {
            // Update selectedClass if it has changed in the snapshot
            const updatedSelectedClass = classesData.find(c => c.id === selectedClass.id);
            setSelectedClass(updatedSelectedClass || null);
        }
    }, (err) => {
        setError("Could not fetch classes.");
        console.error(err);
    });
    return () => unsubscribe();
    
  }, [isLoading, user, db]);

  useEffect(() => {
    if (!selectedClass) {
        setStudents([]);
        return;
    };

    let unsubscribeStudents = () => {};
    const studentIds = selectedClass.studentIds || [];
    if (studentIds.length > 0) {
        const studentsQuery = query(collection(db, 'users'), where(documentId(), 'in', studentIds));
        unsubscribeStudents = onSnapshot(studentsQuery, (snapshot) => {
            const studentData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().fullName as string }));
            setStudents(studentData);
        });
    } else {
        setStudents([]);
    }

    // Fetch today's attendance for the selected class
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', selectedClass.id),
      where('date', '==', today)
    );
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const newAttendance = new Map<string, AttendanceRecord>();
      snapshot.forEach(doc => {
          newAttendance.set(doc.data().studentId, {id: doc.id, status: doc.data().status});
      });
      setAttendance(newAttendance);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAttendance();
    };
  }, [selectedClass, db, today]);

  const handleMarkAttendance = async (student: StudentData, status: 'present' | 'absent' | 'leave') => {
    if (!selectedClass || !user) {
        setError("No class selected or user not found.");
        return;
    }
    
    try {
        const attendanceId = attendance.get(student.id)?.id || `${selectedClass.id}_${student.id}_${today}`;
        const attendanceRef = doc(db, 'attendance', attendanceId);
        
        await setDoc(attendanceRef, {
            classId: selectedClass.id,
            className: selectedClass.name,
            studentId: student.id,
            studentName: student.name,
            teacherId: user.uid,
            date: today,
            status: status,
            markedAt: serverTimestamp(),
        }, { merge: true });

    } catch (e) {
        setError("Failed to mark attendance.");
        console.error(e);
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

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center p-8 bg-background"><p>Loading...</p></main>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-background">
      <div className="w-full max-w-4xl animate-fade-in-slide-up">
        <h1 className="text-4xl font-bold text-foreground mb-4">Mark Attendance</h1>
        <div className="flex items-center gap-2 text-muted-foreground mb-8">
            <Calendar size={16}/>
            <span>{new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-8">
            <label htmlFor="class-select" className="block text-sm font-medium text-muted-foreground mb-2">Select a class</label>
            <select
                id="class-select"
                value={selectedClass?.id || ''}
                onChange={(e) => {
                    const newSelectedClass = classes.find(c => c.id === e.target.value);
                    setSelectedClass(newSelectedClass || null);
                }}
                className="w-full px-4 py-3 appearance-none bg-background/50 text-foreground border border-secondary/30 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {classes.length > 0 ? (
                    classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                ) : (
                    <option disabled>No classes assigned to you.</option>
                )}
            </select>
        </div>

        <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Student List ({students.length})</h2>
            <div className="space-y-3">
                {students.length > 0 ? students.map(student => {
                    const currentStatus = attendance.get(student.id)?.status;
                    return (
                        <div key={student.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 ${getStatusColor(currentStatus)}`}>
                            <p className="text-lg text-foreground/90 font-medium">{student.name}</p>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleMarkAttendance(student, 'present')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentStatus === 'present' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'}`}><Check size={16}/> Present</button>
                                <button onClick={() => handleMarkAttendance(student, 'absent')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-300 hover:bg-red-500/40'}`}><X size={16}/> Absent</button>
                                <button onClick={() => handleMarkAttendance(student, 'leave')} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentStatus === 'leave' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40'}`}><Minus size={16}/> Leave</button>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-muted-foreground text-center py-8">No students enrolled in this class.</p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}
