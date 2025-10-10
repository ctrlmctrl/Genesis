// Production Credentials Configuration
// Genesis Event Manager

/**
 * ADMIN CREDENTIALS
 * Users with these email addresses will automatically get admin access
 * 
 * Admin Permissions:
 * - Create, edit, delete events
 * - Export participant data
 * - Register participants offline
 * - Override registration deadlines
 * - Access all system features
 */
export const ADMIN_CREDENTIALS = {
  emails: [
    'ctrlmctrl@gmail.com',           // Replace with your admin email
    'organizer@yourdomain.com',       // Replace with organizer email
    'manager@yourdomain.com'          // Add more admin emails as needed
  ]
};

/**
 * VOLUNTEER CREDENTIALS  
 * Users with these email addresses will automatically get volunteer access
 * 
 * Volunteer Permissions:
 * - Scan QR codes and check in participants
 * - View participant details
 * - Export participant data
 * - Register participants offline
 * - View event analytics
 */
export const VOLUNTEER_CREDENTIALS = {
  emails: [
    'volunteer@yourdomain.com',       // Replace with volunteer email
    'staff@yourdomain.com',           // Replace with staff email
    'helper@yourdomain.com'           // Add more volunteer emails as needed
  ]
};

/**
 * ROLE CHECKING FUNCTION
 * Determines user role based on email address
 */
export const checkUserRole = (email: string): 'admin' | 'volunteer' | 'participant' => {
  if (!email) return 'participant';
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check admin emails
  if (ADMIN_CREDENTIALS.emails.some(adminEmail => 
    adminEmail.toLowerCase() === normalizedEmail
  )) {
    return 'admin';
  }
  
  // Check volunteer emails
  if (VOLUNTEER_CREDENTIALS.emails.some(volunteerEmail => 
    volunteerEmail.toLowerCase() === normalizedEmail
  )) {
    return 'volunteer';
  }
  
  // Default to participant
  return 'participant';
};

/**
 * PERMISSION CHECKING FUNCTIONS
 */
export const getUserPermissions = (role: 'admin' | 'volunteer' | 'participant') => {
  switch (role) {
    case 'admin':
      return {
        canCreateEvents: true,
        canEditEvents: true,
        canDeleteEvents: true,
        canExportData: true,
        canRegisterOffline: true,
        canOverrideDeadlines: true,
        canAccessAnalytics: true,
        canManageUsers: true,
        canScanQR: true,
        canViewAllParticipants: true
      };
      
    case 'volunteer':
      return {
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canExportData: true,
        canRegisterOffline: true,
        canOverrideDeadlines: false,
        canAccessAnalytics: true,
        canManageUsers: false,
        canScanQR: true,
        canViewAllParticipants: true
      };
      
    default: // participant
      return {
        canCreateEvents: false,
        canEditEvents: false,
        canDeleteEvents: false,
        canExportData: false,
        canRegisterOffline: false,
        canOverrideDeadlines: false,
        canAccessAnalytics: false,
        canManageUsers: false,
        canScanQR: false,
        canViewAllParticipants: false
      };
  }
};

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Replace the email addresses above with your actual admin and volunteer emails
 * 2. Make sure these users have Google accounts
 * 3. These users should sign in with Google at least once to create their accounts
 * 4. The system will automatically grant them the appropriate permissions
 * 
 * SECURITY NOTES:
 * - Keep this file secure and don't expose sensitive emails
 * - Consider using environment variables for production
 * - Regularly review and update the email lists
 * - Remove access for users who no longer need it
 */

// Environment-based configuration (optional)
export const getCredentialsFromEnv = () => {
  const adminEmails = process.env.REACT_APP_ADMIN_EMAILS?.split(',') || [];
  const volunteerEmails = process.env.REACT_APP_VOLUNTEER_EMAILS?.split(',') || [];
  
  return {
    adminEmails: adminEmails.length > 0 ? adminEmails : ADMIN_CREDENTIALS.emails,
    volunteerEmails: volunteerEmails.length > 0 ? volunteerEmails : VOLUNTEER_CREDENTIALS.emails
  };
};
