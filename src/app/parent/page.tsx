
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import DashboardHeader from '@/components/DashboardHeader';
import PermissionDenied from '@/components/PermissionDenied';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDoc, query, where, documentId, getDocs, orderBy, Timestamp, setDoc, arrayUnion } from 'firebase/firestore';
import { BookOpen, Users, Percent, CalendarDays, Wallet, CalendarClock, Award, Megaphone, MessageSquare } from 'lucide-react';
import { format, parse, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n';

interface StudentData {
  id: string;
  name: string;
}

interface ClassData {
  id: string;
  name: string;
  teacherName: string;
}

interface AttendanceData {
  status: 'present' | 'absent' | 'leave';
  date: string; // YYYY-MM-DD
}

interface FeeData {
    id: string;
    month: string;
    status: 'paid' | 'unpaid';
    amount: number;
    discount?: number;
}

interface NotificationData {
    id: string;
    title: string;
    message: string;
    createdAt: Timestamp;
}

// Generate month options for the filter dropdown
const getMonthOptions = () => {
    const options = [];
    let date = new Date();
    for (let i = 0; i < 12; i++) {
        const value = format(date, 'yyyy-MM');
        const label = format(date, 'MMMM yyyy');
        options.push({ value, label });
        date.setMonth(date.getMonth() - 1);
    }
    return options;
};

export default function ParentDashboard() {
  const { isLoading: isLoadingAuth, isAuthorized, userRole } = useAuthGuard('parent');
  const user = useUser();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [linkedStudents, setLinkedStudents] = useState<StudentData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Data for the selected student
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceData[]>([]);
  const [allFees, setAllFees] = useState<FeeData[]>([]);

  // State for attendance history filtering
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const monthOptions = useMemo(getMonthOptions, []);

  // State for notifications
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  // Fetch parent's linked students
  useEffect(() => {
    if (!isAuthorized || !user || !db) {
        if (!isLoadingAuth) setIsLoadingData(false);
        return;
    }

    const fetchLinkedStudents = async () => {
        const parentRef = doc(db, 'users', user.uid);
        try {
            const snap = await getDoc(parentRef);
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
                    setIsLoadingData(false); // Fix: Ensure loading stops if no students are linked
                }
            } else {
                 setIsLoadingData(false); // Fix: Ensure loading stops if parent document doesn't exist
            }
        } catch (error) {
            console.error("Error fetching linked students:", error);
            toast.error("Failed to load child data.");
            setIsLoadingData(false);
        }
    };

    fetchLinkedStudents();

  }, [isAuthorized, user, db, selectedStudentId, isLoadingAuth]);

  // Fetch data for the selected student
  useEffect(() => {
    if (!selectedStudentId || !db) {
      setClasses([]); setAllAttendance([]); setAllFees([]);
      return;
    }

    const fetchStudentData = async () => {
        setIsLoadingData(true);
        try {
            const [classesSnap, attendanceSnap, feesSnap] = await Promise.all([
                getDocs(query(collection(db, 'classes'), where('studentIds', 'array-contains', selectedStudentId))),
                getDocs(query(collection(db, 'attendance'), where('studentId', '==', selectedStudentId))),
                getDocs(query(collection(db, 'fees'), where('studentId', '==', selectedStudentId), orderBy('month', 'desc')))
            ]);
            
            setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClassData)));
            setAllAttendance(attendanceSnap.docs.map(d => d.data() as AttendanceData).sort((a,b) => b.date.localeCompare(a.date)));
            setAllFees(feesSnap.docs.map(d => ({id: d.id, ...d.data()}) as FeeData));

        } catch(err) {
            console.error(err);
            toast.error("Failed to load student data.");
        } finally {
            setIsLoadingData(false);
        }
    }
    
    fetchStudentData();
  }, [selectedStudentId, db]);

  // Fetch notifications separately
  useEffect(() => {
    if (!user || !db) return;

    const fetchNotifications = async () => {
        try {
            const notifQuery = query(
                collection(db, 'notifications'),
                where('targetRole', 'in', ['all', 'parent']),
                orderBy('createdAt', 'desc')
            );
            const notifSnap = await getDocs(notifQuery);
            setNotifications(notifSnap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationData)));
            
            const readStateRef = doc(db, 'userReadStates', user.uid);
            const readStateSnap = await getDoc(readStateRef);
            if(readStateSnap.exists()) {
                setReadNotificationIds(new Set(readStateSnap.data()?.readNotificationIds || []));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load notifications.");
        }
    };
    fetchNotifications();
  }, [user, db]);
  
  const unreadCount = useMemo(() => {
    return notifications.filter(notif => !readNotificationIds.has(notif.id)).length;
  }, [notifications, readNotificationIds]);

  const handleNotificationClick = useCallback(async (notificationId: string) => {
    if (!user || readNotificationIds.has(notificationId)) return;
    
    const newReadIds = new Set(readNotificationIds).add(notificationId);
    setReadNotificationIds(newReadIds); // Optimistic update

    const readStateRef = doc(db, 'userReadStates', user.uid);
    try {
      await setDoc(readStateRef, {
        readNotificationIds: arrayUnion(notificationId)
      }, { merge: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error(t('parentDashboard.readStatusError'));
      const revertedIds = new Set(readNotificationIds);
      revertedIds.delete(notificationId);
      setReadNotificationIds(revertedIds);
    }
  }, [user, readNotificationIds, db, t]);
  
  const feeStatus = useMemo(() => {
    const currentMonthForFee = format(new Date(), 'yyyy-MM');
    return allFees.find(fee => fee.month === currentMonthForFee) || null;
  }, [allFees]);
  
  const feeHistory = allFees;

  const { attendanceToday, monthlyAttendance, filteredAttendanceHistory } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const monthStartStr = format(new Date(), 'yyyy-MM');
    
    const todayRecord = allAttendance.find(a => a.date === todayStr) || null;
    const monthlyRecords = allAttendance.filter(a => a.date.startsWith(monthStartStr));
    const presentCount = monthlyRecords.filter(a => a.status === 'present').length;
    
    const historyRecords = allAttendance.filter(a => a.date.startsWith(selectedMonth));

    return {
        attendanceToday: todayRecord,
        monthlyAttendance: { present: presentCount, total: monthlyRecords.length },
        filteredAttendanceHistory: historyRecords,
    }
  }, [allAttendance, selectedMonth]);
  
  const monthlyAttendancePercentage = useMemo(() => {
    if(monthlyAttendance.total === 0) return null;
    return (monthlyAttendance.present / monthlyAttendance.total) * 100;
  }, [monthlyAttendance]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'absent': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'leave': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };
  
  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId);

  if (isLoadingAuth || isLoadingData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
        <p>Loading...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return <PermissionDenied userRole={userRole} />;
  }

  const StatCard = ({ title, value, icon, subtext }: { title: string; value: string; icon: React.ReactNode, subtext?: string }) => (
    <div className="group p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg border border-border">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-4xl font-bold text-foreground mt-2">{value}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className="p-3 bg-secondary/10 rounded-lg">{icon}</div>
      </div>
    </div>
  );

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 bg-background text-foreground">
      <div className="w-full max-w-7xl animate-fade-in-slide-up">
        <DashboardHeader userRole="parent" />

        {linkedStudents.length > 0 && selectedStudent ? (
           <>
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-semibold text-foreground">
                    {t('parentDashboard.showingDataFor')}: <span className="text-primary">{selectedStudent.name}</span>
                </h2>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <StatCard 
                title={t('parentDashboard.attendanceToday')}
                value={attendanceToday ? t(`parentDashboard.status_${attendanceToday.status}`) : 'N/A'}
                subtext={attendanceToday ? format(new Date(), 'MMMM d, yyyy') : t('parentDashboard.notMarked')}
                icon={<CalendarDays className={`w-6 h-6 ${attendanceToday?.status === 'present' ? 'text-green-400' : attendanceToday?.status === 'absent' ? 'text-red-400' : 'text-yellow-400'}`} />}
              />
              <StatCard 
                title={t('parentDashboard.monthlyAttendance')}
                value={monthlyAttendancePercentage !== null ? `${monthlyAttendancePercentage.toFixed(0)}%` : 'N/A'}
                subtext={monthlyAttendance.total > 0 ? t('parentDashboard.daysSummary', { present: String(monthlyAttendance.present), total: String(monthlyAttendance.total) }) : t('parentDashboard.noRecords')}
                icon={<Percent className="w-6 h-6 text-secondary" />}
              />
              <StatCard 
                title={t('parentDashboard.currentMonthFee')}
                value={feeStatus ? t(`parentDashboard.fee_status_${feeStatus.status}`) : 'N/A'}
                subtext={feeStatus?.status === 'unpaid' ? `${t('parentDashboard.due')}: ${(feeStatus.amount - (feeStatus.discount || 0)).toFixed(2)} افغانی` : (feeStatus ? t('parentDashboard.cleared') : t('parentDashboard.noFeesPosted'))}
                icon={<Wallet className={`w-6 h-6 ${feeStatus?.status === 'paid' ? 'text-green-400' : feeStatus?.status === 'unpaid' ? 'text-red-400' : 'text-muted-foreground' }`} />}
              />
            </div>

            <div className="mb-8">
              <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                          <Megaphone className="w-6 h-6 text-primary"/>
                          {unreadCount > 0 && (
                              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white">
                                  {unreadCount}
                              </span>
                          )}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">{t('parentDashboard.notifications')}</h3>
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
                            <p className="mt-2 text-sm text-muted-foreground">{t('parentDashboard.noNotifications')}</p>
                          </div>
                      )}
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="grid grid-cols-1 gap-8 content-start">
                    <Link href="/parent/grades" className="block group">
                        <div className="flex flex-col justify-center text-center h-full p-6 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg transition-all duration-300 border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 hover:scale-[1.02]">
                            <Award className="w-8 h-8 text-primary mx-auto mb-3 transition-transform duration-300 group-hover:scale-110" />
                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{t('parentDashboard.viewReportCard')}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t('parentDashboard.viewReportCardDesc')}</p>
                        </div>
                    </Link>
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <Wallet className="w-6 h-6 text-secondary"/>
                            <h3 className="text-xl font-semibold text-foreground">{t('parentDashboard.feeHistory')}</h3>
                        </div>
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                            {feeHistory.length > 0 ? feeHistory.map((fee) => {
                                const amountDue = fee.amount - (fee.discount || 0);
                                return (
                                    <div key={fee.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-background/30 border-b border-muted/20">
                                        <div className="flex-grow">
                                            <p className="font-medium text-foreground/90">{format(parse(fee.month, 'yyyy-MM', new Date()), 'MMMM yyyy')}</p>
                                            <p className="text-xs text-muted-foreground">{t('parentDashboard.due')}: {amountDue.toFixed(2)} افغانی</p>
                                        </div>
                                        <div className="text-left sm:text-center text-muted-foreground">
                                            <p className="text-xs">{t('parentDashboard.fee')}: {fee.amount.toFixed(2)} افغانی</p>
                                            {fee.discount && fee.discount > 0 ? <p className="text-xs">{t('parentDashboard.discount')}: {fee.discount.toFixed(2)} افغانی</p> : null}
                                        </div>
                                        <div className="self-start sm:self-center">
                                            <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${
                                                fee.status === 'paid' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'
                                            }`}>
                                                {t(`parentDashboard.fee_status_${fee.status}`)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <p className="text-muted-foreground text-center py-4">{t('parentDashboard.noFeeHistory')}</p>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-8 content-start">
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold text-foreground mb-4">{t('parentDashboard.enrolledClasses')}</h3>
                        {classes.length > 0 ? (
                            <div className="space-y-4">
                                {classes.map(c => (
                                    <div key={c.id} className="p-3 bg-background/30 border border-muted/20 rounded-lg flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-secondary flex-shrink-0" />
                                        <div>
                                            <p className="text-md text-foreground/90 font-semibold">{c.name}</p>
                                            <p className="text-xs text-muted-foreground">{t('parentDashboard.teacher')}: {c.teacherName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">{t('parentDashboard.notEnrolled')}</p>
                        )}
                    </div>
                    <div className="p-6 bg-background/60 backdrop-blur-sm border border-border rounded-xl shadow-lg">
                        <div className="flex justify-between items-center gap-3 mb-4">
                            <div className='flex items-center gap-3'>
                                <CalendarClock className="w-6 h-6 text-secondary"/>
                                <h3 className="text-xl font-semibold text-foreground">{t('parentDashboard.attendanceHistory')}</h3>
                            </div>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="text-sm px-2 py-1 appearance-none bg-background/50 text-foreground border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                            {filteredAttendanceHistory.length > 0 ? filteredAttendanceHistory.map((record, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-background/30 border-b border-muted/20">
                                    <p className="font-medium text-foreground/90">{format(parse(record.date, 'yyyy-MM-dd', new Date()), 'MMMM dd, yyyy')}</p>
                                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${getStatusBadge(record.status)}`}>
                                        {t(`parentDashboard.status_${record.status}`)}
                                    </span>
                                </div>
                            )) : (
                                 <p className="text-muted-foreground text-center py-4">{t('parentDashboard.noAttendanceForMonth')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
           </>
        ) : (
          <div className="mt-12 text-center p-12 bg-background/60 backdrop-blur-sm border border-dashed border-primary/30 rounded-xl shadow-lg">
            <Users className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-6 text-2xl font-bold text-foreground">{t('parentDashboard.welcome')}</h2>
            <p className="mt-2 text-md text-muted-foreground max-w-prose mx-auto">
              {t('parentDashboard.welcomeDesc')}
            </p>
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-primary/90">
                    {t('parentDashboard.noStudentLinked')}
                </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

    
