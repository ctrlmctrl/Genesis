import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, Zap, User, MapPin, DollarSign, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Event, Participant } from '../types';
import { useAuth } from '../contexts/AuthContext';
import GoogleLogin from './GoogleLogin';

interface TechyLandingProps {
  events: Event[];
  participants: Participant[];
  loading: boolean;
}

const TechyLanding: React.FC<TechyLandingProps> = ({ events, participants, loading }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter out events that user is already registered for
  const getAvailableEvents = () => {
    if (!isAuthenticated || !participants.length) {
      return events;
    }

    const registeredEventIds = participants.map(p => p.eventId);
    return events.filter(event => !registeredEventIds.includes(event.id));
  };

  const availableEvents = getAvailableEvents();

  // Group events by day
  const day1Events = availableEvents.filter(event => event.eventDay === 'day1');
  const day2Events = availableEvents.filter(event => event.eventDay === 'day2');

  return (
    <div className="min-h-screen tech-bg">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 mobile-container">
        {/* Logout Button - Only show when authenticated */}
        {isAuthenticated && (
          <motion.div
            className="flex justify-end mb-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </motion.div>
        )}

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
            Beyond Excellence
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
                  Discover exclusive events and cutting-edge technology experiences. Sign in below to register for events.
                </p>
                <GoogleLogin variant="dark" />
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

        {/* Quick Actions - Only show when authenticated */}
        {isAuthenticated && (
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
          </motion.div>
        )}

        {/* Event Location Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <div className="card-glow text-center">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center justify-center">
              <MapPin className="h-6 w-6 mr-2 text-cyan-400" />
              Event Location
            </h2>
            <div className="space-y-3">
              <p className="text-lg text-gray-300">
                <strong className="text-cyan-400">Genesis Tech Fest 2025</strong>
              </p>
              <p className="text-gray-400">
                November 14-15, 2025
              </p>
              <div className="mt-4">
                <a
                  href="https://maps.app.goo.gl/jEfDLpDuZxfNpzNu8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  View College Location
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Events Section */}
        <motion.div
          className="space-y-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          ) : availableEvents.length === 0 ? (
            <div className="card-glow text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {events.length === 0 ? "No Events Available" : "No Available Events"}
              </h3>
              <p className="text-gray-400">
                {events.length === 0
                  ? "No events are currently available for registration"
                  : isAuthenticated
                    ? "You're registered for all available events!"
                    : "No events are currently available for registration"
                }
              </p>
            </div>
          ) : (
            <>
              {/* Day 1 Events Section */}
              {day1Events.length > 0 && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
                      <Calendar className="h-8 w-8 mr-3 text-cyan-400" />
                      Day 1 Events
                    </h2>
                    <p className="text-lg text-cyan-300 mb-4">From strategy to success</p>
                    <p className="text-gray-400 mb-6">Begin your Genesis experience with exciting workshops and competitions</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mx-auto rounded-full"></div>
                  </div>

                  {day1Events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="card-glow hover:scale-105 transition-all duration-300 group"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6 + index * 0.1, duration: 0.5 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-gray-300 mb-4 whitespace-pre-line">{event.description}</p>
                        </div>
                        <div className="flex items-center text-cyan-400 ml-4">
                          <Calendar className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Day 1</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-3 text-cyan-400" />
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>

                        {/* Room number hidden until participant is verified */}

                        {event.entryFee > 0 && (
                          <div className="flex items-center text-cyan-400">
                            <DollarSign className="h-4 w-4 mr-3" />
                            Entry Fee: ₹{event.entryFee}
                          </div>
                        )}

                        {event.isTeamEvent && (
                          <div className="flex items-center text-purple-400">
                            <Users className="h-4 w-4 mr-3" />
                            Team Event ({event.membersPerTeam} members)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-cyan-400">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></div>
                          Registration Open
                        </div>

                        <div className="flex items-center space-x-3">
                          {isAuthenticated ? (
                            <Link
                              to={`/register/${event.id}`}
                              className="btn-primary"
                            >
                              Register Now
                            </Link>
                          ) : (
                            <div className="text-sm text-gray-400">
                              Sign in required
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Day 2 Events Section */}
              {day2Events.length > 0 && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.8 }}
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4 flex items-center justify-center">
                      <Calendar className="h-8 w-8 mr-3 text-purple-400" />
                      Day 2 Events
                    </h2>
                    <p className="text-lg text-purple-300 mb-4">From code to creation</p>
                    <p className="text-gray-400 mb-6">Continue your journey with advanced challenges and grand finale competitions</p>
                    <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
                  </div>

                  {day2Events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      className="card-glow hover:scale-105 transition-all duration-300 group"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.0 + index * 0.1, duration: 0.5 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-gray-300 mb-4 whitespace-pre-line">{event.description}</p>
                        </div>
                        <div className="flex items-center text-purple-400 ml-4">
                          <Calendar className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Day 2</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-gray-400">
                          <Calendar className="h-4 w-4 mr-3 text-purple-400" />
                          {new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>

                        {/* Room number hidden until participant is verified */}

                        {event.entryFee > 0 && (
                          <div className="flex items-center text-purple-400">
                            <DollarSign className="h-4 w-4 mr-3" />
                            Entry Fee: ₹{event.entryFee}
                          </div>
                        )}

                        {event.isTeamEvent && (
                          <div className="flex items-center text-purple-400">
                            <Users className="h-4 w-4 mr-3" />
                            Team Event ({event.membersPerTeam} members)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-purple-400">
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                          Registration Open
                        </div>

                        <div className="flex items-center space-x-3">
                          {isAuthenticated ? (
                            <Link
                              to={`/register/${event.id}`}
                              className="btn-primary"
                            >
                              Register Now
                            </Link>
                          ) : (
                            <div className="text-sm text-gray-400">
                              Sign in required
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </motion.div>
        <motion.div
          className="text-center mt-10">
          <a
            href="tel:+917039782575"
            className="btn-primary py-3 px-6"
          >
            Need help? Click here
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default TechyLanding;
