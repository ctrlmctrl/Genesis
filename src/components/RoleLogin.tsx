import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, Users } from 'lucide-react';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import toast from 'react-hot-toast';

interface RoleLoginProps {
  onLogin: (user: RoleUser) => void;
  role: 'volunteer' | 'admin';
}

const RoleLogin: React.FC<RoleLoginProps> = ({ onLogin, role }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      toast.error('Please enter your User ID');
      return;
    }

    setLoading(true);
    try {
      const user = await roleAuthService.login(userId);
      
      // Check if the logged-in user has the correct role
      if (user.role !== role) {
        toast.error(`Invalid User ID for ${role} access`);
        roleAuthService.logout();
        return;
      }

      toast.success(`Welcome, ${user.name}!`);
      onLogin(user);
    } catch (error) {
      toast.error('Invalid User ID');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = {
    volunteer: {
      title: 'Volunteer Login',
      icon: Users,
      color: 'text-cyan-400',
      description: 'Access volunteer dashboard and QR scanner',
      credentials: 'User ID: volunteer'
    },
    admin: {
      title: 'Admin Login',
      icon: Shield,
      color: 'text-blue-400',
      description: 'Access admin dashboard and event management',
      credentials: 'User ID: admin'
    }
  };

  const info = roleInfo[role];
  const IconComponent = info.icon;

  return (
    <motion.div
      className="card-glow p-8 max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-6">
        <motion.div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4 ${info.color}`}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <IconComponent className="h-8 w-8" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">{info.title}</h2>
        <p className="text-gray-400 text-sm">{info.description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-300 mb-2">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Enter your User ID"
            disabled={loading}
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            <div className="flex items-center">
              <LogIn className="h-5 w-5 mr-2" />
              Sign In
            </div>
          )}
        </motion.button>
      </form>

    </motion.div>
  );
};

export default RoleLogin;
