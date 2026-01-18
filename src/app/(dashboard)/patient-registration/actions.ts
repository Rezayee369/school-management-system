'use server';

import { z } from 'zod';
import { collection, query, orderBy, limit, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

const PatientSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  service: z.string().min(1, 'Please select a service'),
});

export async function registerPatient(prevState: any, formData: FormData) {
  const validatedFields = PatientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    service: formData.get('service'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed.',
    };
  }

  const { name, phone, service } = validatedFields.data;

  try {
    const batch = writeBatch(db);

    // 1. Get the latest queue number
    const q = query(collection(db, 'queue'), orderBy('queueNumber', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    let newQueueNumber = 1;
    if (!querySnapshot.empty) {
      newQueueNumber = querySnapshot.docs[0].data().queueNumber + 1;
    }

    // 2. Create new patient document
    const patientRef = doc(collection(db, 'patients'));
    const createdAt = Timestamp.now();
    batch.set(patientRef, {
      name,
      phone,
      service,
      createdAt,
    });

    // 3. Create new queue document
    const queueRef = doc(collection(db, 'queue'));
    batch.set(queueRef, {
      queueNumber: newQueueNumber,
      patientId: patientRef.id,
      patientName: name,
      service,
      status: 'Waiting',
      createdAt,
    });
    
    await batch.commit();
    revalidatePath('/queue-management');
    revalidatePath('/'); // Revalidate dashboard stats as well

    return { message: `Successfully registered ${name} with queue number ${newQueueNumber}.`, success: true };

  } catch (error) {
    console.error('Error registering patient:', error);
    return { message: 'Failed to register patient.', success: false };
  }
}
