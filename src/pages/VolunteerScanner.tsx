import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { Participant } from '../types';
import { dataService } from '../services/dataService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import RoleLogin from '../components/RoleLogin';
import { Html5QrcodeScanner } from 'html5-qrcode';

const VolunteerScanner: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = roleAuthService.getCurrentUser();
    if (currentUser && currentUser.role === 'volunteer') {
      setUser(currentUser);
    }

    return () => {
      // Cleanup scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      if (scannerElementRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          false
        );

        scannerRef.current.render(
          async (decodedText) => {
            // QR code scanned successfully
            await handleQRCodeScanned(decodedText);
          },
          (error) => {
            // QR code scan error (usually just no QR code in view)
            // Don't show error for normal scanning
          }
        );

        setIsScanning(true);
        setShowResult(false);
      }
    } catch (error) {
      console.error('Error starting scanner:', error);
      toast.error('Failed to start camera. Please allow camera access.');
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setShowResult(false);
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    try {
      // Extract participant ID from QR code
      const participantId = decodedText.split('/').pop();
      if (!participantId) {
        toast.error('Invalid QR code format');
        return;
      }

      // Find participant by ID
      const participants = await dataService.getParticipants();
      const foundParticipant = participants.find((p: Participant) => p.id === participantId);
      
      if (!foundParticipant) {
        toast.error('Participant not found');
        return;
      }

      setParticipant(foundParticipant);
      setShowResult(true);
      stopScanning();
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Failed to process QR code');
    }
  };


  const handleVerify = async () => {
    if (!participant) return;

    setVerifying(true);
    try {
      const success = await dataService.verifyParticipant(participant.id, 'volunteer-1'); // In real app, use actual volunteer ID
      
      if (success) {
        toast.success('Participant verified successfully!');
        setParticipant({ ...participant, isVerified: true });
      } else {
        toast.error('Failed to verify participant');
      }
    } catch (error) {
      console.error('Error verifying participant:', error);
      toast.error('Failed to verify participant');
    } finally {
      setVerifying(false);
    }
  };

  const resetScanner = () => {
    setParticipant(null);
    setShowResult(false);
  };

  const handleLogin = (loggedInUser: RoleUser) => {
    setUser(loggedInUser);
  };

  if (!user) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <RoleLogin onLogin={handleLogin} role="volunteer" />
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/volunteer')}
          className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white neon-text">QR Code Scanner</h1>
      </div>

      {!isScanning && !showResult && (
        <div className="card-glow text-center">
          <QrCode className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
          <h2 className="text-xl font-semibold text-white mb-2">Volunteer Scanner</h2>
          <p className="text-gray-300 mb-6">
            Scan participant QR codes to verify their attendance at the event.
          </p>
          
          <button
            onClick={startScanning}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Camera className="h-4 w-4 mr-2" />
            Start Scanning
          </button>
        </div>
      )}

      {isScanning && (
        <div className="card-glow">
          <div className="relative">
            <div id="qr-reader" ref={scannerElementRef} className="w-full"></div>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={stopScanning}
              className="btn-secondary"
            >
              Stop Scanning
            </button>
          </div>
        </div>
      )}

      {showResult && participant && (
        <div className="card-glow">
          <div className="text-center mb-6">
            {participant.isVerified ? (
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
            ) : (
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
            )}
            
            <h2 className="text-xl font-semibold text-white mb-2">
              {participant.isVerified ? 'Already Verified' : 'Participant Found'}
            </h2>
            
            <p className="text-gray-300">
              {participant.isVerified 
                ? 'This participant has already been verified.' 
                : 'Review participant details and verify attendance.'
              }
            </p>
          </div>

          {/* Participant Details */}
          <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-white mb-3">Participant Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="font-medium text-white">{participant.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="font-medium text-white">{participant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="font-medium text-white">{participant.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Registration Date:</span>
                <span className="font-medium text-white">
                  {new Date(participant.registrationDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  participant.paymentStatus === 'paid' 
                    ? 'bg-green-500/20 text-green-400' 
                    : participant.paymentStatus === 'offline_paid'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {participant.paymentStatus === 'paid' ? 'Paid' :
                   participant.paymentStatus === 'offline_paid' ? 'Offline Paid' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Verification Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  participant.isVerified 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {participant.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!participant.isVerified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="btn-primary w-full flex items-center justify-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {verifying ? 'Verifying...' : 'Verify Participant'}
              </button>
            )}
            
            <button
              onClick={resetScanner}
              className="btn-secondary w-full"
            >
              Scan Another QR Code
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
        <h4 className="font-semibold text-cyan-400 mb-2">Scanner Instructions:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Allow camera access when prompted</li>
          <li>• Position the QR code within the scanning area</li>
          <li>• Ensure good lighting for better scanning</li>
          <li>• Verify participant details before confirming</li>
        </ul>
      </div>
    </div>
  );
};

export default VolunteerScanner;
