import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, Zap, User, MapPin, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from './GoogleLogin';

interface TechyLandingProps {
  events: Event[];
  loading: boolean;
}

const TechyLanding: React.FC<TechyLandingProps> = ({ events, loading }) => {
  const { user, isAuthenticated } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen tech-bg">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 mobile-container">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center mb-6"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Sparkles className="h-12 w-12 text-cyan-400 mr-4" />
            <h1 className="text-5xl font-bold neon-text">GENESIS</h1>
            <Sparkles className="h-12 w-12 text-cyan-400 ml-4" />
          </motion.div>
          <motion.p
            className="text-xl text-gray-300 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Next-Generation Event Management Platform
          </motion.p>
          
          {!isAuthenticated ? (
            <motion.div
              className="max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="card-glow mb-6">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center">
                  <Zap className="h-6 w-6 mr-2 text-cyan-400" />
                  Welcome to the Future
                </h2>
                <p className="text-gray-300 mb-6">
                  Sign in with Google to access exclusive events and cutting-edge technology experiences.
                </p>
                <GoogleLogin />
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="card-glow mb-6">
                <div className="flex items-center justify-center mb-4">
                  <img
                    src={user?.picture || 'https://via.placeholder.com/150/06b6d4/ffffff?text=U'}
                    alt={user?.name}
                    className="w-16 h-16 rounded-full border-2 border-cyan-400"
                  />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-gray-300">
                  Ready to explore the latest events?
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <Link
                to="/participant"
                className="card-glow hover:scale-105 transition-all duration-300 group"
              >
                <div className="text-center">
                  <motion.div
                    className="mb-4"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <User className="h-12 w-12 mx-auto text-green-400 group-hover:text-green-300" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">My Events</h3>
                  <p className="text-gray-400">View your registrations and QR codes</p>
                </div>
              </Link>
              
              <div className="card-glow p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-4">Staff Access</h3>
                  <div className="space-y-3">
                    <Link
                      to="/volunteer"
                      className="block w-full px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                    >
                      Volunteer Dashboard
                    </Link>
                    <Link
                      to="/admin"
                      className="block w-full px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>

        {/* Events Section */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 mr-3 text-cyan-400" />
              Upcoming Events
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : events.length === 0 ? (
            <div className="card-glow text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Events Available</h3>
              <p className="text-gray-400">Check back later for upcoming tech events</p>
            </div>
          ) : (
            events.map((event, index) => (
              <motion.div
                key={event.id}
                className="card-glow hover:scale-105 transition-all duration-300 group"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{event.description}</p>
                  </div>
                  <div className="flex items-center text-cyan-400 ml-4">
                    <Users className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">{event.currentParticipants}</span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-400">
                    <Calendar className="h-4 w-4 mr-3 text-cyan-400" />
                    {formatDate(event.date)} at {event.time}
                  </div>
                  <div className="flex items-center text-gray-400">
                    <MapPin className="h-4 w-4 mr-3 text-cyan-400" />
                    {event.location}
                  </div>
                  {event.entryFee > 0 && (
                    <div className="flex items-center text-cyan-400">
                      <DollarSign className="h-4 w-4 mr-3" />
                      Entry Fee: ₹{event.entryFee}
                    </div>
                  )}
                  {event.isTeamEvent && (
                    <div className="flex items-center text-purple-400">
                      <Users className="h-4 w-4 mr-3" />
                      Team Event ({event.teamSize} members)
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-cyan-400">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                    Registration Open
                  </div>
                  
                  {isAuthenticated ? (
                    <Link
                      to={`/register/${event.id}`}
                      className="btn-primary"
                    >
                      Register Now
                    </Link>
                  ) : (
                    <div className="text-sm text-gray-400">
                      Sign in to register
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TechyLanding;
