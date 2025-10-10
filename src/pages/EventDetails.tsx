import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, Clock, BarChart3, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Event, Participant } from '../types';
import { dataService } from '../services/dataService';
import { excelService } from '../services/excelService';

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState({
    totalParticipants: 0,
    verifiedParticipants: 0,
    pendingVerification: 0,
    verificationRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants'>('overview');

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) return;
      
      try {
        const [eventData, participantsData, statsData] = await Promise.all([
          dataService.getEvent(eventId),
          dataService.getParticipantsByEvent(eventId),
          dataService.getEventStats(eventId),
        ]);

        if (!eventData) {
          toast.error('Event not found');
          navigate('/admin/dashboard');
          return;
        }

        setEvent(eventData);
        setParticipants(participantsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading event data:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const exportParticipants = async () => {
    if (!event) return;
    
    try {
      await excelService.exportParticipantsToExcel(participants, event);
      toast.success('Participants exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export participants');
    }
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mobile-container">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
      </div>

      {/* Event Info */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">{event.title}</h2>
        <p className="text-gray-600 mb-4">{event.description}</p>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-3" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-3" />
            {event.time}
          </div>
          {event.roomNo && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-3" />
              Room: {event.roomNo}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-3" />
            {event.currentParticipants} participants registered
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{stats.totalParticipants}</h3>
          <p className="text-sm text-gray-600">Total Registered</p>
        </div>
        
        <div className="card text-center">
          <QrCode className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">{stats.verifiedParticipants}</h3>
          <p className="text-sm text-gray-600">Verified</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'participants'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Participants ({participants.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Registrations</span>
                <span className="font-semibold">
                  {event.currentParticipants}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verification Rate</span>
                <span className="font-semibold">{stats.verificationRate.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Verification</span>
                <span className="font-semibold text-yellow-600">{stats.pendingVerification}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={exportParticipants}
                className="btn-secondary w-full flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Participants
              </button>
              
              <Link
                to="/volunteer/scanner"
                className="btn-primary w-full flex items-center justify-center"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Open QR Scanner
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="space-y-4">
          {participants.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
              <p className="text-gray-600">Participants will appear here once they register</p>
            </div>
          ) : (
            participants.map((participant) => (
              <div key={participant.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {participant.fullName}
                    </h4>
                    <p className="text-sm text-gray-600">{participant.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    participant.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {participant.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Phone:</strong> {participant.phone}</p>
                  <p><strong>Registered:</strong> {new Date(participant.registrationDate).toLocaleDateString()}</p>
                  {participant.verificationTime && (
                    <p><strong>Verified:</strong> {new Date(participant.verificationTime).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetails;
