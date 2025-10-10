// Firebase Connection Test
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase connection...');
    
    // Try to read from events collection
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    console.log(`Firebase connected! Found ${snapshot.size} events.`);
    return true;
  } catch (error) {
    console.error('Firebase connection failed:', error);
    return false;
  }
};

export const testFirebaseWrite = async (): Promise<boolean> => {
  try {
    console.log('Testing Firebase write permissions...');
    
    // Try to write a test document
    const testDoc = {
      title: 'Test Event',
      description: 'This is a test event to verify Firebase write permissions',
      date: '2025-01-01',
      time: '12:00',
      location: 'Test Location',
      currentParticipants: 0,
      isActive: true,
      entryFee: 0,
      paymentMethod: 'online',
      isTeamEvent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'events'), testDoc);
    console.log('Firebase write test successful! Document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('Firebase write test failed:', error);
    return false;
  }
};

