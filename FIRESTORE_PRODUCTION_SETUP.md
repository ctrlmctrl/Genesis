# Firestore Production Security Rules Setup

## Overview
This document provides comprehensive Firestore security rules for the Genesis Event Manager application, designed for production use with proper authentication and authorization.

## Security Model

### User Roles
1. **Participants** - Regular users who register for events
2. **Volunteers** - Staff who can scan QR codes and verify participants
3. **Admins** - Full access to manage events, participants, and system

### Authentication
- All users authenticate via Google OAuth through Firebase Auth
- Role-based access control using Firestore collections
- Email-based participant identification

## Collections Structure

### Core Collections

#### `/events/{eventId}`
```javascript
{
  id: string,
  title: string,
  description: string,
  date: string,
  time: string,
  location: string,
  currentParticipants: number,
  maxParticipants: number,
  isActive: boolean,
  entryFee: number,
  paymentMethod: 'online' | 'offline' | 'both',
  upiId: string,
  isTeamEvent: boolean,
  teamSize: number,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `/participants/{participantId}`
```javascript
{
  id: string,
  eventId: string,
  fullName: string,
  email: string,
  phone: string,
  college: string,
  registrationDate: timestamp,
  qrCode: string,
  isVerified: boolean,
  verificationTime: timestamp,
  teamId: string,
  teamName: string,
  isTeamLead: boolean,
  paymentStatus: 'pending' | 'paid' | 'offline_paid',
  paymentMethod: 'online' | 'offline',
  paymentId: string,
  receiptUrl: string
}
```

#### `/verification_records/{recordId}`
```javascript
{
  id: string,
  participantId: string,
  volunteerId: string,
  verificationTime: timestamp
}
```

### Role Management Collections

#### `/admins/{userId}`
```javascript
{
  userId: string,
  email: string,
  name: string,
  createdAt: timestamp,
  isActive: boolean
}
```

#### `/volunteers/{userId}`
```javascript
{
  userId: string,
  email: string,
  name: string,
  createdAt: timestamp,
  isActive: boolean,
  permissions: string[]
}
```

### Additional Collections

#### `/teams/{teamId}` (for team events)
```javascript
{
  teamId: string,
  teamName: string,
  eventId: string,
  memberEmails: string[],
  teamLeadEmail: string,
  createdAt: timestamp
}
```

#### `/payments/{paymentId}`
```javascript
{
  paymentId: string,
  userEmail: string,
  eventId: string,
  amount: number,
  method: 'online' | 'offline',
  status: 'pending' | 'completed' | 'failed',
  timestamp: timestamp,
  transactionId: string
}
```

## Access Control Rules

### Participants
- ✅ Can read their own participant records
- ✅ Can create their own registrations
- ✅ Can update their payment information
- ❌ Cannot modify verification status
- ❌ Cannot access other participants' data

### Volunteers
- ✅ Can read all participant records
- ✅ Can update verification status
- ✅ Can create verification records
- ✅ Can read all events
- ❌ Cannot create/modify events
- ❌ Cannot delete participants

### Admins
- ✅ Full access to all collections
- ✅ Can manage events, participants, volunteers
- ✅ Can access analytics and audit logs
- ✅ Can modify system configuration

## Deployment Instructions

### 1. Deploy Rules to Firebase
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init firestore

# Deploy the rules
firebase deploy --only firestore:rules
```

### 2. Initialize Role Collections

Create initial admin user:
```javascript
// Run this in Firebase Console or via Admin SDK
db.collection('admins').doc('YOUR_USER_ID').set({
  userId: 'YOUR_USER_ID',
  email: 'admin@yourdomain.com',
  name: 'Admin Name',
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  isActive: true
});
```

### 3. Update Application Code

Update your `firebaseService.ts` to handle role checking:

```typescript
// Add role checking functions
export const checkUserRole = async (userId: string): Promise<'admin' | 'volunteer' | 'participant' | null> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists() && adminDoc.data().isActive) {
      return 'admin';
    }
    
    const volunteerDoc = await getDoc(doc(db, 'volunteers', userId));
    if (volunteerDoc.exists() && volunteerDoc.data().isActive) {
      return 'volunteer';
    }
    
    return 'participant';
  } catch (error) {
    console.error('Error checking user role:', error);
    return null;
  }
};

// Initialize user role on authentication
export const initializeUserRole = async (user: User) => {
  const role = await checkUserRole(user.uid);
  // Store role in your app state management
  return role;
};
```

### 4. Security Best Practices

#### Environment Variables
```bash
# .env.production
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_app_id
```

#### Rate Limiting
The rules include basic validation, but consider implementing:
- Cloud Functions for complex business logic
- Rate limiting for API calls
- Input sanitization

#### Monitoring
Set up Firebase Security Rules monitoring:
```bash
# Enable audit logs
firebase functions:config:set audit.enabled=true

# Monitor rule violations
firebase functions:log --only firestore
```

## Testing the Rules

### 1. Firebase Emulator Testing
```bash
# Start Firestore emulator
firebase emulators:start --only firestore

# Run your tests against the emulator
npm test
```

### 2. Security Rules Unit Tests
Create `firestore.test.js`:
```javascript
const firebase = require('@firebase/rules-unit-testing');
const fs = require('fs');

const PROJECT_ID = 'genesis-test';
const rules = fs.readFileSync('firestore.rules', 'utf8');

describe('Firestore Security Rules', () => {
  beforeEach(async () => {
    await firebase.clearFirestoreData({ projectId: PROJECT_ID });
  });

  it('allows participants to read their own data', async () => {
    const db = firebase.initializeTestApp({
      projectId: PROJECT_ID,
      auth: { uid: 'user1', email: 'user1@test.com' }
    }).firestore();

    const testDoc = db.collection('participants').doc('participant1');
    await firebase.assertSucceeds(testDoc.get());
  });

  // Add more tests...
});
```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check if user is properly authenticated
   - Verify role collections are set up correctly
   - Ensure email matches in participant records

2. **Rules Not Updating**
   - Clear browser cache
   - Redeploy rules: `firebase deploy --only firestore:rules`
   - Check Firebase Console for rule deployment status

3. **Performance Issues**
   - Use compound indexes for complex queries
   - Implement pagination for large collections
   - Consider denormalization for frequently accessed data

### Monitoring and Alerts

Set up monitoring for:
- Rule violations
- Failed authentication attempts
- Unusual access patterns
- Performance metrics

## Maintenance

### Regular Tasks
1. Review and rotate API keys
2. Monitor user roles and permissions
3. Clean up old verification records
4. Backup critical data
5. Update security rules as features evolve

### Updates and Versioning
- Version your security rules
- Test changes in staging environment
- Document all rule changes
- Maintain backward compatibility when possible

## Support

For issues with these security rules:
1. Check Firebase Console logs
2. Review rule evaluation in Firebase Emulator
3. Test with different user roles
4. Validate data structure matches expected format

Remember: Security rules are your last line of defense. Always validate data on the client side and implement proper business logic in Cloud Functions when needed.
