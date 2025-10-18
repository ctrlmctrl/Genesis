import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, CheckCircle, Clock, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { Participant, Event } from '../types';
import { dataService } from '../services/dataService';
import { realtimeService } from '../services/realtimeService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import RoleLogin from '../components/RoleLogin';
import toast from 'react-hot-toast';

const VolunteerAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalParticipants: 0,
    verifiedParticipants: 0,
    pendingParticipants: 0,
    totalEvents: 0,
    totalRevenue: 0,
    verificationRate: 0
  });

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = roleAuthService.getCurrentUser();
    if (currentUser && currentUser.role === 'volunteer') {
      setUser(currentUser);
      setupRealtimeListeners();
    } else {
      setLoading(false);
    }
  }, []);

  const setupRealtimeListeners = () => {
    // Check if we're using Firebase (production) or localStorage (development)
    const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                      (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

    if (isFirebase) {
      // Use real-time listeners for Firebase
      const unsubscribeParticipants = realtimeService.listenToParticipants((participantsData) => {
        setParticipants(participantsData);
        calculateAnalytics(participantsData, events);
      });

      const unsubscribeEvents = realtimeService.listenToEvents((eventsData) => {
        setEvents(eventsData);
        calculateAnalytics(participants, eventsData);
        setLoading(false);
      });

      return () => {
        unsubscribeParticipants();
        unsubscribeEvents();
      };
    } else {
      // Fallback to regular data loading for development
      loadData();
    }
  };

  const calculateAnalytics = (participantsData: Participant[], eventsData: Event[]) => {
    const totalParticipants = participantsData.length;
    const verifiedParticipants = participantsData.filter((p: Participant) => p.isVerified).length;
    const pendingParticipants = totalParticipants - verifiedParticipants;
    const totalEvents = eventsData.length;
    const totalRevenue = participantsData
      .filter((p: Participant) => p.paymentStatus === 'paid' || p.paymentStatus === 'offline_paid')
      .reduce((sum: number, p: Participant) => {
        const event = eventsData.find((e: Event) => e.id === p.eventId);
        return sum + (event?.entryFee || 0);
      }, 0);
    const verificationRate = totalParticipants > 0 ? (verifiedParticipants / totalParticipants) * 100 : 0;
    
    setAnalytics({
      totalParticipants,
      verifiedParticipants,
      pendingParticipants,
      totalEvents,
      totalRevenue,
      verificationRate
    });
  };

  const loadData = async () => {
    try {
      const [participantsData, eventsData] = await Promise.all([
        dataService.getParticipants(),
        dataService.getEvents()
      ]);
      
      setParticipants(participantsData);
      setEvents(eventsData);
      calculateAnalytics(participantsData, eventsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: RoleUser) => {
    setUser(loggedInUser);
    setupRealtimeListeners();
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-cyan-500 rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <RoleLogin onLogin={handleLogin} role="volunteer" />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white neon-text">Analytics Dashboard</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-glow text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
          <h3 className="text-2xl font-bold text-white">{analytics.totalParticipants}</h3>
          <p className="text-sm text-gray-400">Total Participants</p>
        </div>
        <div className="card-glow text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
          <h3 className="text-2xl font-bold text-white">{analytics.verifiedParticipants}</h3>
          <p className="text-sm text-gray-400">Verified</p>
        </div>
        <div className="card-glow text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">{analytics.pendingParticipants}</h3>
          <p className="text-sm text-gray-400">Pending</p>
        </div>
        <div className="card-glow text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
          <h3 className="text-2xl font-bold text-white">{analytics.verificationRate.toFixed(1)}%</h3>
          <p className="text-sm text-gray-400">Verification Rate</p>
        </div>
      </div>

      {/* Revenue & Events */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-glow text-center">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-400" />
          <h3 className="text-2xl font-bold text-white">₹{analytics.totalRevenue}</h3>
          <p className="text-sm text-gray-400">Total Revenue</p>
        </div>
        <div className="card-glow text-center">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-400" />
          <h3 className="text-2xl font-bold text-white">{analytics.totalEvents}</h3>
          <p className="text-sm text-gray-400">Active Events</p>
        </div>
      </div>

      {/* Event-wise Statistics */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 neon-text">Event Statistics</h2>
        <div className="space-y-4">
          {events.map((event) => {
            const eventParticipants = participants.filter(p => p.eventId === event.id);
            const verifiedCount = eventParticipants.filter(p => p.isVerified).length;
            const paidCount = eventParticipants.filter(p => p.paymentStatus === 'paid' || p.paymentStatus === 'offline_paid').length;
            const revenue = paidCount * event.entryFee;
            
            return (
              <motion.div
                key={event.id}
                className="card-glow hover:shadow-cyan-500/50 transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                  <span className="text-sm text-gray-400">
                    {event.isTeamEvent 
                      ? `${Math.ceil(eventParticipants.length / (event.membersPerTeam || 1))} teams (${eventParticipants.length} members)`
                      : `${eventParticipants.length} participants`
                    }
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{verifiedCount}</p>
                    <p className="text-xs text-gray-400">Verified</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">{paidCount}</p>
                    <p className="text-xs text-gray-400">Paid</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">₹{revenue}</p>
                    <p className="text-xs text-gray-400">Revenue</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Verification Progress</span>
                    <span>{eventParticipants.length > 0 ? ((verifiedCount / eventParticipants.length) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${eventParticipants.length > 0 ? (verifiedCount / eventParticipants.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    to={`/event/${event.id}/participants`}
                    className="btn-secondary text-sm flex items-center"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    View Participants
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment Status Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 neon-text">Payment Status</h2>
        <div className="card-glow">
          <div className="space-y-4">
            {[
              { status: 'paid', label: 'Online Paid', color: 'text-green-400', count: participants.filter(p => p.paymentStatus === 'paid').length },
              { status: 'offline_paid', label: 'Offline Paid', color: 'text-blue-400', count: participants.filter(p => p.paymentStatus === 'offline_paid').length },
              { status: 'pending', label: 'Pending Payment', color: 'text-yellow-400', count: participants.filter(p => p.paymentStatus === 'pending').length }
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
                  <span className="text-white">{item.label}</span>
                </div>
                <span className={`font-semibold ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerAnalytics;
