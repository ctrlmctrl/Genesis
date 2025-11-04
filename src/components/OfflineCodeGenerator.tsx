import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, QrCode, Clock, CheckCircle, X, Plus, Eye, EyeOff } from 'lucide-react';
import { offlineCodeService, OfflinePaymentCode } from '../services/offlineCodeService';
import { Event } from '../types';
import toast from 'react-hot-toast';

interface OfflineCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  currentUser: { id: string; name: string };
}

const OfflineCodeGenerator: React.FC<OfflineCodeGeneratorProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
}) => {
  const [amount, setAmount] = useState<number>(event.entryFee || 0);
  const [generatedCode, setGeneratedCode] = useState<OfflinePaymentCode | null>(null);
  const [codes, setCodes] = useState<OfflinePaymentCode[]>([]);
  const [showAllCodes, setShowAllCodes] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('unused');

  useEffect(() => {
    if (isOpen) {
      loadCodes();
    }
  }, [isOpen, event.id]);

  const loadCodes = async () => {
    const eventCodes = await offlineCodeService.getCodesByEvent(event.id);
    setCodes(eventCodes);
  };

  const generateNewCode = async () => {
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const newCode = await offlineCodeService.generateCode(event.id, amount, currentUser.id);
    setGeneratedCode(newCode);
    loadCodes();
    toast.success('Payment code generated successfully!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getFilteredCodes = () => {
    switch (filter) {
      case 'unused':
        return codes.filter(c => !c.isUsed && new Date(c.expiresAt) > new Date());
      case 'used':
        return codes.filter(c => c.isUsed);
      default:
        return codes;
    }
  };

  const getStatusColor = (code: OfflinePaymentCode) => {
    if (code.isUsed) return 'text-green-400 bg-green-400/10';
    if (new Date(code.expiresAt) <= new Date()) return 'text-red-400 bg-red-400/10';
    return 'text-yellow-400 bg-yellow-400/10';
  };

  const getStatusText = (code: OfflinePaymentCode) => {
    if (code.isUsed) return 'Used';
    if (new Date(code.expiresAt) <= new Date()) return 'Expired';
    return 'Active';
  };

  // State for code stats
  const [stats, setStats] = useState<{ total: number; used: number; unused: number; expired: number } | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await offlineCodeService.getCodeStats();
        setStats(result);
      } catch (error) {
        console.error('Error fetching code stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Offline Payment Codes</h2>
            <p className="text-sm text-gray-400">{event.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Generate New Code */}
          <div className="bg-gray-700/50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Generate New Payment Code</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  min="0"
                  step="1"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateNewCode}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Code
                </button>
              </div>
            </div>

            {/* Generated Code Display */}
            {generatedCode && (
              <motion.div
                className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-cyan-400">Generated Payment Code</h4>
                  <button
                    onClick={() => copyToClipboard(generatedCode.code)}
                    className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
                    title="Copy code"
                  >
                    <Copy className="h-4 w-4 text-cyan-400" />
                  </button>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-mono font-bold text-cyan-400 tracking-widest mb-2">
                    {generatedCode.code}
                  </div>
                  <p className="text-sm text-cyan-300">
                    Amount: ₹{generatedCode.amount} • Expires in 24 hours
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Codes List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Payment Codes</h3>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="unused">Active</option>
                  <option value="used">Used</option>
                  <option value="all">All</option>
                </select>
                <button
                  onClick={() => setShowAllCodes(!showAllCodes)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title={showAllCodes ? 'Hide details' : 'Show details'}
                >
                  {showAllCodes ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getFilteredCodes().length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No payment codes found</p>
                </div>
              ) : (
                getFilteredCodes().map((code) => (
                  <div
                    key={code.id}
                    className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-mono font-bold text-white tracking-widest">
                        {code.code}
                      </div>
                      <div className="text-sm text-gray-300">
                        ₹{code.amount}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(code)}`}>
                        {getStatusText(code)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {showAllCodes && (
                        <div className="text-xs text-gray-400 text-right">
                          <div>Generated: {new Date(code.generatedAt).toLocaleString()}</div>
                          {code.isUsed && code.usedAt && (
                            <div>Used: {new Date(code.usedAt).toLocaleString()}</div>
                          )}
                          {!code.isUsed && (
                            <div>Expires: {formatTimeRemaining(code.expiresAt)}</div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy code"
                      >
                        <Copy className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-3">Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats && [
                { label: 'Total', value: stats.total, color: 'text-blue-400' },
                { label: 'Active', value: stats.unused, color: 'text-yellow-400' },
                { label: 'Used', value: stats.used, color: 'text-green-400' },
                { label: 'Expired', value: stats.expired, color: 'text-red-400' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OfflineCodeGenerator;
