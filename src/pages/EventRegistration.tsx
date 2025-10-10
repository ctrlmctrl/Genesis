import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Shield, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from '../components/GoogleLogin';
import PaymentModal from '../components/PaymentModal';
import { canUserRegister, getRegistrationCountdown, isRegistrationOpen, isOnSpotRegistrationAvailable, getEntryFee, getPaymentMethod, getRegistrationType } from '../services/registrationService';
import { paymentService } from '../services/paymentService';

interface RegistrationForm {
  fullName: string;
  phone: string;
  college: string;
}

const EventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [participantId, setParticipantId] = useState<string>('');
  const [registrationStatus, setRegistrationStatus] = useState<{
    canRegister: boolean;
    reason?: string;
    timeRemaining?: string;
  }>({ canRegister: true });
  const [registrationType, setRegistrationType] = useState<'regular' | 'on_spot'>('regular');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationForm>();

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return;
      
      try {
        const eventData = await dataService.getEvent(eventId);
        if (!eventData) {
          toast.error('Event not found');
          navigate('/');
          return;
        }
        setEvent(eventData);
        
        // Check registration status
        const status = canUserRegister(eventData, user?.email);
        setRegistrationStatus(status);
        
        // Determine registration type
        const regType = getRegistrationType(eventData);
        setRegistrationType(regType);
      } catch (error) {
        console.error('Error loading event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate, user?.email]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!event || !isAuthenticated) return;
    
    // Check registration status before proceeding
    const status = canUserRegister(event, user?.email);
    if (!status.canRegister) {
      toast.error(status.reason || 'Registration is not available');
      return;
    }
    
    setSubmitting(true);
    try {
      // Get the appropriate entry fee for the registration type
      const entryFee = getEntryFee(event, registrationType);
      
      // Generate unique payment identifier for UPI transaction matching
      const paymentIdentifier = paymentService.generatePaymentIdentifier();
      
      const participant = await dataService.registerParticipant({
        eventId: event.id,
        ...data,
        email: user?.email || '', // Get email from authenticated user
        registrationType: registrationType,
        entryFeePaid: entryFee,
        paymentIdentifier: paymentIdentifier,
      });

      setParticipantId(participant.id);
      
      // If event has entry fee, show payment modal
      if (entryFee > 0) {
        setShowPaymentModal(true);
      } else {
        toast.success('Registration successful!');
        navigate(`/qr/${participant.id}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const handlePaymentComplete = async (paymentId: string, method: 'online' | 'offline', receiptUrl?: string) => {
    try {
      await dataService.updatePaymentStatus(
        participantId,
        method === 'online' ? 'paid' : 'offline_paid',
        method,
        paymentId,
        receiptUrl
      );
      
      toast.success('Payment completed! Registration successful!');
      navigate(`/qr/${participantId}`);
    } catch (error) {
      console.error('Payment update error:', error);
      toast.error('Failed to update payment status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <h2 className="text-xl font-semibold text-white mb-2">Event Not Found</h2>
          <p className="text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
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

  if (!isAuthenticated) {
    return (
      <div className="mobile-container">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
        </div>

        <div className="card-glow text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
          <p className="text-gray-400 mb-6">
            Please sign in with Google to register for this event.
          </p>
          <GoogleLogin variant="dark" />
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
        <h1 className="text-2xl font-bold text-white">Event Registration</h1>
      </div>

      {/* Event Details */}
      <div className="card-glow mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">{event.title}</h2>
        <p className="text-gray-300 mb-4">{event.description}</p>
        
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-3 text-cyan-400" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-3 text-cyan-400" />
            {event.time}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <MapPin className="h-4 w-4 mr-3 text-cyan-400" />
            {event.location}
          </div>
          {event.entryFee > 0 && (
            <div className="flex items-center text-sm text-cyan-400">
              <DollarSign className="h-4 w-4 mr-3" />
              Entry Fee: ₹{event.entryFee}
            </div>
          )}
        </div>
      </div>

      {/* Registration Status */}
      {event && (
        <div className="card-glow mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Registration Status</h3>
              {registrationStatus.canRegister ? (
                <div className="flex items-center text-green-400">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                  <span>
                    {registrationType === 'on_spot' 
                      ? 'On-the-spot registration available' 
                      : 'Registration is open'
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-red-400">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-3"></div>
                  <span>{registrationStatus.reason}</span>
                </div>
              )}
              
              {/* Show pricing information */}
              {registrationStatus.canRegister && (
                <div className="mt-2 text-sm text-gray-300">
                  {registrationType === 'on_spot' && event.onSpotEntryFee !== undefined ? (
                    <div>
                      <span className="text-yellow-400">On-the-spot fee: ₹{event.onSpotEntryFee}</span>
                      {event.entryFee !== event.onSpotEntryFee && (
                        <span className="text-gray-500 ml-2">(Regular: ₹{event.entryFee})</span>
                      )}
                      {event.onSpotStartTime && event.onSpotEndTime && (
                        <div className="text-xs text-gray-400 mt-1">
                          Available: {event.onSpotStartTime} - {event.onSpotEndTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span>Entry fee: ₹{event.entryFee}</span>
                  )}
                </div>
              )}
            </div>
            
            {event.registrationStartDate && event.registrationEndDate && (
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  {getRegistrationCountdown(event).message}
                </div>
                {getRegistrationCountdown(event).timeRemaining && (
                  <div className="text-sm text-cyan-400 font-medium">
                    {getRegistrationCountdown(event).timeRemaining}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Form */}
      <div className="card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Registration Form</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              {...register('fullName', { required: 'Full name is required' })}
              className="input-field"
              placeholder="Enter your full name"
            />
            {errors.fullName && (
              <p className="text-red-400 text-sm mt-1">{errors.fullName.message}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^[+]?[1-9][\d]{0,15}$/,
                  message: 'Invalid phone number'
                }
              })}
              className="input-field"
              placeholder="Enter your phone number"
            />
            {errors.phone && (
              <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              College/Institution *
            </label>
            <input
              type="text"
              {...register('college', { required: 'College/Institution is required' })}
              className="input-field"
              placeholder="Enter your college or institution name"
            />
            {errors.college && (
              <p className="text-red-400 text-sm mt-1">{errors.college.message}</p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={submitting || !registrationStatus.canRegister}
              className={`btn-primary flex-1 ${!registrationStatus.canRegister ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Registering...' : 
               !registrationStatus.canRegister ? 'Registration Closed' : 
               registrationType === 'on_spot' ? 'Register On-the-Spot' :
               'Register for Event'}
            </button>
            
            {event.isTeamEvent && (
              <div className="text-center text-gray-400 text-sm">
                Team registration coming soon
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Payment Modal */}
      {event && getEntryFee(event, registrationType) > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          eventTitle={event.title}
          amount={getEntryFee(event, registrationType)}
          upiId={event.upiId || 'genesis@upi'}
          participantId={participantId}
        />
      )}

    </div>
  );
};

export default EventRegistration;
