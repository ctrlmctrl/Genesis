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
  User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import { excelService } from '../services/excelService';
import OfflineRegistration from '../components/OfflineRegistration';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    entryFee: 0,
    paymentMethod: 'both' as 'online' | 'offline' | 'both',
    upiId: '',
  });
  const [showOfflineRegistration, setShowOfflineRegistration] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
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

    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await dataService.createEvent({
        ...newEvent,
        isActive: true,
      });
      
      toast.success('Event created successfully!');
      setShowCreateForm(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        entryFee: 0,
        paymentMethod: 'both',
        upiId: '',
      });
      
      // Reload events
      const eventsData = await dataService.getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handleExportAll = () => {
    excelService.exportEventSummary(events);
    toast.success('Events exported successfully!');
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

  const handleLogout = () => {
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
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
                        to={`/admin/events/${event.id}`}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleOfflineRegistration(event)}
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Offline Registration"
                      >
                        <User className="h-4 w-4 text-green-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4 text-gray-400" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
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