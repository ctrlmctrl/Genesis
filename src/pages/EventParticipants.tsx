import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Download, CheckCircle, Clock, User, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Participant, Event } from '../types';
import { dataService } from '../services/dataService';
import { excelService } from '../services/excelService';
import { realtimeService } from '../services/realtimeService';
import { roleAuthService } from '../services/roleAuth';
import toast from 'react-hot-toast';

const EventParticipants: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    // Check if user has admin or volunteer access
    if (!roleAuthService.hasRole('admin') && !roleAuthService.hasRole('volunteer')) {
      toast.error('Access denied. Admin or volunteer privileges required.');
      navigate('/');
      return;
    }

    if (!eventId) return;

    // Check if we're using Firebase (production) or localStorage (development)
    const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                      (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

    let unsubscribeParticipants: (() => void) | null = null;

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        
        // Load event details (this doesn't change often, so we load it once)
        const eventData = await dataService.getEvent(eventId);
        if (!eventData) {
          toast.error('Event not found');
          navigate('/');
          return;
        }
        setEvent(eventData);
        
        // Listen to participants in real-time
        unsubscribeParticipants = realtimeService.listenToEventParticipants(eventId, (participantsData) => {
          setParticipants(participantsData);
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Error loading event participants:', error);
        toast.error('Failed to load participants');
        setLoading(false);
      }
    };

    const loadDataFallback = async () => {
      try {
        setLoading(true);
        
        // Load event details
        const eventData = await dataService.getEvent(eventId);
        if (!eventData) {
          toast.error('Event not found');
          navigate('/');
          return;
        }
        setEvent(eventData);
        
        // Load participants
        const participantsData = await dataService.getParticipantsByEvent(eventId);
        setParticipants(participantsData);
        
      } catch (error) {
        console.error('Error loading event participants:', error);
        toast.error('Failed to load participants');
      } finally {
        setLoading(false);
      }
    };

    if (isFirebase) {
      setupRealtimeListeners();
    } else {
      loadDataFallback();
    }

    // Cleanup function
    return () => {
      if (unsubscribeParticipants) unsubscribeParticipants();
    };
  }, [eventId, navigate]);

  // Memoized filtered and sorted participants
  const filteredAndSortedParticipants = useMemo(() => {
    let filtered = participants;
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = participants.filter(p => 
        p.fullName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.college.toLowerCase().includes(term) ||
        p.phone.includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.registrationDate);
          bValue = new Date(b.registrationDate);
          break;
        case 'status':
          aValue = a.paymentStatus;
          bValue = b.paymentStatus;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [participants, searchTerm, sortBy, sortOrder]);

  // Memoized paginated participants
  const paginatedParticipants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedParticipants.slice(startIndex, endIndex);
  }, [filteredAndSortedParticipants, currentPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAndSortedParticipants.length / ITEMS_PER_PAGE);

  const handleExportParticipants = async () => {
    if (!event || participants.length === 0) return;
    
    try {
      setExporting(true);
      await excelService.exportParticipantsToExcel(participants, event);
      toast.success('Participants exported successfully!');
    } catch (error) {
      console.error('Error exporting participants:', error);
      toast.error('Failed to export participants');
    } finally {
      setExporting(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!event || participants.length === 0) return;
    
    try {
      setExporting(true);
      await excelService.exportParticipantsToPDF(participants, event);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSortChange = useCallback((newSortBy: 'name' | 'date' | 'status') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-400 bg-green-400/10';
      case 'offline_paid':
        return 'text-blue-400 bg-blue-400/10';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'offline_paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Events
        </button>
        
        {participants.length > 0 && (
          <div className="flex space-x-2">
            <button
              onClick={handleExportParticipants}
              disabled={exporting}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <button
              onClick={handleExportToPDF}
              disabled={exporting}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Event Info */}
      <div className="card mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
        <p className="text-gray-600 mb-4">{event.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {event.roomNo && (
            <div className="flex items-center text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              Room: {event.roomNo}
            </div>
          )}
          <div className="flex items-center text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {event.isTeamEvent 
              ? `Team Event`
              : 'Individual Event'
            }
          </div>
          <div className="flex items-center text-gray-600">
            <span className="font-medium">Entry Fee: ₹{event.entryFee}</span>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Participants ({filteredAndSortedParticipants.length})
          </h2>
        </div>

        {/* Search and Sort Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search participants by name, email, college, or phone..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSortChange('name')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'name' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('date')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'date' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('status')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === 'status' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {filteredAndSortedParticipants.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No Matching Participants' : 'No Participants'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'No participants match your search criteria.' 
                : 'No registrations found for this event.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedParticipants.map((participant) => (
              <div
                key={participant.id}
                className="border border-gray-600 rounded-lg p-4 hover:bg-gray-700 transition-colors bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {participant.fullName}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Mail className="h-3 w-3 mr-1" />
                      {participant.email}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {participant.phone}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(participant.paymentStatus)}`}>
                      {getStatusIcon(participant.paymentStatus)}
                      <span className="ml-1 capitalize">{participant.paymentStatus.replace('_', ' ')}</span>
                    </div>
                    
                    {participant.isVerified && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium text-green-400 bg-green-400/10 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>College: {participant.college}</div>
                  <div>Standard: {participant.standard}</div>
                  <div>Stream: {participant.stream}</div>
                  <div>Registration: {new Date(participant.registrationDate).toLocaleDateString()}</div>
                  {participant.teamName && (
                    <div>Team: {participant.teamName}</div>
                  )}
                  {participant.isTeamLead && (
                    <div className="text-blue-600 font-medium">Team Lead</div>
                  )}
                </div>
              </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedParticipants.length)} of {filteredAndSortedParticipants.length} participants
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      const isActive = pageNum === currentPage;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            isActive
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventParticipants;
