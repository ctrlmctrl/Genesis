import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { fileUploadService } from '../services/fileUploadService';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';

interface ReceiptReuploadProps {
  participantId: string;
  eventTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

const ReceiptReupload: React.FC<ReceiptReuploadProps> = ({
  participantId,
  eventTitle,
  onSuccess,
  onClose,
}) => {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setReceiptFile(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!receiptFile) {
      toast.error('Please select a receipt file');
      return;
    }

    setIsUploading(true);
    try {
      // Upload the new receipt
      const receiptUrl = await fileUploadService.uploadReceipt(receiptFile, participantId);
      
      // Update participant's payment status back to pending
      await dataService.updatePaymentStatus(participantId, 'pending', undefined, receiptUrl);
      
      toast.success('Receipt uploaded successfully! Your payment will be reviewed again.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast.error('Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Re-upload Payment Receipt</h2>
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
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <h3 className="font-semibold text-red-400">Payment Verification Failed</h3>
            </div>
            <p className="text-sm text-red-300">
              Your payment receipt for <strong>{eventTitle}</strong> could not be verified. 
              Please upload a clear, high-quality image of your payment receipt.
            </p>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : receiptFile
                ? 'border-green-400 bg-green-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {receiptFile ? (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                <div>
                  <p className="text-green-400 font-medium">{receiptFile.name}</p>
                  <p className="text-sm text-gray-400">
                    {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setReceiptFile(null)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-white font-medium">Drop your receipt here</p>
                  <p className="text-sm text-gray-400">or click to browse</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="receipt-upload"
                />
                <label
                  htmlFor="receipt-upload"
                  className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">Receipt Requirements</h4>
            <ul className="text-sm text-blue-300 space-y-1">
              <li>• Clear, high-quality image (JPG, PNG, or GIF)</li>
              <li>• Shows payment amount clearly</li>
              <li>• Shows transaction date and time</li>
              <li>• Shows UPI ID or payment reference</li>
              <li>• File size under 5MB</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleUpload}
              disabled={!receiptFile || isUploading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </div>
              ) : (
                'Upload Receipt'
              )}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ReceiptReupload;
