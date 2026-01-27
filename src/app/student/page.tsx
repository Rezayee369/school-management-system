
'use client';

import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { BookOpen, CheckCircle, XCircle, MinusCircle, ClipboardCheck, Megaphone, MessageSquare } from 'lucide-react';
import PermissionDenied from '@/components/PermissionDenied';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';


interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface AttendanceData {
  status: 'present' | 'absent' | 'leave';
  date: string; // YYYY-MM-DD
}

interface GradeData {
  className: string;
  examScore: number;
  assignmentScore: number;
}

interface NotificationData {
    id: string;
    title: string;
    message: string;
    createdAt: Timestamp;
}

export default function StudentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('student');
  const user = useUser();
  const db = useFirestore();

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (isLoadingAuth || !isAuthorized || !user || !db) {
        if (!isLoadingAuth && !isAuthorized) setIsLoadingData(false);
        return;
    };

    const unsubscribes: (() => void)[] = [];

    // Fetch classes
    const classesQuery = query(collection(db, 'classes'), where('studentIds', 'array-contains', user.uid));
    unsubscribes.push(onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as ClassData));
      setClasses(classesData);
      if(isLoadingData) setIsLoadingData(false);
    }, (error) => {
      console.error("Error fetching classes:", error);
      if(isLoadingData) setIsLoadingData(false);
    }));

    // Fetch attendance records
    const attendanceQuery = query(collection(db, 'attendance'), where('studentId', '==', user.uid));
    unsubscribes.push(onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => doc.data() as AttendanceData);
      setAttendance(attendanceData);
    }));

    // Fetch grades
    const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', user.uid));
    unsubscribes.push(onSnapshot(gradesQuery, (snapshot) => {
        const gradesData = snapshot.docs.map(doc => doc.data() as GradeData);
        setGrades(gradesData);
    }));
    
    // Fetch notifications
    const notifQuery = query(collection(db, 'notifications'), where('targetRole', 'in', ['all', 'student']));
    unsubscribes.push(onSnapshot(notifQuery, (snapshot) => {
        const notifData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationData));
        setNotifications(notifData.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime()));
    }));

    // Fetch read status
    const readStateRef = doc(db, 'userReadStates', user.uid);
    unsubscribes.push(onSnapshot(readStateRef, (doc) => {
      const data = doc.data();
      if (data && data.readNotificationIds) {
        setReadNotificationIds(new Set(data.readNotificationIds));
      }
    }));


    return () => unsubscribes.forEach(unsub => unsub());
  }, [isLoadingAuth, isAuthorized, user, db]);

  const attendanceSummary = attendance.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<'present' | 'absent' | 'leave', number>);
  
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !readNotificationIds.has(notif.id)).length;
  }, [notifications, readNotificationIds]);

  const handleNotificationClick = async (notificationId: string) => {
    if (!user || readNotificationIds.has(notificationId)) return;
    
    const readStateRef = doc(db, 'userReadStates', user.uid);
    try {
      await setDoc(readStateRef, {
        readNotificationIds: arrayUnion(notificationId)
      }, { merge: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Could not update read status.");
    }
  };


  if (isLoadingAuth || isLoadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
        <div className="w-full max-w-7xl">
          <DashboardHeader userRole="student" />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/40 rounded-xl animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <div className="h-72 bg-muted/40 rounded-xl animate-pulse"></div>
            <div className="h-72 bg-muted/40 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </main>
    );
  }
  
  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  const getAverageColor = (avg: number) => {
    if (avg >= 90) return 'text-primary';
    if (avg >= 80) return 'text-green-400';
    if (avg >= 70) return 'text-yellow-400';
    if (avg >= 60) return 'text-orange-400';
    return 'text-red-400';
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="student" />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-green-500/30 transition-all duration-300 hover:border-green-500 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days Present</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-green-400">{attendanceSummary.present ?? 0}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg transition-all duration-300 group-hover:bg-green-500/20 group-hover:shadow-[0_0_20px_#22c55e]">
                        <CheckCircle className="w-6 h-6 text-green-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-red-500/30 transition-all duration-300 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days Absent</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-red-400">{attendanceSummary.absent ?? 0}</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg transition-all duration-300 group-hover:bg-red-500/20 group-hover:shadow-[0_0_20px_#ef4444]">
                        <XCircle className="w-6 h-6 text-red-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
            <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-yellow-500/30 transition-all duration-300 hover:border-yellow-500 hover:shadow-xl hover:shadow-yellow-500/20 hover:-translate-y-1">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Days on Leave</p>
                        <p className="text-4xl font-bold text-foreground mt-2 transition-all duration-300 group-hover:text-yellow-400">{attendanceSummary.leave ?? 0}</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 rounded-lg transition-all duration-300 group-hover:bg-yellow-500/20 group-hover:shadow-[0_0_20px_#eab308]">
                        <MinusCircle className="w-6 h-6 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 mb-8 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                    <Megaphone className="w-6 h-6 text-primary"/>
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-semibold text-foreground">Notifications</h3>
            </div>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {notifications.length > 0 ? notifications.map(notif => (
                    <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`p-4 bg-background/40 border-s-4 rounded-r-lg cursor-pointer transition-all duration-300 ${
                            !readNotificationIds.has(notif.id)
                            ? 'border-primary hover:bg-primary/10'
                            : 'border-transparent'
                        }`}
                    >
                        <div className="flex justify-between items-baseline gap-4">
                            <h4 className={`font-semibold ${!readNotificationIds.has(notif.id) ? 'text-primary' : 'text-foreground/90'}`}>{notif.title}</h4>
                            <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                            </p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground break-words">{notif.message}</p>
                    </div>
                )) : (
                    <div className="flex flex-col items-center justify-center h-24 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">No new notifications.</p>
                    </div>
                )}
            </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <ClipboardCheck className="w-6 h-6 text-secondary"/>
                    <h3 className="text-xl font-semibold text-foreground">My Grades</h3>
                </div>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {grades.length > 0 ? grades.map((grade, i) => {
                        const avg = (grade.examScore + grade.assignmentScore) / 2;
                        return (
                            <div key={i} className="grid grid-cols-4 items-center p-3 bg-background/30 border-b border-muted/20">
                                <p className="col-span-2 font-medium text-foreground/90">{grade.className}</p>
                                <p className="text-center text-muted-foreground">{grade.examScore}</p>
                                <p className={`text-right font-bold ${getAverageColor(avg)}`}>{avg.toFixed(1)}%</p>
                            </div>
                        )
                    }) : (
                         <p className="text-muted-foreground text-center py-4">No grades have been posted yet.</p>
                    )}
                </div>
            </div>

            <div className="p-6 bg-background/60 backdrop-blur-sm border border-secondary/30 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                    My Classes
                </h3>
                {classes.length > 0 ? (
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                        {classes.map(c => (
                            <div key={c.id} className="p-3 bg-background/30 border border-muted/20 rounded-lg flex items-center gap-3 transition-all duration-300 hover:border-secondary/50 hover:bg-secondary/10">
                                <BookOpen className="w-5 h-5 text-secondary flex-shrink-0" />
                                <div>
                                    <p className="text-md text-foreground/90 font-semibold">{c.name}</p>
                                    <p className="text-xs text-muted-foreground">Teacher: {c.teacherName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">You are not enrolled in any classes.</p>
                )}
            </div>
        </div>
      </div>
    </main>
  );
}
