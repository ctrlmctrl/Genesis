import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CheckCircle, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Participant } from '../types';
import { dataService } from '../services/dataService';

interface ParticipantInfoForm {
  age: number;
  emergencyContact: string;
  emergencyPhone: string;
  dietaryRestrictions?: string;
  medicalConditions?: string;
  tshirtSize?: string;
  specialRequests?: string;
}

const ParticipantInfo: React.FC = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ParticipantInfoForm>();

  useEffect(() => {
    const loadParticipant = async () => {
      if (!participantId) return;
      
      try {
        const participantData = await dataService.getParticipant(participantId);
        if (!participantData) {
          toast.error('Participant not found');
          navigate('/');
          return;
        }
        setParticipant(participantData);
      } catch (error) {
        console.error('Error loading participant:', error);
        toast.error('Failed to load participant details');
      } finally {
        setLoading(false);
      }
    };

    loadParticipant();
  }, [participantId, navigate]);

  const onSubmit = async (data: ParticipantInfoForm) => {
    if (!participant) return;
    
    setSubmitting(true);
    try {
      await dataService.updateParticipantInfo(participant.id, data);
      toast.success('Information saved successfully!');
      setShowQR(true);
    } catch (error) {
      console.error('Error saving participant info:', error);
      toast.error('Failed to save information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const skipToQR = () => {
    setShowQR(true);
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

  if (!participant) {
    return (
      <div className="mobile-container">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Participant Not Found</h2>
          <p className="text-gray-600 mb-6">The participant record doesn't exist.</p>
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

  if (showQR) {
    return (
      <div className="mobile-container">
        <div className="flex items-center mb-6">
          <button
            onClick={() => setShowQR(false)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Your QR Code</h1>
        </div>

        <div className="card text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Complete!</h2>
          <p className="text-gray-600 mb-6">
            Your QR code is ready. Show this to volunteers at the event for verification.
          </p>

          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <QrCode className="h-32 w-32 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600 mt-2">QR Code will be generated here</p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Name:</strong> {participant.fullName}</p>
            <p><strong>Email:</strong> {participant.email}</p>
            <p><strong>Registration Date:</strong> {new Date(participant.registrationDate).toLocaleDateString()}</p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full"
            >
              Back to Events
            </button>
            <button
              onClick={() => window.print()}
              className="btn-secondary w-full"
            >
              Print QR Code
            </button>
          </div>
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
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Additional Information</h1>
      </div>

      <div className="card">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600">
            Please provide additional information to complete your registration. 
            This helps us better organize the event and ensure your safety.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age *
            </label>
            <input
              type="number"
              {...register('age', { 
                required: 'Age is required',
                min: { value: 1, message: 'Age must be at least 1' },
                max: { value: 120, message: 'Age must be less than 120' }
              })}
              className="input-field"
              placeholder="Enter your age"
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Name *
            </label>
            <input
              type="text"
              {...register('emergencyContact', { required: 'Emergency contact name is required' })}
              className="input-field"
              placeholder="Enter emergency contact name"
            />
            {errors.emergencyContact && (
              <p className="text-red-500 text-sm mt-1">{errors.emergencyContact.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emergency Contact Phone *
            </label>
            <input
              type="tel"
              {...register('emergencyPhone', { 
                required: 'Emergency contact phone is required',
                pattern: {
                  value: /^[+]?[1-9][\d]{0,15}$/,
                  message: 'Invalid phone number'
                }
              })}
              className="input-field"
              placeholder="Enter emergency contact phone"
            />
            {errors.emergencyPhone && (
              <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              T-Shirt Size
            </label>
            <select
              {...register('tshirtSize')}
              className="input-field"
            >
              <option value="">Select size (optional)</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dietary Restrictions
            </label>
            <textarea
              {...register('dietaryRestrictions')}
              className="input-field"
              rows={3}
              placeholder="Any dietary restrictions or allergies (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medical Conditions
            </label>
            <textarea
              {...register('medicalConditions')}
              className="input-field"
              rows={3}
              placeholder="Any medical conditions we should be aware of (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests
            </label>
            <textarea
              {...register('specialRequests')}
              className="input-field"
              rows={3}
              placeholder="Any special requests or accommodations (optional)"
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Saving...' : 'Save Information & Get QR Code'}
            </button>
            
            <button
              type="button"
              onClick={skipToQR}
              className="btn-secondary w-full"
            >
              Skip & Get QR Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParticipantInfo;
