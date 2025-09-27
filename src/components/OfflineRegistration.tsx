import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { X, CheckCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { Event } from '../types';
import { dataService } from '../services/dataService';

interface OfflineRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (participantId: string) => void;
  event: Event;
}

interface OfflineRegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  amountPaid: number;
  receiptNumber: string;
  notes?: string;
}

const OfflineRegistration: React.FC<OfflineRegistrationProps> = ({
  isOpen,
  onClose,
  onSuccess,
  event,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OfflineRegistrationForm>();

  const onSubmit = async (data: OfflineRegistrationForm) => {
    setSubmitting(true);
    
    try {
      // Register participant
      const participant = await dataService.registerParticipant({
        eventId: event.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      });

      // Update payment status for offline payment
      await dataService.updatePaymentStatus(
        participant.id,
        'offline_paid',
        'offline',
        data.receiptNumber,
        receiptFile ? URL.createObjectURL(receiptFile) : undefined
      );

      toast.success('Offline registration completed successfully!');
      onSuccess(participant.id);
      reset();
      setReceiptFile(null);
      onClose();
    } catch (error) {
      console.error('Offline registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
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
        className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Offline Registration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Info */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-2">{event.title}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Entry Fee</span>
              <span className="text-2xl font-bold text-green-400">
                ₹{event.entryFee}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-400 mb-2">Cash Payment Instructions</h4>
            <ul className="text-sm text-yellow-300 space-y-1">
              <li>• Collect cash payment from the participant</li>
              <li>• Issue a receipt with a unique receipt number</li>
              <li>• Fill in the participant details below</li>
              <li>• Upload a photo of the receipt (optional)</li>
            </ul>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="input-field"
                  placeholder="Enter first name"
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
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Enter email address"
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
                  placeholder="Enter phone number"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount Paid (₹) *
                </label>
                <input
                  type="number"
                  {...register('amountPaid', { 
                    required: 'Amount paid is required',
                    min: { value: 0, message: 'Amount must be positive' }
                  })}
                  className="input-field"
                  placeholder="Enter amount paid"
                  step="0.01"
                />
                {errors.amountPaid && (
                  <p className="text-red-400 text-sm mt-1">{errors.amountPaid.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Receipt Number *
                </label>
                <input
                  type="text"
                  {...register('receiptNumber', { required: 'Receipt number is required' })}
                  className="input-field"
                  placeholder="Enter receipt number"
                />
                {errors.receiptNumber && (
                  <p className="text-red-400 text-sm mt-1">{errors.receiptNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Upload Receipt (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-400"
              />
              {receiptFile && (
                <p className="text-sm text-green-400 mt-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {receiptFile.name} uploaded
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Additional Notes
              </label>
              <textarea
                {...register('notes')}
                className="input-field"
                rows={3}
                placeholder="Any additional notes about the registration"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Complete Registration'
                )}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OfflineRegistration;
