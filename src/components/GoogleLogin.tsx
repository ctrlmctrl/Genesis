import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogo from './GoogleLogo';

interface GoogleLoginProps {
  variant?: 'light' | 'dark';
}

const GoogleLogin: React.FC<GoogleLoginProps> = ({ variant = 'light' }) => {
  const { login, loading } = useAuth();

  return (
    <motion.button
      onClick={login}
      disabled={loading}
      className={`w-full font-medium py-3 px-6 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed ${
        variant === 'dark' 
          ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500' 
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {!loading && <GoogleLogo className="h-5 w-5" />}
      {loading && (
        <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
          variant === 'dark' ? 'border-white' : 'border-gray-600'
        }`}></div>
      )}
      <span className="text-sm font-medium">
        {loading ? 'Signing in...' : 'Continue with Google'}
      </span>
    </motion.button>
  );
};

export default GoogleLogin;
