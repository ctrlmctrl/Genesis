# Genesis Event Manager - Production Setup Guide

## 🚀 Production Features Overview

### Core User Flow
1. **Landing Page**: Event listings + Google login
2. **Event Details**: Event info with login requirement for registration
3. **Registration**: Google authentication required
4. **QR Code**: Generated after successful registration
5. **Volunteer Check-in**: QR scanning + participant details
6. **Admin Panel**: Event management + participant export

## 🔧 Production Configuration

### 1. Environment Variables

Create `.env.production`:
```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCoZzsijw4Br7uIZzyX-rCTWndGeXQOJ00
REACT_APP_FIREBASE_AUTH_DOMAIN=genesis-8ca86.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=genesis-8ca86
REACT_APP_FIREBASE_STORAGE_BUCKET=genesis-8ca86.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=47380732193
REACT_APP_FIREBASE_APP_ID=1:47380732193:web:5aabe37ca1edf4ba680660

# Storage Mode
REACT_APP_STORAGE_MODE=firebase

# Admin Credentials (for initial setup)
REACT_APP_ADMIN_EMAIL=admin@yourdomain.com
REACT_APP_VOLUNTEER_EMAIL=volunteer@yourdomain.com

# App Configuration
REACT_APP_APP_NAME=Genesis Event Manager
REACT_APP_ORGANIZATION=Your Organization Name
```

### 2. Admin & Volunteer Credentials Setup

#### Location: `src/config/credentials.ts`
```typescript
export const ADMIN_CREDENTIALS = {
  // These users will be automatically granted admin access
  emails: [
    'admin@yourdomain.com',
    'organizer@yourdomain.com'
  ]
};

export const VOLUNTEER_CREDENTIALS = {
  // These users will be automatically granted volunteer access
  emails: [
    'volunteer@yourdomain.com',
    'staff@yourdomain.com'
  ]
};
```

#### Location: `src/services/roleService.ts`
```typescript
import { ADMIN_CREDENTIALS, VOLUNTEER_CREDENTIALS } from '../config/credentials';

export const checkUserRole = (email: string): 'admin' | 'volunteer' | 'participant' => {
  if (ADMIN_CREDENTIALS.emails.includes(email)) {
    return 'admin';
  }
  if (VOLUNTEER_CREDENTIALS.emails.includes(email)) {
    return 'volunteer';
  }
  return 'participant';
};
```

## 📅 Registration Deadline Feature

### Event Schema Update
```typescript
interface Event {
  // ... existing fields
  registrationStartDate: string;
  registrationEndDate: string;
  registrationStartTime: string;
  registrationEndTime: string;
  allowLateRegistration: boolean; // Admin override
}
```

### Registration Status Check
```typescript
export const isRegistrationOpen = (event: Event): boolean => {
  const now = new Date();
  const startDateTime = new Date(`${event.registrationStartDate}T${event.registrationStartTime}`);
  const endDateTime = new Date(`${event.registrationEndDate}T${event.registrationEndTime}`);
  
  return now >= startDateTime && now <= endDateTime;
};

export const canRegister = (event: Event, userRole: string): boolean => {
  if (userRole === 'admin') return true; // Admin can always register
  if (userRole === 'volunteer' && event.allowLateRegistration) return true;
  return isRegistrationOpen(event);
};
```

## 🎯 Production Features Implementation

### 1. Landing Page Flow
```typescript
// src/components/ProductionLanding.tsx
const ProductionLanding = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <div>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Authentication Section */}
      {!isAuthenticated && <GoogleLoginSection />}
      
      {/* Events Grid */}
      <EventsGrid 
        showRegisterButton={isAuthenticated}
        onEventClick={(event) => navigate(`/event/${event.id}`)}
      />
      
      {/* User Dashboard Link */}
      {isAuthenticated && <MyEventsLink />}
    </div>
  );
};
```

### 2. Event Details with Registration Gate
```typescript
// src/pages/EventDetails.tsx
const EventDetails = () => {
  const { eventId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  
  const canUserRegister = useMemo(() => {
    if (!event || !user) return false;
    const userRole = checkUserRole(user.email);
    return canRegister(event, userRole);
  }, [event, user]);
  
  return (
    <div>
      <EventInfo event={event} />
      
      {!isAuthenticated ? (
        <LoginPrompt message="Sign in with Google to register for this event" />
      ) : !canUserRegister ? (
        <RegistrationClosed event={event} />
      ) : (
        <RegistrationForm event={event} />
      )}
    </div>
  );
};
```

### 3. QR Code with Participant Binding
```typescript
// src/services/qrService.ts
export const generateParticipantQR = (participant: Participant): string => {
  const qrData = {
    type: 'GENESIS_PARTICIPANT',
    participantId: participant.id,
    eventId: participant.eventId,
    email: participant.email,
    timestamp: Date.now(),
    checksum: generateChecksum(participant)
  };
  
  return JSON.stringify(qrData);
};

export const validateQRCode = (qrString: string): QRValidation => {
  try {
    const data = JSON.parse(qrString);
    if (data.type !== 'GENESIS_PARTICIPANT') {
      return { valid: false, error: 'Invalid QR code type' };
    }
    
    // Validate checksum
    const isValidChecksum = validateChecksum(data);
    if (!isValidChecksum) {
      return { valid: false, error: 'QR code has been tampered with' };
    }
    
    return { valid: true, participantId: data.participantId };
  } catch (error) {
    return { valid: false, error: 'Invalid QR code format' };
  }
};
```

### 4. Volunteer Check-in System
```typescript
// src/pages/VolunteerCheckIn.tsx
const VolunteerCheckIn = () => {
  const [scannedParticipant, setScannedParticipant] = useState<Participant | null>(null);
  
  const handleQRScan = async (qrString: string) => {
    const validation = validateQRCode(qrString);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    const participant = await dataService.getParticipant(validation.participantId);
    if (!participant) {
      toast.error('Participant not found');
      return;
    }
    
    setScannedParticipant(participant);
  };
  
  const handleCheckIn = async () => {
    if (!scannedParticipant) return;
    
    await dataService.verifyParticipant(scannedParticipant.id, 'volunteer-id');
    toast.success('Participant checked in successfully!');
    setScannedParticipant(null);
  };
  
  return (
    <div>
      <QRScanner onScan={handleQRScan} />
      {scannedParticipant && (
        <ParticipantDetails 
          participant={scannedParticipant}
          onCheckIn={handleCheckIn}
        />
      )}
    </div>
  );
};
```

## 📊 Export Functionality

### Participant Export Service
```typescript
// src/services/exportService.ts
export class ExportService {
  static async exportEventParticipants(eventId: string, format: 'excel' | 'csv' = 'excel') {
    const participants = await dataService.getParticipantsByEvent(eventId);
    const event = await dataService.getEvent(eventId);
    
    if (format === 'excel') {
      return await this.exportToExcel(participants, event);
    } else {
      return await this.exportToCSV(participants, event);
    }
  }
  
  static async exportToExcel(participants: Participant[], event: Event) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participants');
    
    // Headers
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Name', key: 'fullName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'College', key: 'college', width: 25 },
      { header: 'Registration Date', key: 'registrationDate', width: 20 },
      { header: 'Check-in Status', key: 'checkInStatus', width: 15 },
      { header: 'Check-in Time', key: 'checkInTime', width: 20 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 }
    ];
    
    // Data
    participants.forEach((participant, index) => {
      worksheet.addRow({
        sno: index + 1,
        fullName: participant.fullName,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        registrationDate: new Date(participant.registrationDate).toLocaleDateString(),
        checkInStatus: participant.isVerified ? 'Checked In' : 'Not Checked In',
        checkInTime: participant.verificationTime ? new Date(participant.verificationTime).toLocaleString() : 'N/A',
        paymentStatus: participant.paymentStatus
      });
    });
    
    // Style
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
    
    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${event?.title}_Participants_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}
```

## 🔐 Security & Access Control

### Role-Based Access
```typescript
// src/hooks/useRole.ts
export const useRole = () => {
  const { user } = useAuth();
  
  const role = useMemo(() => {
    if (!user) return 'guest';
    return checkUserRole(user.email);
  }, [user]);
  
  const permissions = useMemo(() => {
    switch (role) {
      case 'admin':
        return {
          canCreateEvents: true,
          canEditEvents: true,
          canDeleteEvents: true,
          canExportData: true,
          canRegisterOffline: true,
          canOverrideDeadlines: true
        };
      case 'volunteer':
        return {
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false,
          canExportData: true,
          canRegisterOffline: true,
          canOverrideDeadlines: false
        };
      default:
        return {
          canCreateEvents: false,
          canEditEvents: false,
          canDeleteEvents: false,
          canExportData: false,
          canRegisterOffline: false,
          canOverrideDeadlines: false
        };
    }
  }, [role]);
  
  return { role, permissions };
};
```

## 🚀 Deployment Checklist

### 1. Firebase Setup
- [ ] Deploy Firestore security rules
- [ ] Set up Firebase Authentication
- [ ] Configure authorized domains
- [ ] Create initial admin users

### 2. Environment Configuration
- [ ] Set production environment variables
- [ ] Configure admin/volunteer emails
- [ ] Set up proper error tracking

### 3. Features Testing
- [ ] Test Google authentication flow
- [ ] Test event registration with deadlines
- [ ] Test QR code generation and scanning
- [ ] Test volunteer check-in process
- [ ] Test admin event management
- [ ] Test data export functionality

### 4. Security
- [ ] Validate Firestore security rules
- [ ] Test role-based access control
- [ ] Verify QR code security
- [ ] Test registration deadline enforcement

## 📱 User Experience Flow

### For Participants:
1. Visit website → See events
2. Click event → See details + login prompt
3. Login with Google → Register for event
4. Receive QR code → Save/screenshot
5. Show QR at event → Get checked in
6. View "My Events" → See all registrations

### For Volunteers:
1. Visit `/volunteer` → Login with credentials
2. Access QR scanner → Scan participant codes
3. View participant details → Check them in
4. Export participant data → Download Excel/CSV
5. Register offline participants → Manual entry

### For Admins:
1. Visit `/admin` → Login with credentials
2. Create/edit events → Set registration deadlines
3. Manage participants → View/export data
4. Override restrictions → Late registrations
5. System monitoring → View analytics

This setup provides a complete production-ready event management system with all the features you requested!
