export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // Will be set automatically based on eventDay
  time: string; // Will be set automatically
  roomNo?: string; // Optional room number set by admin
  currentParticipants: number;
  isActive: boolean;
  entryFee: number;
  paymentMethod: 'online' | 'offline' | 'both';
  upiId?: string;
  isTeamEvent: boolean;
  teamSize?: number; // Number of team members required
  maxTeams?: number; // Maximum number of teams allowed (for team events)
  eventDay: 'day1' | 'day2'; // Event categorization
  membersPerTeam?: number; // Number of members allowed per team
  
  // On-the-spot registration fields
  allowOnSpotRegistration?: boolean; // Allow on-the-spot registration when event is being held
  onSpotEntryFee?: number; // Different fee for on-the-spot registration
  onSpotPaymentMethod?: 'online' | 'offline' | 'both'; // Payment method for on-the-spot
  onSpotStartTime?: string; // HH:MM format - when on-the-spot registration starts
  onSpotEndTime?: string; // HH:MM format - when on-the-spot registration ends
  
  // Registration deadline fields (for regular registration)
  registrationStartDate?: string; // YYYY-MM-DD format
  registrationStartTime?: string; // HH:MM format
  registrationEndDate?: string;   // YYYY-MM-DD format
  registrationEndTime?: string;   // HH:MM format
  allowLateRegistration?: boolean; // Admin/volunteer override
  
  // Daily registration closure
  dailyRegistrationClosure?: {
    [date: string]: boolean; // YYYY-MM-DD format -> true if registration closed for that day
  };
  
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
  registrationType?: 'regular' | 'on_spot'; // Track registration type
  entryFeePaid?: number; // Track actual fee paid (for on-the-spot different pricing)
  paymentIdentifier?: string; // Unique identifier for UPI transaction matching
  assignedRoom?: string; // Room assigned during check-in/verification
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
