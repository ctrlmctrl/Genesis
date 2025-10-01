import { Event, Participant, ParticipantInfo, VerificationRecord } from '../types';
import { localStorageService } from './localStorageService';

// In a real application, this would be replaced with actual API calls
class DataService {
  private events: Event[] = [];
  private participants: Participant[] = [];
  private verificationRecords: VerificationRecord[] = [];

  constructor() {
    this.loadDataFromStorage();
    if (this.events.length === 0) {
      this.initializeSampleData();
    }
  }

  private async loadDataFromStorage(): Promise<void> {
    try {
      // For now, use localStorage directly since storageService integration needs more work
      this.events = localStorageService.getEvents();
      this.participants = localStorageService.getParticipants();
      this.verificationRecords = localStorageService.getVerificationRecords();
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }

  private async saveDataToStorage(): Promise<void> {
    try {
      // Use localStorage directly for now
      localStorageService.saveEvents(this.events);
      localStorageService.saveParticipants(this.participants);
      localStorageService.saveVerificationRecords(this.verificationRecords);
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  }

  // Event Management
  async createEvent(eventData: Omit<Event, 'id' | 'currentParticipants' | 'createdAt' | 'updatedAt'>): Promise<Event> {
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

  async getEvents(): Promise<Event[]> {
    return this.events.filter(event => event.isActive);
  }

  async getEvent(eventId: string): Promise<Event | null> {
    return this.events.find(event => event.id === eventId) || null;
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event | null> {
    const eventIndex = this.events.findIndex(event => event.id === eventId);
    if (eventIndex === -1) return null;

    this.events[eventIndex] = {
      ...this.events[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.events[eventIndex];
  }

  // Participant Management
  async registerParticipant(participantData: Omit<Participant, 'id' | 'registrationDate' | 'qrCode' | 'isVerified' | 'paymentStatus'>): Promise<Participant> {
    const event = this.events.find(e => e.id === participantData.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isActive) {
      throw new Error('Event is not active');
    }

    if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    if (event.isTeamEvent) {
      throw new Error('This is a team event. Please use team registration.');
    }

    const participantId = this.generateId();
    const participant: Participant = {
      ...participantData,
      id: participantId,
      registrationDate: new Date().toISOString(),
      qrCode: this.generateQRCode(participantData.eventId, participantData.email, participantId),
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

  async getParticipant(participantId: string): Promise<Participant | null> {
    return this.participants.find(p => p.id === participantId) || null;
  }

  async getParticipants(): Promise<Participant[]> {
    return this.participants;
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    return this.participants.filter(p => p.eventId === eventId);
  }

  async registerTeam(eventId: string, teamName: string, teamMembers: Omit<Participant, 'id' | 'eventId' | 'qrCode' | 'registrationDate' | 'isVerified' | 'paymentStatus'>[]): Promise<Participant[]> {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.isTeamEvent) {
      throw new Error('This is not a team event');
    }

    if (teamMembers.length !== (event.teamSize || 1)) {
      throw new Error(`Team must have exactly ${event.teamSize} members`);
    }

    const teamId = `team-${Date.now()}`;
    const registeredMembers: Participant[] = [];

    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
        const participantId = `participant-${Date.now()}-${i}`;
        const participant: Participant = {
          id: participantId,
          eventId,
          fullName: member.fullName,
          email: member.email,
          phone: member.phone,
          college: member.college,
          registrationDate: new Date().toISOString(),
          qrCode: this.generateQRCode(eventId, member.email, participantId),
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

  async updatePaymentStatus(participantId: string, paymentStatus: 'pending' | 'paid' | 'offline_paid', paymentMethod?: 'online' | 'offline', paymentId?: string, receiptUrl?: string): Promise<Participant | null> {
    const participantIndex = this.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return null;

    this.participants[participantIndex].paymentStatus = paymentStatus;
    if (paymentMethod) this.participants[participantIndex].paymentMethod = paymentMethod;
    if (paymentId) this.participants[participantIndex].paymentId = paymentId;
    if (receiptUrl) this.participants[participantIndex].receiptUrl = receiptUrl;

    return this.participants[participantIndex];
  }

  // QR Code Verification
  async verifyParticipant(participantId: string, volunteerId: string): Promise<boolean> {
    const participant = this.participants.find(p => p.id === participantId);
    if (!participant) return false;

    participant.isVerified = true;
    participant.verificationTime = new Date().toISOString();

    // Record verification
    const verificationRecord: VerificationRecord = {
      id: this.generateId(),
      participantId,
      volunteerId,
      timestamp: new Date().toISOString(),
    };

    this.verificationRecords.push(verificationRecord);
    return true;
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

  private generateQRCode(eventId: string, email: string, participantId?: string): string {
    // Generate QR code with participant ID for scanning
    const id = participantId || this.generateId();
    return `EVENT:${eventId}:${id}:${email}:${Date.now()}`;
  }

  // Initialize with sample data
  initializeSampleData() {
    const sampleEvent1: Event = {
      id: 'sample-event-1',
      title: 'Tech Conference 2024',
      description: 'Annual technology conference featuring the latest innovations in AI, blockchain, and cloud computing. Join industry leaders for networking and knowledge sharing.',
      date: '2024-03-15',
      time: '09:00',
      location: 'Convention Center, Downtown',
      currentParticipants: 0,
      isActive: true,
      entryFee: 500,
      paymentMethod: 'both',
      upiId: 'genesis@upi',
      isTeamEvent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sampleEvent2: Event = {
      id: 'sample-event-2',
      title: 'Hackathon 2024',
      description: '48-hour coding competition for teams of 4. Build innovative solutions and win prizes!',
      date: '2024-03-20',
      time: '10:00',
      location: 'Tech Hub, Bangalore',
      currentParticipants: 0,
      maxParticipants: 100,
      isActive: true,
      entryFee: 200,
      paymentMethod: 'both',
      upiId: 'hackathon@upi',
      isTeamEvent: true,
      teamSize: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.push(sampleEvent1, sampleEvent2);
  }
}

export const dataService = new DataService();
