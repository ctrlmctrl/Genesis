# Genesis Event Manager

A mobile-first event registration and QR code verification system built with React and TypeScript. This application allows participants to register for events, generates QR codes for verification, and provides admin tools for event management and crowd control.

## Features

### For Participants
- **Mobile-first design** - Optimized for mobile devices
- **Event Registration** - Easy registration with basic information
- **Additional Information Form** - Optional detailed participant information
- **QR Code Generation** - Unique QR codes for each participant
- **QR Code Display** - Download and share QR codes

### For Volunteers
- **QR Code Scanner** - Scan participant QR codes for verification
- **Real-time Verification** - Mark participants as verified
- **Participant Details** - View participant information during scanning

### For Administrators
- **Event Management** - Create and manage events
- **Participant Analytics** - View registration and verification statistics
- **Crowd Management** - Track participant verification status
- **Data Export** - Export participant lists as CSV
- **Real-time Dashboard** - Monitor event progress

## Technology Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **QR Codes**: qrcode library
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd genesis-event-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application.

## Usage

### For Participants

1. **Browse Events** - View available events on the home page
2. **Register** - Click "Register Now" on any event
3. **Fill Information** - Complete the registration form
4. **Additional Details** - Optionally provide additional information
5. **Get QR Code** - Receive your unique QR code for the event

### For Volunteers

1. **Access Scanner** - Click "Volunteer Scanner" on the home page
2. **Start Scanning** - Allow camera access and start scanning
3. **Verify Participants** - Review participant details and verify attendance

### For Administrators

1. **Login** - Use the admin login (demo credentials: admin/admin123)
2. **Create Events** - Add new events with details and capacity
3. **Manage Events** - View participant lists and statistics
4. **Export Data** - Download participant information as CSV

## Demo Credentials

- **Admin Username**: admin
- **Admin Password**: admin123

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
│   ├── Home.tsx
│   ├── EventRegistration.tsx
│   ├── ParticipantInfo.tsx
│   ├── QRCodeDisplay.tsx
│   ├── VolunteerScanner.tsx
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   └── EventDetails.tsx
├── services/           # Data management
│   └── dataService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── qrCode.ts
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Key Features Explained

### QR Code System
- Each participant receives a unique QR code upon registration
- QR codes contain encrypted participant and event information
- Volunteers can scan QR codes to verify attendance
- Real-time verification status tracking

### Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface elements
- Fast loading and smooth interactions
- Offline-capable (with service worker implementation)

### Admin Dashboard
- Real-time event statistics
- Participant management tools
- Export functionality for data analysis
- Event creation and management interface

## Future Enhancements

- **Real-time Updates** - WebSocket integration for live updates
- **Push Notifications** - Event reminders and updates
- **Offline Support** - Service worker for offline functionality
- **Advanced Analytics** - Detailed reporting and insights
- **Multi-language Support** - Internationalization
- **Social Features** - Social media integration and sharing

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
