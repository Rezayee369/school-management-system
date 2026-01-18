'use client';
import { useQueue } from '@/hooks/use-queue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BellRing, Check, Clock, Loader2, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, Timestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

function PatientCard({ patient }: { patient: any }) {
  const [registeredAtText, setRegisteredAtText] = useState('');

  useEffect(() => {
    if (patient.createdAt?.toDate) {
      setRegisteredAtText(formatDistanceToNow(patient.createdAt.toDate(), { addSuffix: true }));
    }
  }, [patient.createdAt]);

  return (
    <div className="p-4 bg-background rounded-lg border shadow-sm flex justify-between items-center">
      <div>
        <p className="font-semibold">{patient.patientName} <span className="font-normal text-muted-foreground">({patient.service})</span></p>
        <p className="text-sm text-muted-foreground">
          Queue #{patient.queueNumber} - Registered {registeredAtText}
        </p>
      </div>
    </div>
  );
}

function QueueColumn({ title, icon: Icon, patients, count, emptyMessage, children }: { title: string, icon: React.ElementType, patients: any[], count: number, emptyMessage: string, children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon className="mr-2 h-5 w-5" />
          {title}
          <Badge variant="secondary" className="ml-auto">{count}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-full max-h-96 pr-4">
            <div className="space-y-3">
            {children}
            {patients.length > 0 ? (
                patients.map(p => <PatientCard key={p.id} patient={p} />)
            ) : (
                <p className="text-sm text-muted-foreground text-center pt-10">{emptyMessage}</p>
            )}
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function QueueManagementPage() {
  const { waiting, called, completed, loading, error } = useQueue();
  const { userProfile } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCalling, setIsCalling] = useState(false);
  const [isCompleting, setIsCompleting] = useState<string | null>(null);

  const handleCallNext = async () => {
    if(!firestore) return;
    setIsCalling(true);
    try {
      // Check if there's already a 'Called' patient
      const calledQuery = query(collection(firestore, 'queue'), where('status', '==', 'Called'), limit(1));
      const calledSnapshot = await getDocs(calledQuery);
      if (!calledSnapshot.empty) {
        toast({ title: 'Action Failed', description: 'Another patient is already being attended to.', variant: 'destructive' });
        setIsCalling(false);
        return;
      }

      // Find the next patient in 'Waiting'
      const q = query(collection(firestore, 'queue'), where('status', '==', 'Waiting'), orderBy('queueNumber'), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'Action Failed', description: 'No patients are currently waiting.', variant: 'destructive' });
        setIsCalling(false);
        return;
      }

      const patientDoc = querySnapshot.docs[0];
      const patientRef = doc(firestore, 'queue', patientDoc.id);

      await updateDoc(patientRef, {
        status: 'Called',
        calledAt: Timestamp.now(),
      });
      
      toast({ title: 'Action Successful', description: `Patient #${patientDoc.data().queueNumber} has been called.` });
    } catch (error) {
      console.error('Error calling next patient:', error);
      toast({ title: 'Action Failed', description: 'Failed to call the next patient.', variant: 'destructive' });
    }
    setIsCalling(false);
  };

  const handleComplete = async (queueId: string) => {
    if(!firestore) return;
    setIsCompleting(queueId);
    try {
        const patientRef = doc(firestore, 'queue', queueId);
        await updateDoc(patientRef, {
            status: 'Completed',
            completedAt: Timestamp.now(),
        });

        toast({ title: 'Action Successful', description: 'Consultation completed.'});
    } catch (error) {
        console.error('Error completing patient consultation:', error);
        toast({ title: 'Action Failed', description: 'Failed to complete consultation.', variant: 'destructive'});
    }
    setIsCompleting(null);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load queue data. Please try refreshing the page.</AlertDescription>
      </Alert>
    );
  }

  const canPerformActions = userProfile?.role === 'Doctor' || userProfile?.role === 'Admin';
  
  return (
    <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <QueueColumn title="Waiting" icon={Clock} patients={waiting} count={waiting.length} emptyMessage="No patients are waiting.">
        {canPerformActions && (
          <Button onClick={handleCallNext} disabled={isCalling || waiting.length === 0} className="w-full mb-4">
            {isCalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
            Call Next Patient
          </Button>
        )}
      </QueueColumn>

      <QueueColumn title="Called" icon={BellRing} patients={called} count={called.length} emptyMessage="No patient is currently called.">
        {canPerformActions && called.map(p => (
             <div key={p.id} className="p-4 bg-primary/10 rounded-lg border-2 border-primary shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">{p.patientName}</p>
                        <p className="text-sm">Queue #{p.queueNumber} - {p.service}</p>
                    </div>
                    <Button onClick={() => handleComplete(p.id)} disabled={!!isCompleting}>
                        {isCompleting === p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Complete
                    </Button>
                </div>
            </div>
        ))}
      </QueueColumn>
      
      <QueueColumn title="Completed" icon={Check} patients={completed} count={completed.length} emptyMessage="No patients completed recently." />
    </div>
  );
}
