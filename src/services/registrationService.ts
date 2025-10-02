// Registration Service with Deadline Management
// Genesis Event Manager

import { Event } from '../types';
import { checkUserRole, getUserPermissions } from '../config/credentials';

export interface RegistrationStatus {
  canRegister: boolean;
  reason?: string;
  timeRemaining?: string;
}

/**
 * Check if registration is currently open for an event
 */
export const isRegistrationOpen = (event: Event): boolean => {
  if (!event.registrationStartDate || !event.registrationEndDate) {
    // If no dates set, registration is always open
    return true;
  }
  
  const now = new Date();
  const startDateTime = new Date(`${event.registrationStartDate}T${event.registrationStartTime || '00:00'}`);
  const endDateTime = new Date(`${event.registrationEndDate}T${event.registrationEndTime || '23:59'}`);
  
  return now >= startDateTime && now <= endDateTime;
};

/**
 * Check if a user can register for an event
 */
export const canUserRegister = (event: Event, userEmail?: string): RegistrationStatus => {
  if (!userEmail) {
    return {
      canRegister: false,
      reason: 'Please sign in with Google to register for events'
    };
  }
  
  const userRole = checkUserRole(userEmail);
  const permissions = getUserPermissions(userRole);
  
  // Admin can always register (override deadlines)
  if (permissions.canOverrideDeadlines) {
    return { canRegister: true };
  }
  
  // Check if event is active
  if (!event.isActive) {
    return {
      canRegister: false,
      reason: 'This event is no longer active'
    };
  }
  
  // Check participant limits
  if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
    // Volunteers can register offline participants even when full
    if (permissions.canRegisterOffline) {
      return { canRegister: true };
    }
    
    return {
      canRegister: false,
      reason: 'Event is full. No more registrations accepted.'
    };
  }
  
  // Check registration deadline
  if (!isRegistrationOpen(event)) {
    const now = new Date();
    const startDateTime = event.registrationStartDate ? 
      new Date(`${event.registrationStartDate}T${event.registrationStartTime || '00:00'}`) : null;
    const endDateTime = event.registrationEndDate ? 
      new Date(`${event.registrationEndDate}T${event.registrationEndTime || '23:59'}`) : null;
    
    if (startDateTime && now < startDateTime) {
      return {
        canRegister: false,
        reason: 'Registration has not started yet',
        timeRemaining: getTimeUntil(startDateTime)
      };
    }
    
    if (endDateTime && now > endDateTime) {
      // Volunteers can still register offline participants after deadline
      if (permissions.canRegisterOffline) {
        return { canRegister: true };
      }
      
      return {
        canRegister: false,
        reason: 'Registration deadline has passed'
      };
    }
  }
  
  return { canRegister: true };
};

/**
 * Get time remaining until a specific date
 */
export const getTimeUntil = (targetDate: Date): string => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Time has passed';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

/**
 * Get registration status message for display
 */
export const getRegistrationStatusMessage = (event: Event, userEmail?: string): string => {
  const status = canUserRegister(event, userEmail);
  
  if (status.canRegister) {
    const userRole = userEmail ? checkUserRole(userEmail) : 'participant';
    
    if (userRole === 'admin' || userRole === 'volunteer') {
      return 'You can register participants (staff access)';
    }
    
    if (!isRegistrationOpen(event)) {
      return 'Registration closed, but you have staff access';
    }
    
    return 'Registration is open';
  }
  
  return status.reason || 'Registration not available';
};

/**
 * Validate registration deadline settings
 */
export const validateRegistrationDates = (
  startDate: string, 
  startTime: string, 
  endDate: string, 
  endTime: string,
  eventDate: string
): { valid: boolean; error?: string } => {
  if (!startDate || !endDate) {
    return { valid: true }; // Optional dates
  }
  
  const startDateTime = new Date(`${startDate}T${startTime || '00:00'}`);
  const endDateTime = new Date(`${endDate}T${endTime || '23:59'}`);
  const eventDateTime = new Date(eventDate);
  
  if (startDateTime >= endDateTime) {
    return {
      valid: false,
      error: 'Registration start date must be before end date'
    };
  }
  
  if (endDateTime > eventDateTime) {
    return {
      valid: false,
      error: 'Registration must end before the event date'
    };
  }
  
  return { valid: true };
};

/**
 * Get registration countdown for display
 */
export const getRegistrationCountdown = (event: Event): {
  status: 'not-started' | 'open' | 'closed';
  message: string;
  timeRemaining?: string;
} => {
  if (!event.registrationStartDate || !event.registrationEndDate) {
    return {
      status: 'open',
      message: 'Registration is open'
    };
  }
  
  const now = new Date();
  const startDateTime = new Date(`${event.registrationStartDate}T${event.registrationStartTime || '00:00'}`);
  const endDateTime = new Date(`${event.registrationEndDate}T${event.registrationEndTime || '23:59'}`);
  
  if (now < startDateTime) {
    return {
      status: 'not-started',
      message: 'Registration opens in',
      timeRemaining: getTimeUntil(startDateTime)
    };
  }
  
  if (now > endDateTime) {
    return {
      status: 'closed',
      message: 'Registration closed'
    };
  }
  
  return {
    status: 'open',
    message: 'Registration closes in',
    timeRemaining: getTimeUntil(endDateTime)
  };
};
