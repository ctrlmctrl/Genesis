import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Participant } from '../types';
import { dataService } from '../services/dataService';

const VolunteerScanner: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setShowResult(false);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Camera access denied. Please allow camera access to scan QR codes.');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setShowResult(false);
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
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
      </div>

      {!isScanning && !showResult && (
        <div className="card text-center">
          <Camera className="h-16 w-16 mx-auto mb-4 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Volunteer Scanner</h2>
          <p className="text-gray-600 mb-6">
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
        <div className="card">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-900 rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white rounded-lg w-48 h-48 flex items-center justify-center">
                <div className="text-white text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Position QR code here</p>
                </div>
              </div>
            </div>
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
        <div className="card">
          <div className="text-center mb-6">
            {participant.isVerified ? (
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            )}
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {participant.isVerified ? 'Already Verified' : 'Participant Found'}
            </h2>
            
            <p className="text-gray-600">
              {participant.isVerified 
                ? 'This participant has already been verified.' 
                : 'Review participant details and verify attendance.'
              }
            </p>
          </div>

          {/* Participant Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Participant Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{participant.firstName} {participant.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{participant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{participant.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registration Date:</span>
                <span className="font-medium">
                  {new Date(participant.registrationDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  participant.isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
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
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Scanner Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
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
