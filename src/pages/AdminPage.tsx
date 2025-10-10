import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Calendar, 
  BarChart3, 
  LogOut, 
  Download,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  User,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import { excelService } from '../services/excelService';
import { eventLeadExportService } from '../services/eventLeadExportService';
import { realtimeService } from '../services/realtimeService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import { testFirebaseConnection } from '../utils/firebaseTest';
import OfflineRegistration from '../components/OfflineRegistration';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<RoleUser | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ userId: '' });
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    roomNo: '',
    entryFee: 0,
    maxTeams: 0,
    paymentMethod: 'both' as 'online' | 'offline' | 'both',
    upiId: '',
    isTeamEvent: false,
    teamSize: 1,
    eventDay: 'day1' as 'day1' | 'day2',
    membersPerTeam: 1,
    // On-the-spot registration fields
    allowOnSpotRegistration: false,
    onSpotEntryFee: 0,
    onSpotPaymentMethod: 'both' as 'online' | 'offline' | 'both',
    onSpotStartTime: '08:00',
    onSpotEndTime: '10:00',
  });
  const [showOfflineRegistration, setShowOfflineRegistration] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    // Check if admin is already logged in
    const savedAdmin = roleAuthService.getCurrentUser();
    if (savedAdmin && savedAdmin.role === 'admin') {
      setAdminUser(savedAdmin);
      setIsAdminAuthenticated(true);
      setupEventListeners();
    } else {
      setLoading(false);
    }
  }, []);

  const setupEventListeners = () => {
    // Check if we're using Firebase (production) or localStorage (development)
    const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                      (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

    if (isFirebase) {
      // Use real-time listener for Firebase
      const unsubscribe = realtimeService.listenToEvents((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
      });

      // Test Firebase connection
      testFirebaseConnection().then((isConnected) => {
        if (isConnected) {
          toast.success('Firebase connected successfully!');
        } else {
          toast.error('Firebase connection failed. Check console for details.');
        }
      });

      return unsubscribe;
    } else {
      // Fallback to regular data loading for development
      loadEvents();
    }
  };

  const loadEvents = async () => {
    try {
      const eventsData = await dataService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Set date and time automatically based on eventDay
      const eventDate = newEvent.eventDay === 'day1' ? '2024-11-13' : '2024-11-14';
      const eventTime = '10:00'; // Default time
      
      await dataService.createEvent({
        ...newEvent,
        date: eventDate,
        time: eventTime,
        isActive: true,
      });
      
      toast.success('Event created successfully!');
      setShowCreateForm(false);
      setNewEvent({
        title: '',
        description: '',
        roomNo: '',
        entryFee: 0,
        maxTeams: 0,
        paymentMethod: 'both',
        upiId: '',
        isTeamEvent: false,
        teamSize: 1,
        // Event categorization and team settings
        eventDay: 'day1',
        membersPerTeam: 1,
        // On-the-spot registration fields
        allowOnSpotRegistration: false,
        onSpotEntryFee: 0,
        onSpotPaymentMethod: 'both',
        onSpotStartTime: '08:00',
        onSpotEndTime: '10:00',
      });
      
      // Events will be updated automatically via real-time listener
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      roomNo: event.roomNo || '',
      entryFee: event.entryFee,
      maxTeams: event.maxTeams || 0,
      paymentMethod: event.paymentMethod,
      upiId: event.upiId || '',
      isTeamEvent: event.isTeamEvent,
      teamSize: event.teamSize || 1,
      // Event categorization and team settings
      eventDay: event.eventDay || 'day1',
      membersPerTeam: event.membersPerTeam || 1,
      // On-the-spot registration fields
      allowOnSpotRegistration: event.allowOnSpotRegistration || false,
      onSpotEntryFee: event.onSpotEntryFee || 0,
      onSpotPaymentMethod: event.onSpotPaymentMethod || 'both',
      onSpotStartTime: event.onSpotStartTime || '08:00',
      onSpotEndTime: event.onSpotEndTime || '10:00',
    });
    setShowEditForm(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEvent) return;
    
    try {
      // Set date and time automatically based on eventDay
      const eventDate = newEvent.eventDay === 'day1' ? '2024-11-13' : '2024-11-14';
      const eventTime = '10:00'; // Default time
      
      await dataService.updateEvent(editingEvent.id, {
        ...newEvent,
        date: eventDate,
        time: eventTime,
        isActive: true,
      });
      
      toast.success('Event updated successfully!');
      setShowEditForm(false);
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        roomNo: '',
        entryFee: 0,
        maxTeams: 0,
        paymentMethod: 'both',
        upiId: '',
        isTeamEvent: false,
        teamSize: 1,
        // Event categorization and team settings
        eventDay: 'day1',
        membersPerTeam: 1,
        // On-the-spot registration fields
        allowOnSpotRegistration: false,
        onSpotEntryFee: 0,
        onSpotPaymentMethod: 'both',
        onSpotStartTime: '08:00',
        onSpotEndTime: '10:00',
      });
      
      // Events will be updated automatically via real-time listener
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await dataService.deleteEvent(eventId);
      toast.success('Event deleted successfully!');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleExportAll = async () => {
    try {
      await excelService.exportEventSummary(events);
      toast.success('Events exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export events');
    }
  };

  const handleExportEventParticipants = async (event: Event) => {
    try {
      const participants = await dataService.getParticipantsByEvent(event.id);
      await eventLeadExportService.exportEventParticipants(event.id, participants, event);
      toast.success('Event participants exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export event participants');
    }
  };

  const handleExportTeamDetails = async (event: Event) => {
    try {
      const participants = await dataService.getParticipantsByEvent(event.id);
      await eventLeadExportService.exportTeamDetails(event.id, participants, event);
      toast.success('Team details exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export team details');
    }
  };

  const handleOfflineRegistration = (event: Event) => {
    setSelectedEvent(event);
    setShowOfflineRegistration(true);
  };

  const handleOfflineRegistrationSuccess = (participantId: string) => {
    toast.success('Offline registration completed!');
    // Reload events to update participant count
    const loadEvents = async () => {
      try {
        const eventsData = await dataService.getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    loadEvents();
  };

  const handleToggleDailyClosure = async (event: Event, date: string) => {
    try {
      const updatedEvent = {
        ...event,
        dailyRegistrationClosure: {
          ...event.dailyRegistrationClosure,
          [date]: !event.dailyRegistrationClosure?.[date]
        },
        updatedAt: new Date().toISOString()
      };
      
      await dataService.updateEvent(event.id, updatedEvent);
      
      const status = updatedEvent.dailyRegistrationClosure?.[date] ? 'closed' : 'opened';
      toast.success(`Registration ${status} for ${date}`);
    } catch (error) {
      console.error('Error toggling daily closure:', error);
      toast.error('Failed to update registration closure');
    }
  };

  const handleUpdateOnSpotPricing = async (event: Event, newPrice: number) => {
    try {
      const updatedEvent = {
        ...event,
        onSpotEntryFee: newPrice,
        updatedAt: new Date().toISOString()
      };
      
      await dataService.updateEvent(event.id, updatedEvent);
      toast.success(`On-the-spot pricing updated to ₹${newPrice}`);
    } catch (error) {
      console.error('Error updating on-the-spot pricing:', error);
      toast.error('Failed to update on-the-spot pricing');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await roleAuthService.login(loginForm.userId);
      
      // Check if user has admin role
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      setAdminUser(user);
      setIsAdminAuthenticated(true);
      toast.success(`Welcome, ${user.username}!`);
      loadEvents();
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Invalid admin User ID');
    }
  };

  const handleLogout = () => {
    roleAuthService.logout();
    setAdminUser(null);
    setIsAdminAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="card-glow p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center neon-text">Admin Login</h1>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">User ID</label>
              <input
                type="text"
                value={loginForm.userId}
                onChange={(e) => setLoginForm({ ...loginForm, userId: e.target.value })}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                placeholder="Enter admin User ID"
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center"
            >
              <Shield className="h-5 w-5 mr-2" />
              Login as Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                  <span className="ml-4 text-gray-400">Welcome, {adminUser?.username || 'Admin'}</span>
                </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleExportAll}
                className="btn-secondary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export All
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-6 text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100">Total Events</p>
                <p className="text-3xl font-bold">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-cyan-200" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Participants</p>
                <p className="text-3xl font-bold">
                  {events.reduce((sum, event) => sum + event.currentParticipants, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Revenue</p>
                <p className="text-3xl font-bold">
                  ₹{events.reduce((sum, event) => sum + (event.currentParticipants * event.entryFee), 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-200" />
            </div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Active Events</p>
                <p className="text-3xl font-bold">
                  {events.filter(event => event.isActive).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-200" />
            </div>
          </motion.div>
        </div>

        {/* Create Event Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create New Event
          </button>
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <motion.div
            className="bg-gray-800 rounded-xl p-6 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6">Create New Event</h3>
            
            <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input-field"
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Enter event description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="input-field"
                  placeholder="Enter event location"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee (₹) *
                </label>
                <input
                  type="number"
                  value={newEvent.entryFee}
                  onChange={(e) => setNewEvent({ ...newEvent, entryFee: parseFloat(e.target.value) })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Teams (0 = unlimited)
                </label>
                <input
                  type="number"
                  value={newEvent.maxTeams}
                  onChange={(e) => setNewEvent({ ...newEvent, maxTeams: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  placeholder="Enter max teams"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Day *
                </label>
                <select
                  value={newEvent.eventDay}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDay: e.target.value as 'day1' | 'day2' })}
                  className="input-field"
                >
                  <option value="day1">Day 1</option>
                  <option value="day2">Day 2</option>
                </select>
              </div>

              {newEvent.isTeamEvent && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Members Per Team
                  </label>
                  <input
                    type="number"
                    value={newEvent.membersPerTeam}
                    onChange={(e) => setNewEvent({ ...newEvent, membersPerTeam: parseInt(e.target.value) || 1 })}
                    className="input-field"
                    placeholder="Enter members per team"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={newEvent.paymentMethod}
                  onChange={(e) => setNewEvent({ ...newEvent, paymentMethod: e.target.value as 'online' | 'offline' | 'both' })}
                  className="input-field"
                >
                  <option value="both">Both Online & Offline</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  UPI ID (for online payments)
                </label>
                <input
                  type="text"
                  value={newEvent.upiId}
                  onChange={(e) => setNewEvent({ ...newEvent, upiId: e.target.value })}
                  className="input-field"
                  placeholder="yourname@upi"
                />
              </div>

              {/* On-the-spot Registration Section */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">
                  On-the-Spot Registration
                </h4>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newEvent.allowOnSpotRegistration}
                    onChange={(e) => setNewEvent({ ...newEvent, allowOnSpotRegistration: e.target.checked })}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Allow on-the-spot registration (when event is being held)
                  </span>
                </label>
              </div>

              {newEvent.allowOnSpotRegistration && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Entry Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={newEvent.onSpotEntryFee}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotEntryFee: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                      min="0"
                      step="0.01"
                      placeholder="Enter on-the-spot fee"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Payment Method
                    </label>
                    <select
                      value={newEvent.onSpotPaymentMethod}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotPaymentMethod: e.target.value as 'online' | 'offline' | 'both' })}
                      className="input-field"
                    >
                      <option value="both">Both Online & Offline</option>
                      <option value="online">Online Only</option>
                      <option value="offline">Offline Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.onSpotStartTime}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotStartTime: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.onSpotEndTime}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotEndTime: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Edit Event Form */}
        {showEditForm && (
          <motion.div
            className="bg-gray-800 rounded-xl p-6 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-xl font-semibold text-white mb-6">Edit Event</h3>
            
            <form onSubmit={handleUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room No. (Optional)</label>
                <input
                  type="text"
                  value={newEvent.roomNo}
                  onChange={(e) => setNewEvent({ ...newEvent, roomNo: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., Room 101, Hall A, etc. (Leave empty if not assigned yet)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Entry Fee (₹)</label>
                <input
                  type="number"
                  value={newEvent.entryFee}
                  onChange={(e) => setNewEvent({ ...newEvent, entryFee: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Teams</label>
                <input
                  type="number"
                  value={newEvent.maxTeams}
                  onChange={(e) => setNewEvent({ ...newEvent, maxTeams: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Day</label>
                <select
                  value={newEvent.eventDay}
                  onChange={(e) => setNewEvent({ ...newEvent, eventDay: e.target.value as 'day1' | 'day2' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="day1">Day 1</option>
                  <option value="day2">Day 2</option>
                </select>
              </div>

              {newEvent.isTeamEvent && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Members Per Team</label>
                  <input
                    type="number"
                    value={newEvent.membersPerTeam}
                    onChange={(e) => setNewEvent({ ...newEvent, membersPerTeam: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    min="1"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                <select
                  value={newEvent.paymentMethod}
                  onChange={(e) => setNewEvent({ ...newEvent, paymentMethod: e.target.value as 'online' | 'offline' | 'both' })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                  <option value="both">Both</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label>
                <input
                  type="text"
                  value={newEvent.upiId}
                  onChange={(e) => setNewEvent({ ...newEvent, upiId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="example@upi"
                />
              </div>

              {/* On-the-spot Registration Section */}
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">
                  On-the-Spot Registration
                </h4>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newEvent.allowOnSpotRegistration}
                    onChange={(e) => setNewEvent({ ...newEvent, allowOnSpotRegistration: e.target.checked })}
                    className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-300">
                    Allow on-the-spot registration (when event is being held)
                  </span>
                </label>
              </div>

              {newEvent.allowOnSpotRegistration && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Entry Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={newEvent.onSpotEntryFee}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotEntryFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      placeholder="Enter on-the-spot fee"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Payment Method
                    </label>
                    <select
                      value={newEvent.onSpotPaymentMethod}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotPaymentMethod: e.target.value as 'online' | 'offline' | 'both' })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="both">Both Online & Offline</option>
                      <option value="online">Online Only</option>
                      <option value="offline">Offline Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot Start Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.onSpotStartTime}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotStartTime: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      On-the-Spot End Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.onSpotEndTime}
                      onChange={(e) => setNewEvent({ ...newEvent, onSpotEndTime: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
              
              <div className="md:col-span-2">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newEvent.isTeamEvent}
                      onChange={(e) => setNewEvent({ ...newEvent, isTeamEvent: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-gray-300">Team Event</span>
                  </label>
                  
                  {newEvent.isTeamEvent && (
                    <div className="flex items-center">
                      <label className="text-gray-300 mr-2">Team Size:</label>
                      <input
                        type="number"
                        value={newEvent.teamSize}
                        onChange={(e) => setNewEvent({ ...newEvent, teamSize: Number(e.target.value) })}
                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                        min="2"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-2 flex space-x-4">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Update Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingEvent(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Events List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Events Management</h2>
          
          {events.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-white mb-2">No Events Created</h3>
              <p className="text-gray-400">Create your first event to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">{event.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {event.currentParticipants} participants
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(event.date)} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Users className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Entry Fee: ₹{event.entryFee}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Active
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/event/${event.id}/participants`}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View Participants"
                      >
                        <Users className="h-4 w-4 text-cyan-400" />
                      </Link>
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleExportEventParticipants(event)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Export Participants"
                      >
                        <Download className="h-4 w-4 text-blue-400" />
                      </button>
                      {event.isTeamEvent && (
                        <button
                          onClick={() => handleExportTeamDetails(event)}
                          className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                          title="Export Team Details"
                        >
                          <Users className="h-4 w-4 text-purple-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOfflineRegistration(event)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Offline Registration"
                      >
                        <User className="h-4 w-4 text-green-400" />
                      </button>
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Daily Registration Closure Management */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Daily Registration Closure</h2>
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-300 mb-4">
              Close registration for specific dates. Users won't be able to register on closed dates, 
              but can still register on-the-spot during event hours if enabled.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{event.title}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Today</span>
                      <button
                        onClick={() => handleToggleDailyClosure(event, new Date().toISOString().split('T')[0])}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          event.dailyRegistrationClosure?.[new Date().toISOString().split('T')[0]]
                            ? 'bg-red-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}
                      >
                        {event.dailyRegistrationClosure?.[new Date().toISOString().split('T')[0]]
                          ? 'Closed'
                          : 'Open'
                        }
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Event Day</span>
                      <button
                        onClick={() => handleToggleDailyClosure(event, event.date)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          event.dailyRegistrationClosure?.[event.date]
                            ? 'bg-red-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}
                      >
                        {event.dailyRegistrationClosure?.[event.date]
                          ? 'Closed'
                          : 'Open'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* On-the-Spot Pricing Management */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">On-the-Spot Pricing</h2>
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-300 mb-4">
              Update on-the-spot registration pricing after regular registration closes. 
              This allows you to adjust pricing for last-minute registrations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">{event.title}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Regular Fee</label>
                      <div className="text-lg font-semibold text-cyan-400">₹{event.entryFee}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">On-the-Spot Fee</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={event.onSpotEntryFee || event.entryFee}
                          onChange={(e) => handleUpdateOnSpotPricing(event, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleUpdateOnSpotPricing(event, event.onSpotEntryFee || event.entryFee)}
                          className="px-2 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {event.allowOnSpotRegistration ? (
                        <span className="text-green-400">On-the-spot enabled</span>
                      ) : (
                        <span className="text-red-400">On-the-spot disabled</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Offline Registration Modal */}
      {selectedEvent && (
        <OfflineRegistration
          isOpen={showOfflineRegistration}
          onClose={() => {
            setShowOfflineRegistration(false);
            setSelectedEvent(null);
          }}
          onSuccess={handleOfflineRegistrationSuccess}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default AdminPage;