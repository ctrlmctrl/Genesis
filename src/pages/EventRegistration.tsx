import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Calendar, MapPin, Clock, Users, Shield, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from '../components/GoogleLogin';
// Team registration inlined below (TeamRegistrationForm removed)
import PaymentModal from '../components/PaymentModal';
import { canUserRegister, getRegistrationCountdown, isRegistrationOpen, isOnSpotRegistrationAvailable, getEntryFee, getPaymentMethod, getRegistrationType } from '../services/registrationService';
import { paymentService } from '../services/paymentService';
import type { Participant } from '../types';
import { is } from 'date-fns/locale';

interface RegistrationForm {
  fullName: string;
  phone: string;
  college: string;
  standard: 'FY' | 'SY' | 'TY' | '11' | '12';
  stream: string;
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
  const isWithinOnSpotWindow = (event: Event): boolean => {
    if (!event.allowOnSpotRegistration) return false;
    if (!event.date || !event.onSpotStartTime || !event.onSpotEndTime) return false;

    const now = new Date();

    // Combine event date with time fields
    const start = new Date(`${event.date}T${event.onSpotStartTime}`);
    const end = new Date(`${event.date}T${event.onSpotEndTime}`);
    return now >= start && now <= end;
  };
  const [showTeamForm, setShowTeamForm] = useState(false);
  // Team registration state (inlined)
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([
    {
      fullName: '',
      email: user?.email || '',
      phone: '',
      college: '',
      standard: '',
      stream: '',
    },
  ]);
  const [teamLoading, setTeamLoading] = useState(false);

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

        // If this is a team event, show team registration form by default
        if (eventData.isTeamEvent) {
          setShowTeamForm(true);
        }

        // 🧩 Automatically set team members when event loads
        if (eventData.isTeamEvent) {
          const max = eventData.membersPerTeam || 1;

          setTeamMembers(prev => {
            const baseMember = { fullName: '', email: '', phone: '', college: '', standard: '', stream: '' };

            // ensure at least 1 (team lead)
            let members = prev.length ? [...prev] : [{ ...baseMember }];

            // expand or shrink based on membersPerTeam
            if (members.length < max) {
              const toAdd = max - members.length;
              members = [
                ...members,
                ...Array(toAdd).fill(null).map(() => ({ ...baseMember })),
              ];
            } else if (members.length > max) {
              members = members.slice(0, max);
            }

            // set logged-in user as team lead email
            members[0].email = user?.email || '';

            return members;
          });
        }

      } catch (error) {
        console.error('Error loading event:', error);
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate, user?.email]);

  useEffect(() => {
    setTeamMembers(prev => {
      const copy = [...prev];
      if (copy[0]) copy[0].email = user?.email || '';
      return copy;
    });
  }, [user?.email]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!event || !isAuthenticated) return;

    // If somehow user submits individual form for a team event, block and show team form
    if (event.isTeamEvent) {
      setShowTeamForm(true);
      toast.error('This is a team event. Please use team registration.');
      return;
    }

    // Check registration status before proceeding
    const status = canUserRegister(event, user?.email);
    if (!status.canRegister) {
      toast.error(status.reason || 'Registration is not available');
      return;
    }

    setSubmitting(true);
    try {
      // Get entry fee (based on type)
      const entryFee = price;

      // 🧩 Check if user already registered for this event
      const existingParticipant = await dataService.getParticipantByEventAndEmail(event.id, user?.email || '');

      if (existingParticipant) {
        // Case 1: Payment pending, failed, or under verification
        if (['pending', 'failed'].includes(existingParticipant.paymentStatus)) {
          toast('You already registered. Please complete your payment.', { icon: '⚠️' });
          setParticipantId(existingParticipant.id);
          setShowPaymentModal(true);
          setSubmitting(false);
          return;
        }

        // Case 2: Already paid
        toast('You already registered and paid for this event.', { icon: '⚠️' });
        setSubmitting(false);
        return;
      }

      // 🧾 Fresh registration
      const participant = await dataService.registerParticipant({
        eventId: event.id,
        ...data,
        email: user?.email || '', // logged in user email
        registrationType,
        entryFeePaid: entryFee,
      });

      setParticipantId(participant.id);

      if (event.entryFee > 0) {
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

  // Team registration handlers (inlined)
  const handleTeamMemberChange = (index: number, field: string, value: string) => {
    const copy = [...teamMembers];
    copy[index] = { ...copy[index], [field]: value };
    setTeamMembers(copy);
  };

  // const addTeamMember = () => {
  //   const max = event?.membersPerTeam || 1;
  //   if (teamMembers.length < max) {
  //     setTeamMembers([...teamMembers, { fullName: '', email: '', phone: '', college: '', standard: 'FY', stream: '' }]);
  //   }
  // };

  // const removeTeamMember = (index: number) => {
  //   if (index === 0) return;
  //   setTeamMembers(teamMembers.filter((_, i) => i !== index));
  // };

  type TeamMemberInput = Omit<
    Participant,
    'id' | 'eventId' | 'qrCode' | 'registrationDate' | 'isVerified' | 'paymentStatus'
  >;

  const submitTeam = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!event) return;
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    // 🔹 Basic validations (same as you had)
    const namePattern = /^[A-Z][a-zA-Z\s]*$/;
    const phonePattern = /^[6-9]\d{9}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 0; i < teamMembers.length; i++) {
      const m = teamMembers[i];

      const cleaned = Object.fromEntries(
        Object.entries(m).map(([k, v]) => [
          k,
          typeof v === 'string' ? v.trim() : (v ?? '')
        ])
      ) as Record<string, string>;

      const hasAnyField = Object.values(cleaned).some(v => v !== '');
      const allFieldsFilled =
        cleaned.fullName &&
        cleaned.phone &&
        cleaned.college &&
        cleaned.standard &&
        cleaned.stream;

      if (i === 0) {
        if (!allFieldsFilled) {
          toast.error('Please fill all details for the Team Lead');
          return;
        }
        if (!namePattern.test(cleaned.fullName)) {
          toast.error(`Team Lead: Name must start with a capital letter`);
          return;
        }
        if (!phonePattern.test(cleaned.phone)) {
          toast.error(`Team Lead: Phone number must be 10 digits starting with 6-9`);
          return;
        }
        if (!emailPattern.test(user?.email || '')) {
          toast.error(`Team Lead: Invalid email`);
          return;
        }
      } else if (hasAnyField && !allFieldsFilled) {
        toast.error(`Member ${i + 1}: Please complete all fields or leave blank`);
        return;
      } else if (hasAnyField) {
        if (!namePattern.test(cleaned.fullName)) {
          toast.error(`Member ${i + 1}: Name must start with a capital letter`);
          return;
        }
        if (!phonePattern.test(cleaned.phone)) {
          toast.error(`Member ${i + 1}: Phone number must be 10 digits starting with 6-9`);
          return;
        }
        if (!emailPattern.test(cleaned.email)) {
          toast.error(`Member ${i + 1}: Invalid email format`);
          return;
        }
      }
    }

    setTeamLoading(true);
    try {
      const filledMembers = teamMembers.filter((m, idx) => {
        const hasAnyField = Object.values(m).some(v => typeof v === 'string' && v.trim() !== '');
        return idx === 0 || hasAnyField; // always include lead
      });

      const payload: TeamMemberInput[] = filledMembers.map((m, idx) => ({
        ...m,
        email: idx === 0 ? (user?.email || '') : m.email,
        entryFeePaid: idx === 0 ? event.entryFee : 0,
        isTeamLead: idx === 0
      }));

      // 🔹 Check if team lead already registered
      const existingParticipant = await dataService.getParticipantByEventAndEmail(event.id, user?.email || '');
      if (existingParticipant) {
        if (['pending', 'failed'].includes(existingParticipant.paymentStatus)) {
          if (existingParticipant.teamId) {
            await dataService.updateTeamMembers(existingParticipant.teamId, payload as Participant[]);
            toast.success('Team details updated! Please complete your payment.');
          }
          setParticipantId(existingParticipant.id);
          setShowPaymentModal(true);
          setTeamLoading(false);
          return;
        }
        toast('You already registered and paid for this event.', { icon: '⚠️' });
        setTeamLoading(false);
        return;
      }

      // 🧾 Fresh team registration
      const participants = await dataService.registerTeam(event.id, teamName, payload as Participant[]);
      setParticipantId(participants[0]?.id || '');
      setShowPaymentModal(event.entryFee > 0);
      toast.success('Team registered — complete payment to finish registration');
    } catch (err) {
      console.error(err);
      toast.error('Team registration failed');
    } finally {
      setTeamLoading(false);
    }
  };

  const handlePaymentComplete = async (method: 'online' | 'offline', receiptUrl?: string) => {
    try {
      await dataService.updatePaymentStatus(
        participantId,
        method === 'online' ? 'under_verification' : 'offline_paid',
        method,
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

  const price = isWithinOnSpotWindow(event)
    ? event.onSpotEntryFee
    : event.entryFee;

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
        <p className="text-gray-300 mb-4 whitespace-pre-line">{event.description}</p>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="h-4 w-4 mr-3 text-cyan-400" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-3 text-cyan-400" />
            {event.time}
          </div>
          {event.entryFee > 0 && (
            <div className="flex items-center text-sm text-cyan-400">
              <DollarSign className="h-4 w-4 mr-3" />
              Entry Fee: ₹{price}
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
                    <span>Entry fee: ₹{price}</span>
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

      {/* Registration Form: show team form inline for team events, else individual form */}
      {event.isTeamEvent ? (
        <div className="card-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Team Registration</h3>
          <form onSubmit={(e) => { submitTeam(e); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Team Name *</label>
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input-field" placeholder="Enter your team name" />
            </div>

            <div className="mb-4 bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white">Team Registration Fee</h4>
                  <p className="text-gray-300">One-time team payment</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-white">₹{price}</div>
                  <div className="text-sm text-gray-400">{event.paymentMethod === 'both' ? 'Online/Offline' : event.paymentMethod}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Team Members</h4>
                {/* {(teamMembers.length < (event.membersPerTeam || 1)) && (
                  <button type="button" onClick={addTeamMember} className="btn-secondary">Add Member</button>
                )} */}
              </div>

              <div className="space-y-4">
                {teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className={`bg-gray-800 p-4 rounded-lg transition ${!member.fullName && idx !== 0 ? 'opacity-60' : 'opacity-100'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-cyan-400 mr-2" />
                        <div className="text-white font-medium">
                          Member {idx + 1}{idx === 0 ? ' (Team Lead)' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        className="input-field"
                        placeholder="Full name"
                        value={member.fullName}
                        onChange={(e) => handleTeamMemberChange(idx, 'fullName', e.target.value)}
                        required={idx === 0}
                      />
                      <input
                        className="input-field"
                        placeholder="Email"
                        value={member.email}
                        onChange={(e) => handleTeamMemberChange(idx, 'email', e.target.value)}
                        disabled={idx === 0}
                      />
                      <input
                        className="input-field"
                        placeholder="Phone"
                        value={member.phone}
                        onChange={(e) => handleTeamMemberChange(idx, 'phone', e.target.value)}
                        required={idx === 0}
                      />
                      <input
                        className="input-field"
                        placeholder="College"
                        value={member.college}
                        onChange={(e) => handleTeamMemberChange(idx, 'college', e.target.value)}
                        required={idx === 0}
                      />
                      <select
                        required={idx === 0}
                        className="input-field"
                        value={member.standard}
                        onChange={(e) => handleTeamMemberChange(idx, 'standard', e.target.value)}
                      >
                        <option value="">Select Year/Standard</option>
                        <option value="FY">FY</option>
                        <option value="SY">SY</option>
                        <option value="TY">TY</option>
                        <option value="Fourth Year">Fourth Year</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                      </select>

                      <input
                        className="input-field md:col-span-2"
                        placeholder="Degree/Stream"
                        value={member.stream}
                        onChange={(e) => handleTeamMemberChange(idx, 'stream', e.target.value)}
                        required={idx === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Back</button>
              <button type="submit" disabled={teamLoading} className="btn-primary flex-1">{teamLoading ? 'Registering...' : 'Register Team'}</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card-glow">
          <h3 className="text-lg font-semibold text-white mb-4">Registration Form</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                {...register('fullName', {
                  required: 'Full name is required',
                  pattern: {
                    value: /^[A-Z][a-zA-Z\s]*$/,
                    message: 'Name must start with a capital letter'
                  }
                })}
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
                    value: /^[6-9]\d{9}$/,
                    message: 'Phone number must be 10 digits starting with 6, 7, 8, or 9'
                  }
                })}
                className="input-field"
                placeholder="Enter your 10-digit phone number"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                College *
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Standard/Year *
              </label>
              <select
                {...register('standard', { required: 'Standard/Year is required' })}
                className="input-field"
              >
                <option value="">Select your standard/year</option>
                <option value="FY">FY</option>
                <option value="SY">SY</option>
                <option value="TY">TY</option>
                <option value="TY">Fourth Year</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
              {errors.standard && (
                <p className="text-red-400 text-sm mt-1">{errors.standard.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Degree/Stream *
              </label>
              <input
                type="text"
                {...register('stream', { required: 'Stream/Branch is required' })}
                className="input-field"
                placeholder="e.g.,Commerce, BSCIT,BSCCS"
              />
              {errors.stream && (
                <p className="text-red-400 text-sm mt-1">{errors.stream.message}</p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitting || !registrationStatus.canRegister}
                className={`btn-primary flex-1 ${(!registrationStatus.canRegister) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Registering...' :
                  !registrationStatus.canRegister ? 'Registration Closed' :
                    registrationType === 'on_spot' ? 'Register On-the-Spot' :
                      'Register for Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {event && getEntryFee(event, registrationType) > 0 && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          eventId={event.id}
          eventTitle={event.title}
          amount={price ?? 0}
          upiId={event.upiId || 'genesis@upi'}
          participantId={participantId}
          event={event}
        />
      )}

    </div>
  );
};

export default EventRegistration;
