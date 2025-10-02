export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  currentParticipants: number;
  maxParticipants?: number; // Added back for admin control
  isActive: boolean;
  entryFee: number;
  paymentMethod: 'online' | 'offline' | 'both';
  upiId?: string;
  isTeamEvent: boolean;
  teamSize?: number; // Number of team members required
  
  // Registration deadline fields
  registrationStartDate?: string; // YYYY-MM-DD format
  registrationStartTime?: string; // HH:MM format
  registrationEndDate?: string;   // YYYY-MM-DD format
  registrationEndTime?: string;   // HH:MM format
  allowLateRegistration?: boolean; // Admin/volunteer override
  
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  eventId: string;
  fullName: string; // Merged first and last name
  email: string;
  phone: string;
  college: string; // Added college name
  registrationDate: string;
  qrCode: string;
  isVerified: boolean;
  verificationTime?: string;
  teamId?: string; // For team events
  teamName?: string; // For team events
  isTeamLead?: boolean; // For team events
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
