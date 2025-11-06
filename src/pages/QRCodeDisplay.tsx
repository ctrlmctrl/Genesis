import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Participant } from '../types';
import { dataService } from '../services/dataService';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeDisplay: React.FC = () => {
  const { participantId } = useParams<{ participantId: string }>();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = () => {
    if (!participant) return;
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-code-${participant.fullName?.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded!');
    }
  };

  const handleShare = async () => {
    if (!participant) return;

    const shareData = {
      title: 'Event QR Code',
      text: `QR Code for ${participant.fullName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share QR code');
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

  if (!participant) {
    return (
      <div className="mobile-container">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Participant Not Found</h2>
          <p className="text-gray-600 mb-6">The participant record doesn't exist.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ✅ Helper to check QR visibility
  const isPaymentVerified = participant.paymentStatus === 'paid' || participant.paymentStatus === 'offline_paid';
  const isPaymentPending = participant.paymentStatus === 'under_verification';

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Registration Details</h1>
      </div>

      <div className="card text-center">
        <div className="mb-6">
          {isPaymentVerified ? (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Verified!</h2>
              <p className="text-gray-600">
                Your QR code is ready. Show this to volunteers at the event for verification.
              </p>
            </>
          ) : isPaymentPending ? (
            <>
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Under Verification</h2>
              <p className="text-gray-600">
                Once verified, your QR code will appear here.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Awaiting Payment</h2>
              <p className="text-gray-600">Please complete your payment to get the QR code.</p>
            </>
          )}
        </div>

        {/* QR Code Display */}
        {isPaymentVerified ? (
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 mb-6">
            <QRCodeCanvas
              value={participant.qrCode}
              size={250}
              level="H"
              includeMargin={true}
            />
          </div>
        ) : (
          <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <p className="text-sm text-gray-500">QR Code will appear after payment verification</p>
          </div>
        )}

        {/* Participant Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Participant Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Name:</strong> {participant.fullName}</p>
            <p><strong>Email:</strong> {participant.email}</p>
            <p><strong>Phone:</strong> {participant.phone}</p>
            <p><strong>Registration Date:</strong> {new Date(participant.registrationDate).toLocaleDateString()}</p>

            {/* Payment Status */}
            <p>
              <strong>Payment Status:</strong>{' '}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${isPaymentVerified
                ? 'bg-green-100 text-green-800'
                : isPaymentPending
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
                }`}>
                {participant.paymentStatus || 'under_verification'}
              </span>
            </p>

            {/* Check-In Status */}
            <p>
              <strong>Check-In:</strong>{' '}
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${participant.isVerified === true
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {participant.isVerified === true ? 'Checked In' : 'Not Checked In'}
              </span>
            </p>

            {/* Room number (if verified and available) */}
            {isPaymentVerified && participant.assignedRoom && (
              <p>
                <strong>Assigned Room:</strong>{' '}
                <span className="text-green-600">{participant.assignedRoom}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isPaymentVerified && (
          <div className="space-y-3">
            <button onClick={handleDownload} className="btn-primary w-full flex items-center justify-center">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </button>

            <button onClick={handleShare} className="btn-secondary w-full flex items-center justify-center">
              <Share className="h-4 w-4 mr-2" />
              Share QR Code
            </button>
          </div>
        )}

        <button onClick={() => navigate('/')} className="btn-secondary w-full mt-4">
          Back to Events
        </button>

        {/* Instructions */}
        {isPaymentVerified && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How to use your QR Code:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              {/* <li>• Save this QR code to your phone or print it</li> */}
              <li>• Show it to volunteers at the event entrance</li>
              <li>• Volunteers will scan it to verify your attendance</li>
              <li>• Keep it handy throughout the event</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeDisplay;
