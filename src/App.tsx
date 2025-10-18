import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import EventRegistration from './pages/EventRegistration';
import QRCodeDisplay from './pages/QRCodeDisplay';
import VolunteerScanner from './pages/VolunteerScanner';
import VolunteerDashboard from './pages/VolunteerDashboard';
import VolunteerAnalytics from './pages/VolunteerAnalytics';
import ParticipantDashboard from './pages/ParticipantDashboard';
import AdminPage from './pages/AdminPage';
import EventDetails from './pages/EventDetails';
import EventParticipants from './pages/EventParticipants';
import PaymentTracking from './pages/PaymentTracking';
import { dataService } from './services/dataService';
import { realtimeService } from './services/realtimeService';

function App() {
  // Sample data initialization is handled in dataService constructor

  useEffect(() => {
    // Cleanup real-time listeners when app unmounts
    return () => {
      realtimeService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#fff',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register/:eventId" element={<EventRegistration />} />
            <Route path="/qr/:participantId" element={<QRCodeDisplay />} />
            <Route path="/participant" element={<ParticipantDashboard />} />
            <Route path="/volunteer" element={<VolunteerDashboard />} />
            <Route path="/vol" element={<VolunteerDashboard />} />
            <Route path="/volunteer/scanner" element={<VolunteerScanner />} />
            <Route path="/vol/scanner" element={<VolunteerScanner />} />
            <Route path="/volunteer/analytics" element={<VolunteerAnalytics />} />
            <Route path="/vol/analytics" element={<VolunteerAnalytics />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/events/:eventId" element={<EventDetails />} />
            <Route path="/admin/payments" element={<PaymentTracking />} />
            <Route path="/event/:eventId/participants" element={<EventParticipants />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
