import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Image } from 'lucide-react';
import { fileUploadService } from '../services/fileUploadService';
import { dataService } from '../services/dataService';
import toast from 'react-hot-toast';

interface ReceiptUploadProps {
  participantId: string;
  currentReceiptUrl?: string;
  onUploadSuccess: (receiptUrl: string) => void;
  onUploadError?: (error: string) => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  participantId,
  currentReceiptUrl,
  onUploadSuccess,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WebP) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const receiptUrl = await fileUploadService.uploadReceipt(selectedFile, participantId);
      
      // Update participant with receipt URL
      await dataService.updatePaymentStatus(
        participantId,
        'paid',
        'online',
        receiptUrl
      );

      toast.success('Receipt uploaded successfully!');
      onUploadSuccess(receiptUrl);
      
      // Reset state
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload receipt';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-400" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-400" />;
    }
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {currentReceiptUrl ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Receipt Already Uploaded</p>
              <p className="text-gray-400 text-sm">Your payment receipt has been submitted</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="receipt-upload"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileInput}
            />
            
            {!selectedFile ? (
              <div>
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-white font-medium mb-2">Upload Payment Receipt</p>
                <p className="text-gray-400 text-sm mb-4">
                  Drag and drop your receipt here, or click to browse
                </p>
                <label
                  htmlFor="receipt-upload"
                  className="btn-primary cursor-pointer inline-block"
                >
                  Choose File
                </label>
                <p className="text-gray-500 text-xs mt-2">
                  Supported formats: JPG, PNG, WebP, PDF (Max 5MB)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  {getFileIcon(selectedFile)}
                  <div className="text-left">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {previewUrl && (
                  <div className="max-w-xs mx-auto">
                    <img
                      src={previewUrl}
                      alt="Receipt preview"
                      className="w-full h-32 object-cover rounded border border-gray-600"
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Receipt'}
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">Receipt Upload Instructions:</p>
                <ul className="text-gray-300 space-y-1">
                  <li>• Take a clear photo of your payment receipt</li>
                  <li>• Ensure the transaction ID and amount are visible</li>
                  <li>• Upload within 24 hours of payment</li>
                  <li>• Your payment will be verified after receipt review</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReceiptUpload;