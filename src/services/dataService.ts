import { Event, Participant, ParticipantInfo, VerificationRecord } from '../types';

// In a real application, this would be replaced with actual API calls
class DataService {
  private events: Event[] = [];
  private participants: Participant[] = [];
  private verificationRecords: VerificationRecord[] = [];

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
    const participant: Participant = {
      ...participantData,
      id: this.generateId(),
      registrationDate: new Date().toISOString(),
      qrCode: this.generateQRCode(participantData.eventId, participantData.email),
      isVerified: false,
      paymentStatus: 'pending',
    };

    this.participants.push(participant);

    // Update event participant count
    const event = this.events.find(e => e.id === participantData.eventId);
    if (event) {
      event.currentParticipants += 1;
    }

    return participant;
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    return this.participants.find(p => p.id === participantId) || null;
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    return this.participants.filter(p => p.eventId === eventId);
  }

  async updateParticipantInfo(participantId: string, info: ParticipantInfo): Promise<Participant | null> {
    const participantIndex = this.participants.findIndex(p => p.id === participantId);
    if (participantIndex === -1) return null;

    this.participants[participantIndex].additionalInfo = info;
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

  private generateQRCode(eventId: string, email: string): string {
    // In a real app, this would generate a proper QR code
    return `EVENT:${eventId}:${email}:${Date.now()}`;
  }

  // Initialize with sample data
  initializeSampleData() {
    const sampleEvent: Event = {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.push(sampleEvent);
  }
}

export const dataService = new DataService();
