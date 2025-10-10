import React, { useState, useEffect } from 'react';
import { Event, Participant } from '../types';
import { dataService } from '../services/dataService';
import { realtimeService } from '../services/realtimeService';
import { useAuth } from '../contexts/AuthContext';
import TechyLanding from '../components/TechyLanding';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.email) {
      // If not authenticated, just load events normally
      const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                        (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

      if (isFirebase) {
        const unsubscribe = realtimeService.listenToEvents((eventsData) => {
          setEvents(eventsData);
          setLoading(false);
        });
        return unsubscribe;
      } else {
        const loadEvents = async () => {
          try {
            const eventsData = await dataService.getEvents();
            setEvents(eventsData);
          } catch (error) {
            console.error('Error loading events:', error);
          } finally {
            setLoading(false);
          }
        };
        loadEvents();
      }
      return;
    }

    // If authenticated, load both events and user's participants
    const isFirebase = process.env.REACT_APP_STORAGE_MODE === 'firebase' || 
                      (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_STORAGE_MODE);

    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeParticipants: (() => void) | null = null;

    if (isFirebase) {
      // Use real-time listeners for Firebase
      unsubscribeEvents = realtimeService.listenToEvents((eventsData) => {
        setEvents(eventsData);
        setLoading(false);
      });

      unsubscribeParticipants = realtimeService.listenToUserParticipants(user.email, (participantsData) => {
        setParticipants(participantsData);
      });

      return () => {
        if (unsubscribeEvents) unsubscribeEvents();
        if (unsubscribeParticipants) unsubscribeParticipants();
      };
    } else {
      // Fallback to regular data loading for development
      const loadData = async () => {
        try {
          const [eventsData, participantsData] = await Promise.all([
            dataService.getEvents(),
            dataService.getParticipants()
          ]);
          
          setEvents(eventsData);
          // Filter participants for current user
          const userParticipants = participantsData.filter((p: Participant) => p.email === user.email);
          setParticipants(userParticipants);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [isAuthenticated, user?.email]);

  return <TechyLanding events={events} participants={participants} loading={loading} />;
};

export default Home;
