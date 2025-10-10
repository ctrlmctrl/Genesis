import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, QrCode, LogOut, User } from 'lucide-react';
import { Event, Participant } from '../types';
import { dataService } from '../services/dataService';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ParticipantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeParticipants: (() => void) | null = null;

    const setupRealtimeListeners = () => {
      // Listen to events in real-time
      unsubscribeEvents = realtimeService.listenToEvents((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
      });

      // Listen to user's participants in real-time
      if (user.email) {
        unsubscribeParticipants = realtimeService.listenToUserParticipants(user.email, (participantsData) => {
          setParticipants(participantsData);
        });
      }
    };

    // Check if we're using Firebase (production) or localStorage (development)
    const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                      (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

    if (isFirebase) {
      setupRealtimeListeners();
    } else {
      // Fallback to regular data loading for development
      const loadData = async () => {
        try {
          const [eventsData, participantsData] = await Promise.all([
            dataService.getEvents(),
            dataService.getParticipants()
          ]);
          
          setEvents(eventsData);
          // Filter participants for current user
          const userParticipants = participantsData.filter((p: Participant) => p.email === user?.email);
          setParticipants(userParticipants);
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Failed to load data');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }

    // Cleanup function
    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeParticipants) unsubscribeParticipants();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-cyan-500 rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Participant Dashboard</h1>
          <p className="text-gray-400">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-glow text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
          <h3 className="font-semibold text-white">{events.length}</h3>
          <p className="text-sm text-gray-400">Available Events</p>
        </div>
        <div className="card-glow text-center">
          <User className="h-8 w-8 mx-auto mb-2 text-green-400" />
          <h3 className="font-semibold text-white">{participants.length}</h3>
          <p className="text-sm text-gray-400">My Registrations</p>
        </div>
      </div>

      {/* My Registrations */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 neon-text">My Registrations</h2>
        {participants.length === 0 ? (
          <div className="card-glow text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-4">No event registrations found.</p>
            <Link to="/" className="btn-primary">
              View Events
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {participants.map((participant) => {
              const event = events.find(e => e.id === participant.eventId);

              return (
                <motion.div
                  key={participant.id}
                  className="card-glow hover:shadow-cyan-500/50 transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {event ? event.title : `Event ID: ${participant.eventId}`}
                      </h3>
                      {participant.teamName && (
                        <div className="mt-1">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mr-2">
                            Team: {participant.teamName}
                          </span>
                          {participant.isTeamLead && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Team Lead
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      participant.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                      participant.paymentStatus === 'offline_paid' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {participant.paymentStatus === 'paid' ? 'Paid' :
                       participant.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {event ? (
                      <>
                        <div className="flex items-center text-sm text-blue-400">
                          <Calendar className="h-4 w-4 mr-3" />
                          {event.eventDay === 'day1' ? 'Day 1 Event' : 'Day 2 Event'}
                        </div>
                        {participant.assignedRoom && (
                          <div className="flex items-center text-sm text-green-400">
                            <MapPin className="h-4 w-4 mr-3" />
                            Assigned Room: {participant.assignedRoom}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="h-4 w-4 mr-3" />
                        Event information unavailable
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-400">
                      <span>Registration Date: {new Date(participant.registrationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    to={`/qr/${participant.id}`}
                    className="btn-primary w-full text-center flex items-center justify-center space-x-2"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>View QR Code</span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Events */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 neon-text">Available Events</h2>
        {(() => {
          // Filter out events that user is already registered for
          const registeredEventIds = participants.map(p => p.eventId);
          const availableEvents = events.filter(event => !registeredEventIds.includes(event.id));
          
          if (availableEvents.length === 0) {
            return (
              <div className="card-glow text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">
                  {events.length === 0 
                    ? "No events available at the moment." 
                    : "You're registered for all available events!"
                  }
                </p>
              </div>
            );
          }
          
          return (
            <div className="space-y-4">
              {availableEvents.slice(0, 3).map((event) => (
              <motion.div
                key={event.id}
                className="card-glow hover:shadow-cyan-500/50 transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <span className="text-sm text-gray-400">
                    {event.isTeamEvent 
                      ? `${Math.ceil(event.currentParticipants / (event.teamSize || 1))} teams (${event.currentParticipants} members)${event.maxTeams ? ` / ${event.maxTeams} max teams` : ''}`
                      : `${event.currentParticipants} participants`
                    }
                  </span>
                </div>

                <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-blue-400">
                    <Calendar className="h-4 w-4 mr-3" />
                    {event.eventDay === 'day1' ? 'Day 1 Event' : 'Day 2 Event'}
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <MapPin className="h-4 w-4 mr-3 text-cyan-400" />
                    Room will be assigned at check-in
                  </div>
                </div>

                <Link
                  to={`/register/${event.id}`}
                  className="btn-primary w-full text-center"
                >
                  Register Now
                </Link>
              </motion.div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
