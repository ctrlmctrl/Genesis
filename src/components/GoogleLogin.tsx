import React from 'react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const GoogleLogin: React.FC = () => {
  const { login, loading } = useAuth();

  return (
    <motion.button
      onClick={login}
      disabled={loading}
      className="btn-google w-full"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Chrome className="h-5 w-5" />
      <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
    </motion.button>
  );
};

export default GoogleLogin;
