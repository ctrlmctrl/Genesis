import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Users, CheckCircle, Clock, LogOut, Scan, BarChart3 } from 'lucide-react';
import { Participant } from '../types';
import { dataService } from '../services/dataService';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import RoleLogin from '../components/RoleLogin';
import toast from 'react-hot-toast';

const VolunteerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<RoleUser | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0
  });

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = roleAuthService.getCurrentUser();
    if (currentUser && currentUser.role === 'volunteer') {
      setUser(currentUser);
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const participantsData = await dataService.getParticipants();
      setParticipants(participantsData);
      
      // Calculate stats
      const total = participantsData.length;
      const verified = participantsData.filter((p: Participant) => p.isVerified).length;
      const pending = total - verified;
      
      setStats({ total, verified, pending });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: RoleUser) => {
    setUser(loggedInUser);
    loadData();
  };

  const handleLogout = () => {
    roleAuthService.logout();
    setUser(null);
    navigate('/volunteer');
  };

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-cyan-500 rounded-full mx-auto mb-4"></div>
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white neon-text">Volunteer Dashboard</h1>
          <p className="text-gray-400">Welcome, {user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <LogOut className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-glow text-center">
          <Users className="h-8 w-8 mx-auto mb-2 text-blue-400" />
          <h3 className="font-semibold text-white">{stats.total}</h3>
          <p className="text-sm text-gray-400">Total</p>
        </div>
        <div className="card-glow text-center">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
          <h3 className="font-semibold text-white">{stats.verified}</h3>
          <p className="text-sm text-gray-400">Verified</p>
        </div>
        <div className="card-glow text-center">
          <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
          <h3 className="font-semibold text-white">{stats.pending}</h3>
          <p className="text-sm text-gray-400">Pending</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          to="/volunteer/scanner"
          className="card-glow text-center hover:shadow-cyan-500/50 transition-shadow"
        >
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 5 }}
            className="inline-block"
          >
            <Scan className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
          </motion.div>
          <h3 className="font-semibold text-white mb-2">QR Code Scanner</h3>
          <p className="text-sm text-gray-400">Scan participant QR codes for verification</p>
        </Link>

        <Link
          to="/volunteer/analytics"
          className="card-glow text-center hover:shadow-blue-500/50 transition-shadow"
        >
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: -5 }}
            className="inline-block"
          >
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-400" />
          </motion.div>
          <h3 className="font-semibold text-white mb-2">Analytics</h3>
          <p className="text-sm text-gray-400">View verification statistics</p>
        </Link>
      </div>

      {/* Recent Verifications */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 neon-text">Recent Verifications</h2>
        {participants.length === 0 ? (
          <div className="card-glow text-center py-8">
            <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400">No participants registered yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {participants
              .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
              .slice(0, 5)
              .map((participant) => (
                <motion.div
                  key={participant.id}
                  className="card-glow hover:shadow-cyan-500/50 transition-shadow"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {participant.fullName}
                      </h3>
                      <p className="text-sm text-gray-400">{participant.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        participant.isVerified 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {participant.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      {participant.verificationTime && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(participant.verificationTime).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Registered: {new Date(participant.registrationDate).toLocaleDateString()}</span>
                    <span>Payment: {participant.paymentStatus}</span>
                  </div>
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
