'use client';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type QueueItem } from '@/lib/types';

export function useQueue() {
  const [waiting, setWaiting] = useState<QueueItem[]>([]);
  const [called, setCalled] = useState<QueueItem[]>([]);
  const [completed, setCompleted] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'queue'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const items: QueueItem[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as QueueItem);
        });

        const waitingItems = items
          .filter(item => item.status === 'Waiting')
          .sort((a,b) => a.queueNumber - b.queueNumber);
        const calledItems = items
          .filter(item => item.status === 'Called')
          .sort((a,b) => a.calledAt && b.calledAt ? a.calledAt.seconds - b.calledAt.seconds : 0);
        const completedItems = items
          .filter(item => item.status === 'Completed')
          .sort((a,b) => b.completedAt && a.completedAt ? b.completedAt.seconds - a.completedAt.seconds : 0);

        setWaiting(waitingItems);
        setCalled(calledItems);
        setCompleted(completedItems.slice(0, 10)); // Only show last 10 completed
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { waiting, called, completed, loading, error };
}
