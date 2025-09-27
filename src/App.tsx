import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import EventRegistration from './pages/EventRegistration';
import QRCodeDisplay from './pages/QRCodeDisplay';
import VolunteerScanner from './pages/VolunteerScanner';
import AdminPage from './pages/AdminPage';
import EventDetails from './pages/EventDetails';
import ParticipantInfo from './pages/ParticipantInfo';
import { dataService } from './services/dataService';

function App() {
  useEffect(() => {
    // Initialize sample data
    dataService.initializeSampleData();
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
            <Route path="/volunteer/scanner" element={<VolunteerScanner />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/events/:eventId" element={<EventDetails />} />
            <Route path="/participant-info/:participantId" element={<ParticipantInfo />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
