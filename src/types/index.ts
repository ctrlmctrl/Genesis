export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  currentParticipants: number;
  isActive: boolean;
  entryFee: number;
  paymentMethod: 'online' | 'offline' | 'both';
  upiId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  registrationDate: string;
  qrCode: string;
  isVerified: boolean;
  verificationTime?: string;
  additionalInfo?: ParticipantInfo;
  paymentStatus: 'pending' | 'paid' | 'offline_paid';
  paymentMethod?: 'online' | 'offline';
  paymentId?: string;
  receiptUrl?: string;
}

export interface ParticipantInfo {
  age: number;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRestrictions?: string;
  medicalConditions?: string;
  tshirtSize?: string;
  specialRequests?: string;
}

export interface VerificationRecord {
  id: string;
  participantId: string;
  volunteerId: string;
  timestamp: string;
  location?: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}
