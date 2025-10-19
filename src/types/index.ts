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
  
  // Advanced registration controls
  registrationControls?: {
    allowAfterDeadline: boolean; // Allow registration after deadline
    allowAfterDeadlineForAdmins: boolean; // Allow admins to register after deadline
    allowAfterDeadlineForVolunteers: boolean; // Allow volunteers to register after deadline
    deadlineOverrideReason?: string; // Reason for allowing late registration
    setBy?: string; // Admin/volunteer who set the override
    setAt?: string; // When the override was set
  };
  
  // Daily registration closure
  dailyRegistrationClosure?: {
    [date: string]: boolean; // YYYY-MM-DD format -> true if registration closed for that day
  };
  
  // Day-wise registration controls
  dayWiseControls?: {
    day1?: {
      allowRegistration: boolean;
      registrationEndDate?: string;
      registrationEndTime?: string;
      allowLateRegistration?: boolean;
    };
    day2?: {
      allowRegistration: boolean;
      registrationEndDate?: string;
      registrationEndTime?: string;
      allowLateRegistration?: boolean;
    };
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
  standard: 'FY' | 'SY' | 'TY' | '11' | '12'; // Academic standard/year
  stream: string; // Academic stream (e.g., Computer Science, Electronics, etc.)
  registrationDate: string;
  qrCode: string;
  isVerified: boolean;
  verificationTime?: string;
  teamId?: string; // For team events
  teamName?: string; // For team events
  isTeamLead?: boolean; // For team events
  paymentStatus: 'pending' | 'under_verification' | 'paid' | 'offline_paid' | 'failed';
  paymentMethod?: 'online' | 'offline';
  receiptUrl?: string;
  transactionId?: string; // Optional transaction identifier entered by admin to match UPI transactions
  registrationType?: 'regular' | 'on_spot'; // Track registration type
  entryFeePaid?: number; // Track actual fee paid (for on-the-spot different pricing)
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
