import { Event, Participant, ParticipantInfo, VerificationRecord } from '../types';
import { localStorageService } from './localStorageService';
import { QRCodeService } from './qrCodeService';
import { emailService } from './emailService';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Storage mode: 'firebase' | 'localStorage' | 'memory'
// Use Firebase for production, localStorage for development
const STORAGE_MODE = process.env.REACT_APP_STORAGE_MODE ||
  (process.env.NODE_ENV === 'production' ? 'firebase' : 'localStorage');

class DataService {
  private events: Event[] = [];
  private participants: Participant[] = [];
  private verificationRecords: VerificationRecord[] = [];
  private useFirebase: boolean;

  constructor() {
    this.useFirebase = STORAGE_MODE === 'firebase';
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      if (this.useFirebase) {
        // Initialize with Firebase - no need to load all data upfront
        await this.ensureSampleDataExists();
      } else {
        // Use localStorage for development/testing
        this.events = localStorageService.getEvents();
        this.participants = localStorageService.getParticipants();
        this.verificationRecords = localStorageService.getVerificationRecords();

        // Only create sample data in development mode
        if (this.events.length === 0 && process.env.NODE_ENV === 'development') {
          this.initializeSampleData();
        }
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      // Fallback to localStorage
      this.useFirebase = false;
      this.events = localStorageService.getEvents();
      this.participants = localStorageService.getParticipants();
      this.verificationRecords = localStorageService.getVerificationRecords();
    }
  }

  private async ensureSampleDataExists(): Promise<void> {
    try {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      if (eventsSnapshot.empty && process.env.NODE_ENV === 'development') {
        console.log('No events found, creating sample data for development...');
        await this.createSampleFirebaseData();
      }
    } catch (error) {
      console.error('Error checking sample data:', error);
    }
  }

  private async createSampleFirebaseData(): Promise<void> {
    try {
      // Create sample events in Firebase
      const sampleEvents = [
        {
          title: 'Tech Innovators Summit 2025',
          description: 'A summit for the brightest minds in technology to share ideas and innovations.',
          date: '2025-03-15',
          time: '09:00',
          location: 'https://maps.app.goo.gl/jEfDLpDuZxfNpzNu8',
          currentParticipants: 0,
          isActive: true,
          entryFee: 1500,
          paymentMethod: 'online' as const,
          upiId: 'techsummit@upi',
          isTeamEvent: false,
          registrationStartDate: '2025-02-01',
          registrationStartTime: '00:00',
          registrationEndDate: '2025-03-10',
          registrationEndTime: '23:59',
          allowLateRegistration: false
        },
        {
          title: 'CodeFest 2025',
          description: 'An intense 24-hour hackathon challenging developers to build innovative solutions.',
          date: '2025-04-22',
          time: '10:00',
          location: 'https://maps.app.goo.gl/jEfDLpDuZxfNpzNu8',
          currentParticipants: 0,
          isActive: true,
          entryFee: 500,
          paymentMethod: 'both' as const,
          upiId: 'codefest@upi',
          isTeamEvent: true,
          registrationStartDate: '2025-03-01',
          registrationStartTime: '00:00',
          registrationEndDate: '2025-04-15',
          registrationEndTime: '23:59',
          allowLateRegistration: true
        },
        {
          title: 'AI & ML Workshop',
          description: 'Hands-on workshop covering the latest advancements in Artificial Intelligence and Machine Learning.',
          date: '2025-05-10',
          time: '14:00',
          location: 'Online (Zoom)',
          currentParticipants: 0,
          isActive: true,
          entryFee: 750,
          paymentMethod: 'online' as const,
          upiId: 'aiml@upi',
          isTeamEvent: false,
          registrationStartDate: '2025-04-01',
          registrationStartTime: '00:00',
          registrationEndDate: '2025-05-05',
          registrationEndTime: '23:59',
          allowLateRegistration: false
        }
      ];

      for (const eventData of sampleEvents) {
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      console.log('Sample events created in Firebase');
    } catch (error) {
      console.error('Error creating sample Firebase data:', error);
    }
  }

  private async saveDataToStorage(): Promise<void> {
    if (!this.useFirebase) {
      try {
        localStorageService.saveEvents(this.events);
        localStorageService.saveParticipants(this.participants);
        localStorageService.saveVerificationRecords(this.verificationRecords);
      } catch (error) {
        console.error('Error saving data to storage:', error);
      }
    }
    // Firebase operations are handled individually in each method
  }

  // Event Management
  async createEvent(eventData: Omit<Event, 'id' | 'currentParticipants' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    if (this.useFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'events'), {
          ...eventData,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        const event: Event = {
          ...eventData,
          id: docRef.id,
          currentParticipants: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return event;
      } catch (error) {
        console.error('Error creating event in Firebase:', error);
        throw new Error('Failed to create event');
      }
    } else {
      const event: Event = {
        ...eventData,
        id: this.generateId(),
        currentParticipants: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.events.push(event);
      this.saveDataToStorage();
      return event;
    }
  }

  async getEvents(): Promise<Event[]> {
    if (this.useFirebase) {
      try {
        const q = query(collection(db, 'events'), where('isActive', '==', true));
        const querySnapshot = await getDocs(q);
        const events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        return events;
      } catch (error) {
        console.error('Error getting events from Firebase:', error);
        return [];
      }
    } else {
      return this.events.filter(event => event.isActive);
    }
  }

  async getEvent(eventId: string): Promise<Event | null> {
    if (this.useFirebase) {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Event;
        }
        return null;
      } catch (error) {
        console.error('Error getting event from Firebase:', error);
        return null;
      }
    } else {
      return this.events.find(event => event.id === eventId) || null;
    }
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    if (this.useFirebase) {
      try {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, { ...updates, updatedAt: new Date().toISOString() });
        const updatedDoc = await getDoc(eventRef);
        return updatedDoc.exists() ? { id: updatedDoc.id, ...updatedDoc.data() } as Event : null;
      } catch (error) {
        console.error('Error updating event in Firebase:', error);
        throw new Error('Failed to update event');
      }
    } else {
      const eventIndex = this.events.findIndex(event => event.id === eventId);
      if (eventIndex === -1) return null;

      this.events[eventIndex] = {
        ...this.events[eventIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveDataToStorage();
      return this.events[eventIndex];
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (this.useFirebase) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        return true;
      } catch (error) {
        console.error('Error deleting event from Firebase:', error);
        throw new Error('Failed to delete event');
      }
    } else {
      const initialLength = this.events.length;
      this.events = this.events.filter(event => event.id !== eventId);
      this.saveDataToStorage();
      return this.events.length < initialLength;
    }
  }

  // Participant Management
  async registerParticipant(participantData: Omit<Participant, 'id' | 'registrationDate' | 'qrCode' | 'isVerified' | 'paymentStatus'>, userRole?: string): Promise<Participant> {
    if (this.useFirebase) {
      return this.registerParticipantFirebase(participantData, userRole);
    }

    const event = this.events.find(e => e.id === participantData.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isActive) {
      throw new Error('Event is not active');
    }

    // Check registration controls
    const registrationStatus = this.checkRegistrationAvailability(event, userRole);
    if (!registrationStatus.allowed) {
      throw new Error(registrationStatus.reason);
    }


    if (event.isTeamEvent) {
      throw new Error('This is a team event. Please use team registration.');
    }

    const participantId = this.generateId();
    const uniqueQRCode = QRCodeService.generateUniqueQRCode();

    const participant: Participant = {
      ...participantData,
      id: participantId,
      registrationDate: new Date().toISOString(),
      qrCode: uniqueQRCode,
      isVerified: false,
      paymentStatus: 'pending',
    };

    this.participants.push(participant);

    // Update event participant count
    event.currentParticipants += 1;
    event.updatedAt = new Date().toISOString();

    this.saveDataToStorage();
    return participant;
  }

  private async registerParticipantFirebase(participantData: Omit<Participant, 'id' | 'registrationDate' | 'qrCode' | 'isVerified' | 'paymentStatus'>, userRole?: string): Promise<Participant> {
    try {
      // Check if event exists and is active
      const event = await this.getEvent(participantData.eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isActive) {
        throw new Error('Event is not active');
      }

      // Check registration controls
      const registrationStatus = this.checkRegistrationAvailability(event, userRole);
      if (!registrationStatus.allowed) {
        throw new Error(registrationStatus.reason);
      }


      if (event.isTeamEvent) {
        throw new Error('This is a team event. Please use team registration.');
      }

      const uniqueQRCode = QRCodeService.generateUniqueQRCode();

      const participantDoc = {
        ...participantData,
        registrationDate: new Date().toISOString(),
        qrCode: uniqueQRCode,
        isVerified: false,
        paymentStatus: 'pending' as const,
        // Only include optional fields if they have values
        ...(participantData as any).registrationType ? { registrationType: (participantData as any).registrationType } : {},
        ...(participantData as any).entryFeePaid ? { entryFeePaid: (participantData as any).entryFeePaid } : {},
        ...(participantData as any).assignedRoom ? { assignedRoom: (participantData as any).assignedRoom } : {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'participants'), participantDoc);

      const participant: Participant = {
        id: docRef.id,
        eventId: participantDoc.eventId,
        fullName: participantDoc.fullName,
        email: participantDoc.email,
        phone: participantDoc.phone,
        college: participantDoc.college,
        standard: participantDoc.standard,
        stream: participantDoc.stream,
        registrationDate: participantDoc.registrationDate,
        qrCode: participantDoc.qrCode,
        isVerified: participantDoc.isVerified,
        paymentStatus: participantDoc.paymentStatus,
        paymentMethod: participantDoc.paymentMethod,
        receiptUrl: participantDoc.receiptUrl,
        verificationTime: participantDoc.verificationTime,
        teamId: participantDoc.teamId,
        teamName: participantDoc.teamName,
        isTeamLead: participantDoc.isTeamLead,
        registrationType: participantDoc.registrationType,
        entryFeePaid: participantDoc.entryFeePaid,
        assignedRoom: participantDoc.assignedRoom
      };

      // Update event participant count
      await this.updateEvent(participantData.eventId, {
        currentParticipants: event.currentParticipants + 1
      });

      return participant;
    } catch (error) {
      console.error('Error registering participant in Firebase:', error);
      throw new Error('Failed to register participant');
    }
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    if (this.useFirebase) {
      try {
        const docRef = doc(db, 'participants', participantId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Participant;
        }
        return null;
      } catch (error) {
        console.error('Error getting participant from Firebase:', error);
        return null;
      }
    }
    return this.participants.find(p => p.id === participantId) || null;
  }

  async getParticipantByQRCode(qrCode: string): Promise<Participant | null> {
    console.log('Looking up participant with QR code:', qrCode);
    console.log('Using Firebase:', this.useFirebase);

    if (this.useFirebase) {
      try {
        const q = query(collection(db, 'participants'), where('qrCode', '==', qrCode));
        const querySnapshot = await getDocs(q);
        console.log('Firebase query result:', querySnapshot.docs.length, 'documents found');

        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const participant = { id: doc.id, ...doc.data() } as Participant;
          console.log('Found participant in Firebase:', participant);
          return participant;
        }
        console.log('No participant found in Firebase for QR code:', qrCode);
        return null;
      } catch (error) {
        console.error('Error getting participant by QR code from Firebase:', error);
        return null;
      }
    }

    console.log('Searching in localStorage participants:', this.participants.length);
    const found = this.participants.find(p => p.qrCode === qrCode) || null;
    console.log('Found participant in localStorage:', found);
    return found;
  }

  async getParticipants(): Promise<Participant[]> {
    if (this.useFirebase) {
      try {
        const querySnapshot = await getDocs(collection(db, 'participants'));
        const participants = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
        return participants;
      } catch (error) {
        console.error('Error getting participants from Firebase:', error);
        return [];
      }
    }
    return this.participants;
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    if (this.useFirebase) {
      try {
        const q = query(collection(db, 'participants'), where('eventId', '==', eventId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
      } catch (error) {
        console.error('Error getting participants by event from Firebase:', error);
        return [];
      }
    }
    return this.participants.filter(p => p.eventId === eventId);
  }

  async getParticipantsByEmail(email: string): Promise<Participant[]> {
    if (this.useFirebase) {
      try {
        const q = query(collection(db, 'participants'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Participant[];
      } catch (error) {
        console.error('Error getting participants by email from Firebase:', error);
        return [];
      }
    }
    return this.participants.filter(p => p.email === email);
  }

  async getParticipantsByEventCount(eventId: string): Promise<number> {
    const participants = await this.getParticipantsByEvent(eventId);
    return participants.length;
  }

  async getCurrentTeamCount(eventId: string): Promise<number> {
    const participants = await this.getParticipantsByEvent(eventId);
    const uniqueTeams = new Set(participants.map(p => p.teamName).filter(Boolean));
    return uniqueTeams.size;
  }

  async registerTeam(eventId: string, teamName: string, teamMembers: Omit<Participant, 'id' | 'eventId' | 'qrCode' | 'registrationDate' | 'isVerified' | 'paymentStatus'>[]): Promise<Participant[]> {
    if (this.useFirebase) {
      return this.registerTeamFirebase(eventId, teamName, teamMembers);
    }

    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isTeamEvent) {
      throw new Error('This is not a team event');
    }

    const requiredMembers = event.membersPerTeam || 1;
    if (teamMembers.length !== requiredMembers) {
      throw new Error(`Team must have exactly ${requiredMembers} members`);
    }

    const teamId = `team-${Date.now()}`;
    const registeredMembers: Participant[] = [];

    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      const participantId = this.generateId();
      const uniqueQRCode = QRCodeService.generateUniqueQRCode();

      const participant: Participant = {
        id: participantId,
        eventId,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        college: member.college,
        standard: member.standard,
        stream: member.stream,
        registrationDate: new Date().toISOString(),
        qrCode: uniqueQRCode,
        isVerified: false,
        teamId,
        teamName,
        isTeamLead: i === 0, // First member is team lead
        paymentStatus: 'pending',
      };

      this.participants.push(participant);
      registeredMembers.push(participant);
    }

    // Update event participant count
    event.currentParticipants += teamMembers.length;
    event.updatedAt = new Date().toISOString();

    this.saveDataToStorage();
    return registeredMembers;
  }

  private async registerTeamFirebase(eventId: string, teamName: string, teamMembers: Omit<Participant, 'id' | 'eventId' | 'qrCode' | 'registrationDate' | 'isVerified' | 'paymentStatus'>[]): Promise<Participant[]> {
    try {
      // Check if event exists and is a team event
      const event = await this.getEvent(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      if (!event.isTeamEvent) {
        throw new Error('This is not a team event');
      }

      const requiredMembers = event.membersPerTeam || 1;
      if (teamMembers.length < 1) {
        throw new Error('Team must have at least one member');
      }
      if (teamMembers.length > requiredMembers) {
        throw new Error(`Team cannot have more than ${requiredMembers} members`);
      }

      const teamId = `team-${Date.now()}`;
      const registeredMembers: Participant[] = [];

      for (let i = 0; i < teamMembers.length; i++) {
        const member = teamMembers[i];
        const uniqueQRCode = QRCodeService.generateUniqueQRCode();

        // Only add optional fields if they are defined
        const participantDoc: any = {
          eventId,
          fullName: member.fullName,
          email: member.email,
          phone: member.phone,
          college: member.college,
          standard: member.standard,
          stream: member.stream,
          registrationDate: new Date().toISOString(),
          qrCode: uniqueQRCode,
          isVerified: false,
          teamId,
          teamName,
          isTeamLead: i === 0, // First member is team lead
          paymentStatus: 'pending' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        if ((member as any).registrationType !== undefined) participantDoc.registrationType = (member as any).registrationType;
        if ((member as any).entryFeePaid !== undefined) participantDoc.entryFeePaid = (member as any).entryFeePaid;
        if ((member as any).assignedRoom !== undefined) participantDoc.assignedRoom = (member as any).assignedRoom;

        const docRef = await addDoc(collection(db, 'participants'), participantDoc);

        const participant: Participant = {
          id: docRef.id,
          eventId: participantDoc.eventId,
          fullName: participantDoc.fullName,
          email: participantDoc.email,
          phone: participantDoc.phone,
          college: participantDoc.college,
          standard: participantDoc.standard,
          stream: participantDoc.stream,
          registrationDate: participantDoc.registrationDate,
          qrCode: participantDoc.qrCode,
          isVerified: participantDoc.isVerified,
          paymentStatus: participantDoc.paymentStatus,
          paymentMethod: participantDoc.paymentMethod,
          receiptUrl: participantDoc.receiptUrl,
          verificationTime: participantDoc.verificationTime,
          teamId: participantDoc.teamId,
          teamName: participantDoc.teamName,
          isTeamLead: participantDoc.isTeamLead,
          ...(participantDoc.registrationType ? { registrationType: participantDoc.registrationType } : {}),
          ...(participantDoc.entryFeePaid ? { entryFeePaid: participantDoc.entryFeePaid } : {}),
          ...(participantDoc.assignedRoom ? { assignedRoom: participantDoc.assignedRoom } : {})
        };

        registeredMembers.push(participant);
      }

      // Update event participant count
      await this.updateEvent(eventId, {
        currentParticipants: event.currentParticipants + teamMembers.length
      });

      return registeredMembers;
    } catch (error) {
      console.error('Error registering team in Firebase:', error);
      throw new Error('Failed to register team');
    }
  }

  async getParticipantsByTeam(teamId: string): Promise<Participant[]> {
    return this.participants.filter(p => p.teamId === teamId);
  }

  async updateParticipantInfo(participantId: string, info: ParticipantInfo): Promise<Participant | null> {
    const participantIndex = this.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return null;

    // Note: additionalInfo is no longer part of Participant interface
    // This method is kept for compatibility but doesn't update anything
    return this.participants[participantIndex];
  }

  async updatePaymentStatus(participantId: string, paymentStatus: 'pending' | 'under_verification' | 'paid' | 'offline_paid' | 'failed', paymentMethod?: 'online' | 'offline', receiptUrl?: string, transactionId?: string): Promise<Participant | null> {
    if (this.useFirebase) {
      return this.updatePaymentStatusFirebase(participantId, paymentStatus, paymentMethod, receiptUrl, transactionId);
    }

    const participantIndex = this.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return null;

    const oldStatus = this.participants[participantIndex].paymentStatus;
    this.participants[participantIndex].paymentStatus = paymentStatus;
    if (paymentMethod) this.participants[participantIndex].paymentMethod = paymentMethod;
    if (receiptUrl) this.participants[participantIndex].receiptUrl = receiptUrl;
    if (transactionId) this.participants[participantIndex].transactionId = transactionId;

    // Send email notification if status changed to verified or failed
    if (oldStatus !== paymentStatus && (paymentStatus === 'paid' || paymentStatus === 'offline_paid' || paymentStatus === 'failed')) {
      await this.sendPaymentNotification(this.participants[participantIndex]);
    }

    this.saveDataToStorage();
    return this.participants[participantIndex];
  }

  private async updatePaymentStatusFirebase(participantId: string, paymentStatus: 'pending' | 'under_verification' | 'paid' | 'offline_paid' | 'failed', paymentMethod?: 'online' | 'offline', receiptUrl?: string, transactionId?: string): Promise<Participant | null> {
    try {
      const participantRef = doc(db, 'participants', participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) {
        return null;
      }

      const participantData = participantDoc.data() as Participant;
      const oldStatus = participantData.paymentStatus;

      const updateData: any = {
        paymentStatus,
        updatedAt: new Date().toISOString()
      };

      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (receiptUrl) updateData.receiptUrl = receiptUrl;
      if (transactionId) updateData.transactionId = transactionId;

      await updateDoc(participantRef, updateData);

      // Send email notification if status changed to verified or failed
      if (oldStatus !== paymentStatus && (paymentStatus === 'paid' || paymentStatus === 'offline_paid' || paymentStatus === 'failed')) {
        const updatedParticipant = { ...participantData, ...updateData };
        await this.sendPaymentNotification(updatedParticipant);
      }

      return { ...participantData, ...updateData };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return null;
    }
  }

  private async sendPaymentNotification(participant: Participant): Promise<void> {
    try {
      // Get event details
      const event = await this.getEvent(participant.eventId);
      if (!event) return;

      // Get team lead email if this is a team event
      let teamLeadEmail: string | undefined;
      if (participant.teamId) {
        const teamMembers = this.participants.filter(p => p.teamId === participant.teamId);
        const teamLead = teamMembers.find(p => p.isTeamLead);
        if (teamLead) {
          teamLeadEmail = teamLead.email;
        }
      }

      await emailService.sendPaymentNotification({
        participantName: participant.fullName,
        eventTitle: event.title,
        paymentStatus: participant.paymentStatus as 'paid' | 'offline_paid' | 'failed',
        paymentMethod: participant.paymentMethod,
        amount: participant.entryFeePaid,
        teamName: participant.teamName,
        isTeamLead: participant.isTeamLead,
        participantEmail: participant.email,
        teamLeadEmail: teamLeadEmail
      });
    } catch (error) {
      console.error('Error sending payment notification:', error);
    }
  }

  // Registration Control Validation
  private checkRegistrationAvailability(event: Event, userRole?: string): { allowed: boolean; reason: string } {
    const now = new Date();

    // Check day-wise controls first
    if (event.dayWiseControls) {
      const dayControl = event.dayWiseControls[event.eventDay];
      if (dayControl && !dayControl.allowRegistration) {
        return {
          allowed: false,
          reason: `Registration is currently closed for ${event.eventDay} events`
        };
      }

      if (dayControl?.registrationEndDate && dayControl?.registrationEndTime) {
        const endDateTime = new Date(`${dayControl.registrationEndDate}T${dayControl.registrationEndTime}`);
        if (now > endDateTime && !dayControl.allowLateRegistration) {
          return {
            allowed: false,
            reason: `Registration deadline for ${event.eventDay} events has passed`
          };
        }
      }
    }

    // Check event-specific registration deadline
    if (event.registrationEndDate && event.registrationEndTime) {
      const endDateTime = new Date(`${event.registrationEndDate}T${event.registrationEndTime}`);
      if (now > endDateTime) {
        // Check if late registration is allowed
        if (event.registrationControls?.allowAfterDeadline) {
          return { allowed: true, reason: 'Late registration allowed' };
        }

        // Check role-based permissions
        if (userRole === 'admin' && event.registrationControls?.allowAfterDeadlineForAdmins) {
          return { allowed: true, reason: 'Admin late registration allowed' };
        }

        if (userRole === 'volunteer' && event.registrationControls?.allowAfterDeadlineForVolunteers) {
          return { allowed: true, reason: 'Volunteer late registration allowed' };
        }

        return {
          allowed: false,
          reason: 'Registration deadline has passed'
        };
      }
    }

    // Check if registration is within allowed time window
    if (event.registrationStartDate && event.registrationStartTime) {
      const startDateTime = new Date(`${event.registrationStartDate}T${event.registrationStartTime}`);
      if (now < startDateTime) {
        return {
          allowed: false,
          reason: 'Registration has not started yet'
        };
      }
    }

    return { allowed: true, reason: 'Registration is available' };
  }



  // QR Code Verification
  async verifyParticipant(participantId: string, volunteerId: string, assignedRoom?: string): Promise<boolean> {
    if (this.useFirebase) {
      return this.verifyParticipantFirebase(participantId, volunteerId, assignedRoom);
    }

    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) return false;

    participant.isVerified = true;
    participant.verificationTime = new Date().toISOString();
    if (assignedRoom) {
      participant.assignedRoom = assignedRoom;
    }

    // Record verification
    const verificationRecord: VerificationRecord = {
      id: this.generateId(),
      participantId,
      volunteerId,
      timestamp: new Date().toISOString(),
    };

    this.verificationRecords.push(verificationRecord);
    this.saveDataToStorage();
    return true;
  }

  private async verifyParticipantFirebase(participantId: string, volunteerId: string, assignedRoom?: string): Promise<boolean> {
    try {
      // Update participant verification status
      const participantRef = doc(db, 'participants', participantId);
      const updateData: any = {
        isVerified: true,
        verificationTime: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (assignedRoom) {
        updateData.assignedRoom = assignedRoom;
      }

      await updateDoc(participantRef, updateData);

      // Create verification record
      const verificationRecord = {
        participantId,
        volunteerId,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'verification_records'), verificationRecord);
      return true;
    } catch (error) {
      console.error('Error verifying participant in Firebase:', error);
      return false;
    }
  }

  async getVerificationRecords(eventId: string): Promise<VerificationRecord[]> {
    const eventParticipants = this.participants.filter(p => p.eventId === eventId);
    const participantIds = eventParticipants.map(p => p.id);
    return this.verificationRecords.filter(vr => participantIds.includes(vr.participantId));
  }

  // Analytics
  async getEventStats(eventId: string) {
    const participants = this.participants.filter(p => p.eventId === eventId);
    const verified = participants.filter(p => p.isVerified);

    return {
      totalParticipants: participants.length,
      verifiedParticipants: verified.length,
      pendingVerification: participants.length - verified.length,
      verificationRate: participants.length > 0 ? (verified.length / participants.length) * 100 : 0,
    };
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }


  // Initialize with sample data
  initializeSampleData() {
    const sampleEvent1: Event = {
      id: 'sample-event-1',
      title: 'Tech Conference 2024',
      description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing. Join industry leaders for networking and knowledge sharing.',
      date: '2024-11-13',
      time: '10:00',
      roomNo: 'Main Auditorium',
      currentParticipants: 0,
      isActive: true,
      entryFee: 500,
      paymentMethod: 'both',
      upiId: 'genesis@upi',
      isTeamEvent: false,
      eventDay: 'day1',
      membersPerTeam: 1,
      registrationStartDate: '2024-10-01',
      registrationStartTime: '00:00',
      registrationEndDate: '2024-11-10',
      registrationEndTime: '23:59',
      allowLateRegistration: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sampleEvent2: Event = {
      id: 'sample-event-2',
      title: 'Hackathon 2024',
      description: '48-hour coding competition for teams of 4. Build innovative solutions and win prizes!',
      date: '2024-11-14',
      time: '10:00',
      roomNo: 'Computer Lab A',
      currentParticipants: 0,
      isActive: true,
      entryFee: 200,
      paymentMethod: 'both',
      upiId: 'hackathon@upi',
      isTeamEvent: true,
      eventDay: 'day2',
      membersPerTeam: 4,
      registrationStartDate: '2024-10-15',
      registrationStartTime: '00:00',
      registrationEndDate: '2024-11-10',
      registrationEndTime: '23:59',
      allowLateRegistration: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.push(sampleEvent1, sampleEvent2);
  }
}

export const dataService = new DataService();
