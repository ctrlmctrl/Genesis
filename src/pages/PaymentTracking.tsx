import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Download, CheckCircle, Clock, AlertCircle, Copy, Eye, FileText, Image, X, QrCode } from 'lucide-react';
import { Participant, Event } from '../types';
import { dataService } from '../services/dataService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import RoleLogin from '../components/RoleLogin';
import OfflineCodeGenerator from '../components/OfflineCodeGenerator';
import toast from 'react-hot-toast';

const PaymentTracking: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'under_verification' | 'paid' | 'offline_paid' | 'failed'>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [showPaymentVerification, setShowPaymentVerification] = useState(false);
  const [verificationIdentifier, setVerificationIdentifier] = useState('');
  const [verificationParticipant, setVerificationParticipant] = useState<Participant | null>(null);
  const [adminTransactionId, setAdminTransactionId] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showUPIVerification, setShowUPIVerification] = useState(false);
  const [upiTransaction, setUpiTransaction] = useState({
    amount: '',
    time: '',
    upiId: '',
    transactionId: '',
    notes: ''
  });
  const [matchingParticipants, setMatchingParticipants] = useState<Participant[]>([]);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string>('');
  const [sortBy, setSortBy] = useState<'time' | 'amount' | 'name'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [selectedEventForCode, setSelectedEventForCode] = useState<Event | null>(null);

  useEffect(() => {
    const currentUser = roleAuthService.getCurrentUser();
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'volunteer')) {
      setUser(currentUser);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const [participantsData, eventsData] = await Promise.all([
        dataService.getParticipants(),
        dataService.getEvents()
      ]);
      setParticipants(participantsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: RoleUser) => {
    setUser(loggedInUser);
    loadData();
  };

  const handleLogout = () => {
    roleAuthService.logout();
    setUser(null);
    navigate('/');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Payment ID copied to clipboard!');
  };

  const handleVerifyPayment = async () => {
    if (!verificationIdentifier.trim()) {
      toast.error('Please enter a participant ID');
      return;
    }

    setVerifying(true);
    try {
      const participant = await dataService.getParticipant(verificationIdentifier);
      if (!participant) {
        toast.error('No participant found with this ID');
        return;
      }
      setVerificationParticipant(participant);
    } catch (error) {
      console.error('Error finding participant:', error);
      toast.error('Failed to find participant');
    } finally {
      setVerifying(false);
    }
  };

  const handleMarkAsPaid = async (participant: Participant, status: 'paid' | 'offline_paid' | 'failed') => {
    try {
      const success = await dataService.updatePaymentStatus(
        participant.id,
        status,
        status === 'paid' ? 'online' : status === 'offline_paid' ? 'offline' : undefined
      );
      
      if (success) {
        toast.success(`Payment marked as ${status.replace('_', ' ')}`);
        setVerificationParticipant(null);
        setVerificationIdentifier('');
        loadData(); // Refresh the data
      } else {
        toast.error('Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleUPITransactionSearch = () => {
    if (!upiTransaction.amount || !upiTransaction.time) {
      toast.error('Please enter amount and time');
      return;
    }

    const amount = parseFloat(upiTransaction.amount);
    const transactionTime = new Date(upiTransaction.time);
    
    // Find participants with matching amount and pending status
    const matches = participants.filter(participant => {
      if (participant.paymentStatus !== 'pending') return false;
      
      const participantAmount = participant.entryFeePaid || 0;
      const amountMatch = Math.abs(participantAmount - amount) < 0.01; // Allow for small rounding differences
      
      // Check if transaction time is within reasonable range (within last 24 hours)
      const now = new Date();
      const timeDiff = now.getTime() - transactionTime.getTime();
      const within24Hours = timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000;
      
      return amountMatch && within24Hours;
    });

    setMatchingParticipants(matches);
    
    if (matches.length === 0) {
      toast.error('No matching participants found. Check amount and time.');
    } else {
      toast.success(`Found ${matches.length} potential match(es)`);
    }
  };

  const handleUPIPaymentConfirm = async (participant: Participant) => {
    try {
      const success = await dataService.updatePaymentStatus(
        participant.id,
        'paid',
        'online'
      );
      
      if (success) {
        toast.success(`Payment confirmed for ${participant.fullName}`);
        setMatchingParticipants([]);
        setUpiTransaction({ amount: '', time: '', upiId: '', transactionId: '', notes: '' });
        loadData();
      } else {
        toast.error('Failed to confirm payment');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  const handleViewReceipt = (receiptUrl: string) => {
    setSelectedReceiptUrl(receiptUrl);
    setShowReceiptViewer(true);
  };

  const closeReceiptViewer = () => {
    setShowReceiptViewer(false);
    setSelectedReceiptUrl('');
  };

  const getReceiptIcon = (receiptUrl: string) => {
    if (receiptUrl.includes('.pdf')) {
      return <FileText className="h-4 w-4 text-red-400" />;
    } else {
      return <Image className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline_paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_verification':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'offline_paid':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'failed':
        return <X className="h-3 w-3" />;
      case 'under_verification':
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || participant.paymentStatus === filterStatus;
    const matchesEvent = selectedEvent === 'all' || participant.eventId === selectedEvent;
    
    return matchesSearch && matchesStatus && matchesEvent;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'time':
        comparison = new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
        break;
      case 'amount':
        comparison = (a.entryFeePaid || 0) - (b.entryFeePaid || 0);
        break;
      case 'name':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const paymentStats = {
    total: participants.length,
    pending: participants.filter(p => p.paymentStatus === 'pending').length,
    under_verification: participants.filter(p => p.paymentStatus === 'under_verification').length,
    paid: participants.filter(p => p.paymentStatus === 'paid').length,
    offline_paid: participants.filter(p => p.paymentStatus === 'offline_paid').length,
    failed: participants.filter(p => p.paymentStatus === 'failed').length,
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

  if (!user) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <RoleLogin onLogin={handleLogin} role="admin" />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white neon-text">Payment Tracking</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (events.length > 0) {
                setSelectedEventForCode(events[0]); // Default to first event
                setShowCodeGenerator(true);
              }
            }}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate Codes
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        <div className="card-glow text-center">
          <div className="text-2xl font-bold text-white">{paymentStats.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="card-glow text-center">
          <div className="text-2xl font-bold text-yellow-400">{paymentStats.pending}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="card-glow text-center">
          <div className="text-2xl font-bold text-purple-400">{paymentStats.under_verification}</div>
          <div className="text-sm text-gray-400">Under Review</div>
        </div>
        <div className="card-glow text-center">
          <div className="text-2xl font-bold text-green-400">{paymentStats.paid}</div>
          <div className="text-sm text-gray-400">Online Paid</div>
        </div>
        <div className="card-glow text-center">
          <div className="text-2xl font-bold text-blue-400">{paymentStats.offline_paid}</div>
          <div className="text-sm text-gray-400">Offline Paid</div>
        </div>
        <div className="card-glow text-center md:col-span-2">
          <div className="text-2xl font-bold text-red-400">{paymentStats.failed}</div>
          <div className="text-sm text-gray-400">Failed/Rejected</div>
        </div>
      </div>

      {/* UPI Transaction Verification */}
      <div className="card-glow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">UPI Transaction Verification</h2>
          <button
            onClick={() => setShowUPIVerification(!showUPIVerification)}
            className="btn-secondary text-sm"
          >
            {showUPIVerification ? 'Hide' : 'Show'} UPI Verification
          </button>
        </div>
        
        {showUPIVerification && (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Enter UPI transaction details to find matching participants. This helps when you only have transaction ID from UPI app.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount Received (₹)</label>
                <input
                  type="number"
                  value={upiTransaction.amount}
                  onChange={(e) => setUpiTransaction({ ...upiTransaction, amount: e.target.value })}
                  placeholder="e.g., 500"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Time</label>
                <input
                  type="datetime-local"
                  value={upiTransaction.time}
                  onChange={(e) => setUpiTransaction({ ...upiTransaction, time: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">UPI ID (Optional)</label>
                <input
                  type="text"
                  value={upiTransaction.upiId}
                  onChange={(e) => setUpiTransaction({ ...upiTransaction, upiId: e.target.value })}
                  placeholder="e.g., genesis@upi"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={upiTransaction.transactionId}
                  onChange={(e) => setUpiTransaction({ ...upiTransaction, transactionId: e.target.value })}
                  placeholder="e.g., TXN123456789"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <button
              onClick={handleUPITransactionSearch}
              className="btn-primary"
            >
              Find Matching Participants
            </button>
            
            {matchingParticipants.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-lg font-semibold text-white">Potential Matches:</h3>
                {matchingParticipants.map((participant) => {
                  const event = events.find(e => e.id === participant.eventId);
                  return (
                    <div key={participant.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-semibold">{participant.fullName}</h4>
                          <p className="text-gray-400 text-sm">{participant.email}</p>
                          <p className="text-gray-400 text-sm">{participant.phone}</p>
                          {event && <p className="text-cyan-400 text-sm">{event.title}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">₹{participant.entryFeePaid || 0}</p>
                          <p className="text-gray-400 text-xs">
                            {new Date(participant.registrationDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Participant ID: <span className="font-mono">{participant.id.slice(-8)}</span>
                        </div>
                        <button
                          onClick={() => handleUPIPaymentConfirm(participant)}
                          className="btn-primary text-sm"
                        >
                          Confirm Payment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Verification */}
      <div className="card-glow mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Participant ID Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Participant ID</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={verificationIdentifier}
                onChange={(e) => setVerificationIdentifier(e.target.value)}
                placeholder="Enter participant ID"
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={handleVerifyPayment}
                disabled={verifying}
                className="btn-primary disabled:opacity-50"
              >
                {verifying ? 'Searching...' : 'Verify'}
              </button>
            </div>
          </div>
          
          {verificationParticipant && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Participant Found</h3>
              <div className="space-y-2 text-sm">
                <p><strong className="text-gray-300">Name:</strong> <span className="text-white">{verificationParticipant.fullName}</span></p>
                <p><strong className="text-gray-300">Email:</strong> <span className="text-white">{verificationParticipant.email}</span></p>
                <p><strong className="text-gray-300">Phone:</strong> <span className="text-white">{verificationParticipant.phone}</span></p>
                <p><strong className="text-gray-300">Current Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(verificationParticipant.paymentStatus)}`}>
                    {verificationParticipant.paymentStatus.replace('_', ' ')}
                  </span>
                </p>
                {verificationParticipant.entryFeePaid && (
                  <p><strong className="text-gray-300">Amount:</strong> <span className="text-white">₹{verificationParticipant.entryFeePaid}</span></p>
                )}
              </div>
              
              {verificationParticipant.paymentStatus === 'pending' && (
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleMarkAsPaid(verificationParticipant, 'paid')}
                    className="btn-primary text-sm"
                  >
                    Mark as Online Paid
                  </button>
                  <button
                    onClick={() => handleMarkAsPaid(verificationParticipant, 'offline_paid')}
                    className="btn-secondary text-sm"
                  >
                    Mark as Offline Paid
                  </button>
                  <button
                    onClick={() => handleMarkAsPaid(verificationParticipant, 'failed')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Mark as Failed
                  </button>
                </div>
              )}
                {/* Admin-only transaction ID entry and duplicate check */}
                <div className="mt-4">
                  <label className="block text-sm text-gray-300 mb-2">Transaction ID (admin only)</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={adminTransactionId}
                      onChange={(e) => setAdminTransactionId(e.target.value)}
                      placeholder="e.g., TXN123456789 or bank reference"
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    />
                    <button
                      onClick={async () => {
                        if (!verificationParticipant) return;
                        if (!adminTransactionId.trim()) {
                          toast.error('Enter a transaction ID first');
                          return;
                        }

                        // Check for duplicates
                        const duplicate = participants.find(p => p.transactionId === adminTransactionId.trim() && p.id !== verificationParticipant.id);
                        if (duplicate) {
                          toast.error('Duplicate transaction ID found: another participant has the same transaction ID');
                          return;
                        }

                        try {
                          const updated = await dataService.updatePaymentStatus(verificationParticipant.id, 'paid', 'online', verificationParticipant.receiptUrl, adminTransactionId.trim());
                          if (updated) {
                            toast.success('Transaction ID saved and payment marked as paid');
                            setVerificationParticipant(updated);
                            setAdminTransactionId('');
                            loadData();
                          } else {
                            toast.error('Failed to update participant');
                          }
                        } catch (err) {
                          console.error('Error saving transaction ID:', err);
                          toast.error('Failed to save transaction ID');
                        }
                      }}
                      className="btn-primary text-sm"
                    >
                      Save & Verify
                    </button>
                  </div>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card-glow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_verification">Under Verification</option>
              <option value="paid">Online Paid</option>
              <option value="offline_paid">Offline Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'amount' | 'name')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="time">Registration Time</option>
              <option value="amount">Payment Amount</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-4">
        {filteredParticipants.length === 0 ? (
          <div className="card-glow text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-white mb-2">No Participants Found</h3>
            <p className="text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredParticipants.map((participant) => {
            const event = events.find(e => e.id === participant.eventId);
            return (
              <div key={participant.id} className="card-glow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{participant.fullName}</h3>
                    <p className="text-gray-400">{participant.email}</p>
                    <p className="text-gray-400">{participant.phone}</p>
                    {event && (
                      <p className="text-sm text-cyan-400 mt-1">{event.title}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center border ${getStatusColor(participant.paymentStatus)}`}>
                      {getStatusIcon(participant.paymentStatus)}
                      <span className="ml-2 capitalize">{participant.paymentStatus.replace('_', ' ')}</span>
                    </div>
                    
                    {participant.isVerified && (
                      <div className="px-2 py-1 rounded-full text-xs font-medium text-green-400 bg-green-400/10 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-gray-300">College:</strong>
                    <span className="ml-2 text-white">{participant.college}</span>
                  </div>
                  <div>
                    <strong className="text-gray-300">Standard:</strong>
                    <span className="ml-2 text-white">{participant.standard}</span>
                  </div>
                  <div>
                    <strong className="text-gray-300">Stream:</strong>
                    <span className="ml-2 text-white">{participant.stream}</span>
                  </div>
                  <div>
                    <strong className="text-gray-300">Registration:</strong>
                    <span className="ml-2 text-white">{new Date(participant.registrationDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="md:col-span-2">
                    <strong className="text-gray-300">Participant ID:</strong>
                    <div className="flex items-center mt-1">
                      <span className="font-mono bg-gray-700 px-3 py-1 rounded text-white text-sm">
                        {participant.id.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(participant.id)}
                        className="ml-2 p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy Participant ID"
                      >
                          <Copy className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  
                  {participant.entryFeePaid && (
                    <div>
                      <strong className="text-gray-300">Amount Paid:</strong>
                      <span className="ml-2 text-white">₹{participant.entryFeePaid}</span>
                    </div>
                  )}
                  
                  {participant.registrationType && (
                    <div>
                      <strong className="text-gray-300">Registration Type:</strong>
                      <span className="ml-2 text-white capitalize">{participant.registrationType.replace('_', ' ')}</span>
                    </div>
                  )}
                  {participant.transactionId && (
                    <div>
                      <strong className="text-gray-300">Transaction ID:</strong>
                      <span className="ml-2 font-mono text-white">{participant.transactionId}</span>
                    </div>
                  )}
                  
                  {participant.receiptUrl && (
                    <div>
                      <strong className="text-gray-300">Receipt:</strong>
                      <button
                        onClick={() => handleViewReceipt(participant.receiptUrl!)}
                        className="ml-2 inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {getReceiptIcon(participant.receiptUrl)}
                        <span className="text-sm">View Receipt</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Receipt Viewer Modal */}
      {showReceiptViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Payment Receipt</h3>
              <button
                onClick={closeReceiptViewer}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {selectedReceiptUrl.includes('.pdf') ? (
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400 mb-4">PDF receipt uploaded</p>
                  <a
                    href={selectedReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    Download PDF
                  </a>
                </div>
              ) : (
                <div className="text-center">
                  <img
                    src={selectedReceiptUrl}
                    alt="Payment Receipt"
                    className="max-w-full h-auto mx-auto rounded-lg border border-gray-600"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Code Generator Modal */}
      {showCodeGenerator && selectedEventForCode && user && (
        <OfflineCodeGenerator
          isOpen={showCodeGenerator}
          onClose={() => {
            setShowCodeGenerator(false);
            setSelectedEventForCode(null);
          }}
          event={selectedEventForCode}
          currentUser={{ id: user.id, name: user.name }}
        />
      )}
    </div>
  );
};

export default PaymentTracking;
