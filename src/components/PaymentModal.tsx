import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, ExternalLink, Upload, CheckCircle } from 'lucide-react';
import { PaymentDetails } from '../services/paymentService';
import { paymentService } from '../services/paymentService';
import { fileUploadService } from '../services/fileUploadService';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentId: string, method: 'online' | 'offline', receiptUrl?: string) => void;
  eventTitle: string;
  amount: number;
  upiId: string;
  participantId?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentComplete,
  eventTitle,
  amount,
  upiId,
  participantId,
}) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'offline'>('online');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePaymentQR = useCallback(async () => {
    const paymentDetails: PaymentDetails = {
      amount,
      upiId,
      merchantName: 'Genesis Events',
      transactionId: paymentService.generatePaymentId(),
      description: `Payment for ${eventTitle}`,
    };

    setPaymentId(paymentDetails.transactionId);
    
    try {
      const qrCode = await paymentService.generateUPIQRCode(paymentDetails);
      setQrCodeDataURL(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate payment QR code');
    }
  }, [amount, upiId, eventTitle]);

  useEffect(() => {
    if (isOpen && upiId) {
      generatePaymentQR();
    }
  }, [isOpen, upiId, generatePaymentQR]);

  const handleUPIClick = () => {
    const upiLink = paymentService.generateUPILink({
      amount,
      upiId,
      merchantName: 'Genesis Events',
      transactionId: paymentId,
      description: `Payment for ${eventTitle}`,
    });

    window.open(upiLink, '_blank');
  };

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const handlePaymentComplete = async () => {
    setIsProcessing(true);
    
    try {
      let receiptUrl: string | undefined;
      
      // If offline payment and receipt is uploaded, upload the receipt
      if (selectedMethod === 'offline' && receiptFile && participantId) {
        receiptUrl = await fileUploadService.uploadReceipt(receiptFile, participantId);
        toast.success('Receipt uploaded successfully!');
      }
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onPaymentComplete(paymentId, selectedMethod, receiptUrl);
      toast.success('Payment completed successfully!');
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Payment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Event Info */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">{eventTitle}</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Entry Fee</span>
                <span className="text-2xl font-bold text-cyan-400">
                  {paymentService.formatAmount(amount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white">Payment Method</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedMethod('online')}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMethod === 'online'
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <QrCode className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Online UPI</span>
                </button>
                <button
                  onClick={() => setSelectedMethod('offline')}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedMethod === 'offline'
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Offline</span>
                </button>
              </div>
            </div>

            {/* Online Payment */}
            {selectedMethod === 'online' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h4 className="font-semibold text-white mb-2">Scan QR Code or Click to Pay</h4>
                  {qrCodeDataURL ? (
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <img
                        src={qrCodeDataURL}
                        alt="UPI QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  ) : (
                    <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleUPIClick}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open UPI App
                </button>

                <div className="text-center text-sm text-gray-400">
                  <p>UPI ID: {upiId}</p>
                  <p>Transaction ID: {paymentId}</p>
                </div>
              </div>
            )}

            {/* Offline Payment */}
            {selectedMethod === 'offline' && (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-400 mb-2">Offline Payment Instructions</h4>
                  <ul className="text-sm text-yellow-300 space-y-1">
                    <li>• Pay the entry fee in cash at the event venue</li>
                    <li>• Upload a photo of your payment receipt</li>
                    <li>• Your registration will be confirmed after verification</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Payment Receipt
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500 file:text-white hover:file:bg-cyan-400"
                  />
                  {receiptFile && (
                    <p className="text-sm text-green-400 mt-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {receiptFile.name} uploaded
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePaymentComplete}
                disabled={isProcessing || (selectedMethod === 'offline' && !receiptFile)}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Complete Payment'
                )}
              </button>
              
              <button
                onClick={onClose}
                className="w-full btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentModal;
