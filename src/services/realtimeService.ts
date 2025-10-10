import { Event, Participant, VerificationRecord } from '../types';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';

export type RealtimeCallback<T> = (data: T[]) => void;

class RealtimeService {
  private listeners: Map<string, Unsubscribe> = new Map();

  // Listen to all events
  listenToEvents(callback: RealtimeCallback<Event>): () => void {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });
      callback(events);
    });

    const listenerId = `events-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Listen to all participants
  listenToParticipants(callback: RealtimeCallback<Participant>): () => void {
    const participantsRef = collection(db, 'participants');
    const q = query(participantsRef, orderBy('registrationDate', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as Participant);
      });
      callback(participants);
    });

    const listenerId = `participants-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Listen to participants for a specific event
  listenToEventParticipants(eventId: string, callback: RealtimeCallback<Participant>): () => void {
    const participantsRef = collection(db, 'participants');
    const q = query(
      participantsRef, 
      where('eventId', '==', eventId),
      orderBy('registrationDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as Participant);
      });
      callback(participants);
    });

    const listenerId = `event-participants-${eventId}-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Listen to participants for a specific user (by email)
  listenToUserParticipants(userEmail: string, callback: RealtimeCallback<Participant>): () => void {
    const participantsRef = collection(db, 'participants');
    const q = query(
      participantsRef, 
      where('email', '==', userEmail),
      orderBy('registrationDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() } as Participant);
      });
      callback(participants);
    });

    const listenerId = `user-participants-${userEmail}-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Listen to verification records
  listenToVerificationRecords(callback: RealtimeCallback<VerificationRecord>): () => void {
    const verificationRef = collection(db, 'verification_records');
    const q = query(verificationRef, orderBy('verificationTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: VerificationRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as VerificationRecord);
      });
      callback(records);
    });

    const listenerId = `verification-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Listen to verification records for a specific event
  listenToEventVerificationRecords(eventId: string, callback: RealtimeCallback<VerificationRecord>): () => void {
    const verificationRef = collection(db, 'verification_records');
    const q = query(
      verificationRef, 
      where('eventId', '==', eventId),
      orderBy('verificationTime', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: VerificationRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as VerificationRecord);
      });
      callback(records);
    });

    const listenerId = `event-verification-${eventId}-${Date.now()}`;
    this.listeners.set(listenerId, unsubscribe);

    return () => {
      unsubscribe();
      this.listeners.delete(listenerId);
    };
  }

  // Clean up all listeners
  cleanup(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Get current listener count (for debugging)
  getListenerCount(): number {
    return this.listeners.size;
  }
}

export const realtimeService = new RealtimeService();

