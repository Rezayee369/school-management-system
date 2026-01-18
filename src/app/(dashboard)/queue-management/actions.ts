'use server';

import { doc, updateDoc, Timestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

export async function callNextPatient() {
  try {
    // Check if there's already a 'Called' patient
    const calledQuery = query(collection(db, 'queue'), where('status', '==', 'Called'), limit(1));
    const calledSnapshot = await getDocs(calledQuery);
    if (!calledSnapshot.empty) {
      return { success: false, message: 'Another patient is already being attended to.' };
    }

    // Find the next patient in 'Waiting'
    const q = query(collection(db, 'queue'), where('status', '==', 'Waiting'), orderBy('queueNumber'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: 'No patients are currently waiting.' };
    }

    const patientDoc = querySnapshot.docs[0];
    const patientRef = doc(db, 'queue', patientDoc.id);

    await updateDoc(patientRef, {
      status: 'Called',
      calledAt: Timestamp.now(),
    });
    
    revalidatePath('/queue-management');
    return { success: true, message: `Patient #${patientDoc.data().queueNumber} has been called.` };
  } catch (error) {
    console.error('Error calling next patient:', error);
    return { success: false, message: 'Failed to call the next patient.' };
  }
}

export async function completePatient(queueId: string) {
    if (!queueId) {
        return { success: false, message: 'Invalid patient ID.' };
    }

    try {
        const patientRef = doc(db, 'queue', queueId);
        await updateDoc(patientRef, {
            status: 'Completed',
            completedAt: Timestamp.now(),
        });

        revalidatePath('/queue-management');
        revalidatePath('/'); // Revalidate dashboard stats
        return { success: true, message: `Consultation completed.` };
    } catch (error) {
        console.error('Error completing patient consultation:', error);
        return { success: false, message: 'Failed to complete consultation.' };
    }
}
