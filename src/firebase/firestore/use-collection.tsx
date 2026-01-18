'use client';
import { useState, useEffect, useMemo } from 'react';
import { onSnapshot, collection, query, where, orderBy, limit, type Query } from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T>(path: string, options?: {
    where?: [string, "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any" | "not-in", any][],
    orderBy?: [string, 'desc' | 'asc'],
    limit?: number,
}) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const q = useMemo(() => {
    if (!firestore) return null;

    let colQuery: Query = collection(firestore, path);
    
    if (options?.where && options.where.length > 0) {
      const whereClauses = options.where.map(w => where(...w));
      colQuery = query(colQuery, ...whereClauses);
    }
    
    if(options?.orderBy) {
        colQuery = query(colQuery, orderBy(...options.orderBy));
    }
    if(options?.limit) {
        colQuery = query(colQuery, limit(options.limit));
    }
    return colQuery;
  }, [firestore, path, JSON.stringify(options?.where), JSON.stringify(options?.orderBy), options?.limit]);


  useEffect(() => {
    if (!q) {
      if(firestore) setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
