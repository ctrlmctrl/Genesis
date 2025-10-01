// Firebase Service for cloud database
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import { Event, Participant, VerificationRecord } from '../types';
import { db } from '../firebase';

class FirebaseService {
  // Events
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const docRef = await addDoc(collection(db, 'events'), {
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    return {
      id: docRef.id,
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async getEvents(): Promise<Event[]> {
    const querySnapshot = await getDocs(collection(db, 'events'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Event[];
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'events', eventId));
  }

  // Participants
  async createParticipant(participant: Omit<Participant, 'id' | 'registrationDate' | 'qrCode' | 'isVerified' | 'paymentStatus'>): Promise<Participant> {
    const docRef = await addDoc(collection(db, 'participants'), {
      ...participant,
      registrationDate: new Date().toISOString(),
      qrCode: this.generateQRCode(participant.eventId, participant.email),
      isVerified: false,
      paymentStatus: 'pending'
    });
    
    return {
      id: docRef.id,
      ...participant,
      registrationDate: new Date().toISOString(),
      qrCode: this.generateQRCode(participant.eventId, participant.email),
      isVerified: false,
      paymentStatus: 'pending'
    };
  }

  async getParticipants(): Promise<Participant[]> {
    const querySnapshot = await getDocs(collection(db, 'participants'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Participant[];
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    const q = query(collection(db, 'participants'), where('eventId', '==', eventId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Participant[];
  }

  async updateParticipant(participantId: string, updates: Partial<Participant>): Promise<void> {
    const participantRef = doc(db, 'participants', participantId);
    await updateDoc(participantRef, updates);
  }

  // Verification Records
  async createVerificationRecord(record: Omit<VerificationRecord, 'id'>): Promise<VerificationRecord> {
    const docRef = await addDoc(collection(db, 'verification_records'), record);
    return {
      id: docRef.id,
      ...record
    };
  }

  async getVerificationRecords(): Promise<VerificationRecord[]> {
    const querySnapshot = await getDocs(collection(db, 'verification_records'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VerificationRecord[];
  }

  private generateQRCode(eventId: string, email: string): string {
    // Simple QR code generation - in production, use a proper QR library
    return `https://your-app.com/verify/${eventId}/${email}`;
  }
}

export const firebaseService = new FirebaseService();
