// JSON Server Service for development with mock API
import { Event, Participant, VerificationRecord } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class JsonServerService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Events
  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    return this.request<Event>('/events', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });
  }

  async getEvents(): Promise<Event[]> {
    return this.request<Event[]>('/events');
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    return this.request<Event>(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...updates,
        updatedAt: new Date().toISOString()
      })
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.request(`/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  // Participants
  async createParticipant(participant: Omit<Participant, 'id' | 'registrationDate' | 'qrCode' | 'isVerified' | 'paymentStatus'>): Promise<Participant> {
    return this.request<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify({
        ...participant,
        registrationDate: new Date().toISOString(),
        qrCode: this.generateQRCode(participant.eventId, participant.email),
        isVerified: false,
        paymentStatus: 'pending'
      })
    });
  }

  async getParticipants(): Promise<Participant[]> {
    return this.request<Participant[]>('/participants');
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    return this.request<Participant[]>(`/participants?eventId=${eventId}`);
  }

  async updateParticipant(participantId: string, updates: Partial<Participant>): Promise<Participant> {
    return this.request<Participant>(`/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Verification Records
  async createVerificationRecord(record: Omit<VerificationRecord, 'id'>): Promise<VerificationRecord> {
    return this.request<VerificationRecord>('/verification_records', {
      method: 'POST',
      body: JSON.stringify(record)
    });
  }

  async getVerificationRecords(): Promise<VerificationRecord[]> {
    return this.request<VerificationRecord[]>('/verification_records');
  }

  private generateQRCode(eventId: string, email: string): string {
    return `https://your-app.com/verify/${eventId}/${email}`;
  }
}

export const jsonServerService = new JsonServerService();
