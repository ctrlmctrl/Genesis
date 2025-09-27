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

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [participantId, setParticipantId] = useState<string>('');

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
      } catch (error) {
        console.error('Error loading event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!event || !isAuthenticated) return;
    
    setSubmitting(true);
    try {
      const participant = await dataService.registerParticipant({
        eventId: event.id,
        ...data,
      });

      setParticipantId(participant.id);
      
      // If event has entry fee, show payment modal
      if (event.entryFee > 0) {
        setShowPaymentModal(true);
      } else {
        toast.success('Registration successful!');
        navigate(`/participant-info/${participant.id}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentComplete = async (paymentId: string, method: 'online' | 'offline') => {
    try {
      await dataService.updatePaymentStatus(
        participantId,
        method === 'online' ? 'paid' : 'offline_paid',
        method,
        paymentId
      );
      
      toast.success('Payment completed! Registration successful!');
      navigate(`/participant-info/${participantId}`);
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
            onClick={() => navigate('/')}
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
          <GoogleLogin />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/')}
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
          <div className="flex items-center text-sm text-gray-400">
            <Users className="h-4 w-4 mr-3 text-cyan-400" />
            {event.currentParticipants} participants registered
          </div>
          {event.entryFee > 0 && (
            <div className="flex items-center text-sm text-cyan-400">
              <DollarSign className="h-4 w-4 mr-3" />
              Entry Fee: ₹{event.entryFee}
            </div>
          )}
        </div>
      </div>

      {/* Registration Form */}
      <div className="card-glow">
        <h3 className="text-lg font-semibold text-white mb-4">Registration Form</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              First Name *
            </label>
            <input
              type="text"
              {...register('firstName', { required: 'First name is required' })}
              className="input-field"
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className="input-field"
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="input-field"
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
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

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Registering...' : 'Register for Event'}
          </button>
        </form>
      </div>

      {/* Payment Modal */}
      {event && event.entryFee > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          eventTitle={event.title}
          amount={event.entryFee}
          upiId={event.upiId || 'genesis@upi'}
        />
      )}
    </div>
  );
};

export default EventRegistration;
