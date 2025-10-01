import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Shield, Users } from 'lucide-react';
import { roleAuthService, RoleUser } from '../services/roleAuth';
import toast from 'react-hot-toast';

interface RoleLoginProps {
  onLogin: (user: RoleUser) => void;
  role: 'volunteer' | 'admin';
}

const RoleLogin: React.FC<RoleLoginProps> = ({ onLogin, role }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const user = await roleAuthService.login(username, password);
      
      // Check if the logged-in user has the correct role
      if (user.role !== role) {
        toast.error(`Invalid credentials for ${role} access`);
        roleAuthService.logout();
        return;
      }

      toast.success(`Welcome, ${user.name}!`);
      onLogin(user);
    } catch (error) {
      toast.error('Invalid username or password');
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
      credentials: 'Username: volunteer, Password: volunteer123'
    },
    admin: {
      title: 'Admin Login',
      icon: Shield,
      color: 'text-blue-400',
      description: 'Access admin dashboard and event management',
      credentials: 'Username: admin, Password: admin123'
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
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Enter username"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent pr-12"
              placeholder="Enter password"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
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

      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          <strong>Demo Credentials:</strong><br />
          {info.credentials}
        </p>
      </div>
    </motion.div>
  );
};

export default RoleLogin;
