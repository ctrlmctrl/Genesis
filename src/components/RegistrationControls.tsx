import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Settings, Save, X, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';

interface RegistrationControlsProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event; // If provided, controls for specific event
  currentUser: { id: string; name: string; role: string };
}

const RegistrationControls: React.FC<RegistrationControlsProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(event || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Global controls (for all events)
  const [globalControls, setGlobalControls] = useState({
    allowAfterDeadline: false,
    allowAfterDeadlineForAdmins: true,
    allowAfterDeadlineForVolunteers: true,
    deadlineOverrideReason: '',
  });
  
  // Day-wise controls
  const [dayWiseControls, setDayWiseControls] = useState({
    day1: {
      allowRegistration: true,
      registrationEndDate: '',
      registrationEndTime: '',
      allowLateRegistration: false,
    },
    day2: {
      allowRegistration: true,
      registrationEndDate: '',
      registrationEndTime: '',
      allowLateRegistration: false,
    },
  });
  
  // Event-specific controls
  const [eventControls, setEventControls] = useState({
    allowAfterDeadline: false,
    allowAfterDeadlineForAdmins: true,
    allowAfterDeadlineForVolunteers: true,
    deadlineOverrideReason: '',
    registrationEndDate: '',
    registrationEndTime: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadEvents();
      if (event) {
        setSelectedEvent(event);
        loadEventControls(event);
      }
    }
  }, [isOpen, event]);

  const loadEvents = async () => {
    setLoading(true);
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

  const loadEventControls = (eventData: Event) => {
    if (eventData.registrationControls) {
      setEventControls({
        allowAfterDeadline: eventData.registrationControls.allowAfterDeadline,
        allowAfterDeadlineForAdmins: eventData.registrationControls.allowAfterDeadlineForAdmins,
        allowAfterDeadlineForVolunteers: eventData.registrationControls.allowAfterDeadlineForVolunteers,
        deadlineOverrideReason: eventData.registrationControls.deadlineOverrideReason || '',
        registrationEndDate: eventData.registrationEndDate || '',
        registrationEndTime: eventData.registrationEndTime || '',
      });
    }
    
    if (eventData.dayWiseControls) {
      setDayWiseControls({
        day1: {
          allowRegistration: eventData.dayWiseControls.day1?.allowRegistration ?? true,
          registrationEndDate: eventData.dayWiseControls.day1?.registrationEndDate || '',
          registrationEndTime: eventData.dayWiseControls.day1?.registrationEndTime || '',
          allowLateRegistration: eventData.dayWiseControls.day1?.allowLateRegistration ?? false,
        },
        day2: {
          allowRegistration: eventData.dayWiseControls.day2?.allowRegistration ?? true,
          registrationEndDate: eventData.dayWiseControls.day2?.registrationEndDate || '',
          registrationEndTime: eventData.dayWiseControls.day2?.registrationEndTime || '',
          allowLateRegistration: eventData.dayWiseControls.day2?.allowLateRegistration ?? false,
        },
      });
    }
  };

  const handleSaveGlobalControls = async () => {
    setSaving(true);
    try {
      // Apply global controls to all events
      for (const eventData of events) {
        const updatedEvent = {
          ...eventData,
          registrationControls: {
            allowAfterDeadline: globalControls.allowAfterDeadline,
            allowAfterDeadlineForAdmins: globalControls.allowAfterDeadlineForAdmins,
            allowAfterDeadlineForVolunteers: globalControls.allowAfterDeadlineForVolunteers,
            deadlineOverrideReason: globalControls.deadlineOverrideReason,
            setBy: currentUser.name,
            setAt: new Date().toISOString(),
          },
        };
        await dataService.updateEvent(eventData.id, updatedEvent);
      }
      
      toast.success('Global registration controls updated successfully!');
    } catch (error) {
      console.error('Error saving global controls:', error);
      toast.error('Failed to save global controls');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEventControls = async () => {
    if (!selectedEvent) return;
    
    setSaving(true);
    try {
      const updatedEvent = {
        ...selectedEvent,
        registrationControls: {
          allowAfterDeadline: eventControls.allowAfterDeadline,
          allowAfterDeadlineForAdmins: eventControls.allowAfterDeadlineForAdmins,
          allowAfterDeadlineForVolunteers: eventControls.allowAfterDeadlineForVolunteers,
          deadlineOverrideReason: eventControls.deadlineOverrideReason,
          setBy: currentUser.name,
          setAt: new Date().toISOString(),
        },
        registrationEndDate: eventControls.registrationEndDate,
        registrationEndTime: eventControls.registrationEndTime,
        dayWiseControls: {
          day1: dayWiseControls.day1,
          day2: dayWiseControls.day2,
        },
      };
      
      await dataService.updateEvent(selectedEvent.id, updatedEvent);
      setSelectedEvent(updatedEvent);
      
      toast.success('Event registration controls updated successfully!');
    } catch (error) {
      console.error('Error saving event controls:', error);
      toast.error('Failed to save event controls');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDayWiseControls = async () => {
    setSaving(true);
    try {
      // Apply day-wise controls to all events
      for (const eventData of events) {
        const updatedEvent = {
          ...eventData,
          dayWiseControls: {
            day1: dayWiseControls.day1,
            day2: dayWiseControls.day2,
          },
        };
        await dataService.updateEvent(eventData.id, updatedEvent);
      }
      
      toast.success('Day-wise registration controls updated successfully!');
    } catch (error) {
      console.error('Error saving day-wise controls:', error);
      toast.error('Failed to save day-wise controls');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Registration Controls</h2>
            <p className="text-sm text-gray-400">
              {event ? `Managing controls for: ${event.title}` : 'Manage registration controls for all events'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <>
              {/* Global Controls */}
              {!event && (
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Settings className="h-5 w-5 text-cyan-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Global Registration Controls</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">
                    These settings will apply to all events. Use this for system-wide registration policies.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="global-allow-after-deadline"
                          checked={globalControls.allowAfterDeadline}
                          onChange={(e) => setGlobalControls(prev => ({
                            ...prev,
                            allowAfterDeadline: e.target.checked
                          }))}
                          className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                        />
                        <label htmlFor="global-allow-after-deadline" className="text-white">
                          Allow registration after deadline
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="global-allow-admins"
                          checked={globalControls.allowAfterDeadlineForAdmins}
                          onChange={(e) => setGlobalControls(prev => ({
                            ...prev,
                            allowAfterDeadlineForAdmins: e.target.checked
                          }))}
                          className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                        />
                        <label htmlFor="global-allow-admins" className="text-white">
                          Allow admins to register after deadline
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="global-allow-volunteers"
                          checked={globalControls.allowAfterDeadlineForVolunteers}
                          onChange={(e) => setGlobalControls(prev => ({
                            ...prev,
                            allowAfterDeadlineForVolunteers: e.target.checked
                          }))}
                          className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                        />
                        <label htmlFor="global-allow-volunteers" className="text-white">
                          Allow volunteers to register after deadline
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Override Reason
                      </label>
                      <textarea
                        value={globalControls.deadlineOverrideReason}
                        onChange={(e) => setGlobalControls(prev => ({
                          ...prev,
                          deadlineOverrideReason: e.target.value
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="Reason for allowing late registration..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleSaveGlobalControls}
                      disabled={saving}
                      className="btn-primary flex items-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Global Controls'}
                    </button>
                  </div>
                </div>
              )}

              {/* Day-wise Controls */}
              <div className="bg-gray-700/50 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Day-wise Registration Controls</h3>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Control registration availability for Day 1 and Day 2 events separately.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Day 1 Controls */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-cyan-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Day 1 Events
                    </h4>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="day1-allow"
                        checked={dayWiseControls.day1.allowRegistration}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day1: { ...prev.day1, allowRegistration: e.target.checked }
                        }))}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="day1-allow" className="text-white">
                        Allow Day 1 registration
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Registration End Date
                      </label>
                      <input
                        type="date"
                        value={dayWiseControls.day1.registrationEndDate}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day1: { ...prev.day1, registrationEndDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Registration End Time
                      </label>
                      <input
                        type="time"
                        value={dayWiseControls.day1.registrationEndTime}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day1: { ...prev.day1, registrationEndTime: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="day1-late"
                        checked={dayWiseControls.day1.allowLateRegistration}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day1: { ...prev.day1, allowLateRegistration: e.target.checked }
                        }))}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="day1-late" className="text-white">
                        Allow late registration
                      </label>
                    </div>
                  </div>
                  
                  {/* Day 2 Controls */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-purple-400 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Day 2 Events
                    </h4>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="day2-allow"
                        checked={dayWiseControls.day2.allowRegistration}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day2: { ...prev.day2, allowRegistration: e.target.checked }
                        }))}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="day2-allow" className="text-white">
                        Allow Day 2 registration
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Registration End Date
                      </label>
                      <input
                        type="date"
                        value={dayWiseControls.day2.registrationEndDate}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day2: { ...prev.day2, registrationEndDate: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Registration End Time
                      </label>
                      <input
                        type="time"
                        value={dayWiseControls.day2.registrationEndTime}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day2: { ...prev.day2, registrationEndTime: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="day2-late"
                        checked={dayWiseControls.day2.allowLateRegistration}
                        onChange={(e) => setDayWiseControls(prev => ({
                          ...prev,
                          day2: { ...prev.day2, allowLateRegistration: e.target.checked }
                        }))}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <label htmlFor="day2-late" className="text-white">
                        Allow late registration
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={handleSaveDayWiseControls}
                    disabled={saving}
                    className="btn-primary flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Day-wise Controls'}
                  </button>
                </div>
              </div>

              {/* Event-specific Controls */}
              {!event && (
                <div className="bg-gray-700/50 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Users className="h-5 w-5 text-green-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Event-specific Controls</h3>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Event
                    </label>
                    <select
                      value={selectedEvent?.id || ''}
                      onChange={(e) => {
                        const eventData = events.find(ev => ev.id === e.target.value);
                        setSelectedEvent(eventData || null);
                        if (eventData) loadEventControls(eventData);
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    >
                      <option value="">Select an event...</option>
                      {events.map(eventData => (
                        <option key={eventData.id} value={eventData.id}>
                          {eventData.title} ({eventData.eventDay})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedEvent && (
                    <div className="space-y-4">
                      <div className="bg-gray-600/50 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-2">{selectedEvent.title}</h4>
                        <p className="text-sm text-gray-400">Day: {selectedEvent.eventDay}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Registration End Date
                          </label>
                          <input
                            type="date"
                            value={eventControls.registrationEndDate}
                            onChange={(e) => setEventControls(prev => ({
                              ...prev,
                              registrationEndDate: e.target.value
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Registration End Time
                          </label>
                          <input
                            type="time"
                            value={eventControls.registrationEndTime}
                            onChange={(e) => setEventControls(prev => ({
                              ...prev,
                              registrationEndTime: e.target.value
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="event-allow-after-deadline"
                            checked={eventControls.allowAfterDeadline}
                            onChange={(e) => setEventControls(prev => ({
                              ...prev,
                              allowAfterDeadline: e.target.checked
                            }))}
                            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                          />
                          <label htmlFor="event-allow-after-deadline" className="text-white">
                            Allow registration after deadline
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Override Reason
                          </label>
                          <textarea
                            value={eventControls.deadlineOverrideReason}
                            onChange={(e) => setEventControls(prev => ({
                              ...prev,
                              deadlineOverrideReason: e.target.value
                            }))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            placeholder="Reason for allowing late registration..."
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <button
                        onClick={handleSaveEventControls}
                        disabled={saving}
                        className="btn-primary flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Event Controls'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RegistrationControls;
