import { type Timestamp } from 'firebase/firestore';

export type UserRole = 'Admin' | 'Doctor' | 'Receptionist';

export type UserProfile = {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
};

export type Patient = {
  id: string;
  name:string;
  phone: string;
  service: string;
  createdAt: Timestamp;
};

export type QueueStatus = 'Waiting' | 'Called' | 'Completed';

export type QueueItem = {
  id: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  service: string;
  status: QueueStatus;
  createdAt: Timestamp;
  calledAt?: Timestamp;
  completedAt?: Timestamp;
};
