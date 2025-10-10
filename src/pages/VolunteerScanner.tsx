import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, QrCode, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import QrScanner from 'qr-scanner';
import { Participant } from '../types';
import { dataService } from '../services/dataService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import RoleLogin from '../components/RoleLogin';

const VolunteerScanner: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    const currentUser = roleAuthService.getCurrentUser();
    if (currentUser && currentUser.role === 'volunteer') {
      setUser(currentUser);
    }

    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
    };
  }, []);

  const handleLogin = (loggedInUser: RoleUser) => {
    setUser(loggedInUser);
  };

  // const handleVideoReady = () => {
  //   setVideoReady(true);
  // };

  const startScanning = async () => {
    try {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Check camera availability first
      const hasCamera = await QrScanner.hasCamera();
      
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }
      
      // Stop any existing scanner
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      // Set scanning state first so video element gets rendered
      setIsScanning(true);
      setShowResult(false);
      
      // Wait longer for mobile devices to ensure video element is ready
      const waitTime = isMobile ? 500 : 200;
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Get video element
      const videoElement = document.getElementById('qr-reader') as HTMLVideoElement;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Mobile-specific video element setup
      if (isMobile) {
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoElement.setAttribute('x5-playsinline', 'true');
        videoElement.setAttribute('x5-video-player-type', 'h5');
        videoElement.setAttribute('x5-video-player-fullscreen', 'false');
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.controls = false;
        videoElement.autoplay = true;
      }

      // Create new QR scanner with mobile-optimized settings
      const scanner = new QrScanner(
        videoElement,
        (result) => {
          handleQRCodeScanned(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: isMobile ? 2 : 5, // Even lower for mobile
          preferredCamera: 'environment', // Use back camera on mobile
          onDecodeError: (error: Error) => {
            // Silently handle decode errors to avoid spam
            console.debug('QR decode error:', error);
          }
        }
      );

      scannerRef.current = scanner;

      // Start scanning with retry logic for mobile
      let retryCount = 0;
      const maxRetries = isMobile ? 5 : 2;
      
      while (retryCount < maxRetries) {
        try {
          await scanner.start();
          break; // Success, exit retry loop
        } catch (startError: any) {
          retryCount++;
          console.log(`Scanner start attempt ${retryCount} failed:`, startError);
          
          if (retryCount >= maxRetries) {
            throw startError; // Re-throw if all retries failed
          }
          
          // Wait before retry with increasing delay
          const retryDelay = isMobile ? 1000 * retryCount : 500;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
      
      // Show mobile-specific success message
      if (isMobile) {
        toast.success('Scanner started! Point your camera at a QR code.', { duration: 5000 });
      } else {
        toast.success('Scanner started successfully!');
      }
      
    } catch (error: any) {
      // Reset scanning state on error
      setIsScanning(false);
      
      let message = 'Scanner failed to start. ';
      if (error.name === 'NotAllowedError') {
        message += 'Camera permission denied. Please allow camera access and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        message += 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        message += 'Camera is being used by another application. Please close other camera apps.';
      } else if (error.name === 'OverconstrainedError') {
        message += 'Camera constraints not supported. Try refreshing the page.';
      } else if (error.name === 'SecurityError') {
        message += 'Camera access blocked. Please check your browser settings.';
      } else if (error.message?.includes('Video element not found')) {
        message += 'Please try refreshing the page and try again.';
      } else {
        message += `Error: ${error.message}`;
      }
      
      toast.error(message, { duration: 10000 });
    }
  };

  const stopScanning = async () => {
    try {
      // Stop QR scanner
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      
      setIsScanning(false);
      setParticipant(null);
      setShowResult(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setIsScanning(false);
      setParticipant(null);
      setShowResult(false);
    }
  };

  // const handleScan = async (data: string | null) => {
  //   if (data) {
  //     console.log('QR Code scanned:', data);
  //     await handleQRCodeScanned(data);
  //   }
  // };

  // const handleError = (err: any) => {
  //   console.error('QR Scanner error:', err);
  //   if (!err.message?.includes('No QR code found')) {
  //     toast.error('Scanner error: ' + err.message);
  //   }
  // };

  const handleQRCodeScanned = async (decodedText: string) => {
    try {
      console.log('QR Code scanned:', decodedText);
      console.log('QR Code length:', decodedText.length);
      console.log('QR Code type:', typeof decodedText);
      
      // Use the new QR code service to parse the unique code
      const foundParticipant = await dataService.getParticipantByQRCode(decodedText);
      console.log('Found participant by QR code:', foundParticipant);
      
      if (!foundParticipant) {
        console.log('No participant found for QR code:', decodedText);
        toast.error('Participant not found. Please register first.');
        return;
      }

      setParticipant(foundParticipant);
      setShowResult(true);
      setIsScanning(false);
    } catch (error) {
      console.error('Error processing QR code:', error);
      toast.error('Failed to process QR code');
    }
  };


  const handleVerify = async () => {
    if (!participant) return;

    setVerifying(true);
    try {
      const success = await dataService.verifyParticipant(participant.id, user?.id || 'volunteer');
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
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white neon-text">QR Scanner</h1>
      </div>

      {/* Mobile-specific instructions */}
      {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
        <div className="card-glow mb-6 p-4 bg-blue-900/20 border border-blue-500/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-2 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Mobile Scanning Tips
          </h3>
          <ul className="text-sm text-blue-200 space-y-1">
            <li>• Hold your device steady and point at the QR code</li>
            <li>• Ensure good lighting for better scanning</li>
            <li>• Keep the QR code centered in the camera view</li>
            <li>• Allow camera permissions when prompted</li>
            <li>• If scanning fails, try refreshing the page</li>
            <li>• Make sure no other apps are using the camera</li>
          </ul>
        </div>
      )}



      {!isScanning && !showResult && (
        <div className="space-y-6">
          <div className="card-glow text-center">
            <QrCode className="h-16 w-16 mx-auto mb-4 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white mb-2">Volunteer Scanner</h2>
            <p className="text-gray-300 mb-6">
              Scan participant QR codes to verify their attendance at the event.
            </p>
            
            <div className="space-y-3">
            <button
              onClick={startScanning}
                className="btn-primary w-full flex items-center justify-center text-lg py-4"
            >
                <Camera className="h-5 w-5 mr-2" />
                Start Camera Scanning
            </button>
            
            {/* Mobile-specific retry button */}
            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary w-full flex items-center justify-center text-sm py-2"
                >
                  Refresh Page (if scanning fails)
                </button>
                <button
                  onClick={() => {
                    // Try to request camera permission explicitly
                    navigator.mediaDevices.getUserMedia({ video: true })
                      .then(() => {
                        toast.success('Camera permission granted! Try scanning again.');
                      })
                      .catch((error) => {
                        toast.error('Camera permission denied. Please allow camera access in your browser settings.');
                      });
                  }}
                  className="btn-secondary w-full flex items-center justify-center text-sm py-2"
                >
                  Request Camera Permission
                </button>
              </div>
            )}
              
                </div>
            
          </div>

        </div>
      )}

      {isScanning && (
        <div className="card-glow">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">QR Code Scanner</h3>
              <button
                onClick={stopScanning}
                className="btn-secondary flex items-center"
              >
                <Camera className="h-4 w-4 mr-2" />
                Stop
              </button>
            </div>
            
            <div className="relative">
              <video 
                id="qr-reader" 
                className="w-full max-w-md mx-auto rounded-lg"
                style={{ 
                  maxHeight: '400px',
                  objectFit: 'cover',
                  backgroundColor: '#000',
                  transform: 'scaleX(-1)' // Mirror the video for better UX
                }}
                playsInline
                webkit-playsinline="true"
                x5-playsinline="true"
                x5-video-player-type="h5"
                x5-video-player-fullscreen="false"
                muted
                autoPlay
                controls={false}
              />
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-400 text-sm">
                Point your camera at a QR code to scan it
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Make sure the QR code is well-lit and clearly visible
              </p>
            </div>
          </div>
        </div>
      )}

      {showResult && participant && (
        <div className="card-glow">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              participant.isVerified 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {participant.isVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verified
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Pending Verification
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Participant Name</label>
              <p className="text-lg font-semibold text-white">{participant.fullName}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p className="text-white">{participant.email}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Phone</label>
              <p className="text-white">{participant.phone}</p>
            </div>

            <div>
              <label className="text-sm text-gray-400">College</label>
              <p className="text-white">{participant.college}</p>
            </div>

            {participant.teamName && (
              <div>
                <label className="text-sm text-gray-400">Team</label>
                <p className="text-white">
                  {participant.teamName} 
                  {participant.isTeamLead && <span className="text-cyan-400 ml-2">(Team Lead)</span>}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm text-gray-400">Registration Date</label>
              <p className="text-white">{new Date(participant.registrationDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={resetScanner}
              className="flex-1 btn-secondary"
            >
              Scan Another
            </button>
            
            {!participant.isVerified && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Verify Participant'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerScanner;
