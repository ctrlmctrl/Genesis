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
 * Check if regular registration is currently open for an event
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
 * Check if on-the-spot registration is available (event is being held during event hours)
 */
export const isOnSpotRegistrationAvailable = (event: Event): boolean => {
  if (!event.allowOnSpotRegistration) {
    return false;
  }
  
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Check if event is happening today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  
  if (today.getTime() !== eventDate.getTime()) {
    return false; // Not event day
  }
  
  // Check if we're within on-the-spot registration hours
  if (event.onSpotStartTime && event.onSpotEndTime) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = parseInt(event.onSpotStartTime.split(':')[0]) * 60 + parseInt(event.onSpotStartTime.split(':')[1]);
    const endTime = parseInt(event.onSpotEndTime.split(':')[0]) * 60 + parseInt(event.onSpotEndTime.split(':')[1]);
    
    return currentTime >= startTime && currentTime <= endTime;
  }
  
  // If no specific hours set, allow all day on event date
  return true;
};

/**
 * Check if registration is closed for a specific date
 */
export const isRegistrationClosedForDate = (event: Event, date: string): boolean => {
  if (!event.dailyRegistrationClosure) {
    return false;
  }
  
  return event.dailyRegistrationClosure[date] === true;
};

/**
 * Check if regular registration is available (considering daily closures)
 */
export const isRegularRegistrationAvailable = (event: Event): boolean => {
  // Check if registration is open based on dates
  if (!isRegistrationOpen(event)) {
    return false;
  }
  
  // Check if registration is closed for today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  if (isRegistrationClosedForDate(event, today)) {
    return false;
  }
  
  return true;
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
  
  // Check if regular registration is available (considering daily closures)
  if (isRegularRegistrationAvailable(event)) {
    return { canRegister: true };
  }
  
  // Check if on-the-spot registration is available
  if (isOnSpotRegistrationAvailable(event)) {
    return { 
      canRegister: true,
      reason: 'On-the-spot registration available'
    };
  }
  
  // Check if volunteers can register offline participants after deadline
  if (permissions.canRegisterOffline) {
    return { canRegister: true };
  }
  
  // Regular registration is closed and no on-the-spot available
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
    return {
      canRegister: false,
      reason: 'Registration deadline has passed'
    };
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
    
    // Check if it's on-the-spot registration
    if (isOnSpotRegistrationAvailable(event)) {
      return 'On-the-spot registration available';
    }
    
    // Check if regular registration is available
    if (isRegularRegistrationAvailable(event)) {
      return 'Registration is open';
    }
    
    // Check if registration is closed for today
    const today = new Date().toISOString().split('T')[0];
    if (isRegistrationClosedForDate(event, today)) {
      return 'Registration closed for today';
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
  status: 'not-started' | 'open' | 'closed' | 'on_spot';
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
    // Check if on-the-spot registration is available
    if (isOnSpotRegistrationAvailable(event)) {
      return {
        status: 'on_spot',
        message: 'On-the-spot registration available'
      };
    }
    
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

/**
 * Get the appropriate entry fee for registration type
 */
export const getEntryFee = (event: Event, registrationType: 'regular' | 'on_spot' = 'regular'): number => {
  if (registrationType === 'on_spot' && event.onSpotEntryFee !== undefined) {
    return event.onSpotEntryFee;
  }
  return event.entryFee;
};

/**
 * Get the appropriate payment method for registration type
 */
export const getPaymentMethod = (event: Event, registrationType: 'regular' | 'on_spot' = 'regular'): 'online' | 'offline' | 'both' => {
  if (registrationType === 'on_spot' && event.onSpotPaymentMethod) {
    return event.onSpotPaymentMethod;
  }
  return event.paymentMethod;
};

/**
 * Determine the registration type based on event status
 */
export const getRegistrationType = (event: Event): 'regular' | 'on_spot' => {
  if (isRegularRegistrationAvailable(event)) {
    return 'regular';
  }
  
  if (isOnSpotRegistrationAvailable(event)) {
    return 'on_spot';
  }
  
  return 'regular'; // Default fallback
};

/**
 * Toggle registration closure for a specific date
 */
export const toggleRegistrationClosureForDate = (event: Event, date: string): Event => {
  const updatedEvent = { ...event };
  
  if (!updatedEvent.dailyRegistrationClosure) {
    updatedEvent.dailyRegistrationClosure = {};
  }
  
  updatedEvent.dailyRegistrationClosure[date] = !updatedEvent.dailyRegistrationClosure[date];
  updatedEvent.updatedAt = new Date().toISOString();
  
  return updatedEvent;
};

