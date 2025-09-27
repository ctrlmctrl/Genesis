import React, { useState, useEffect } from 'react';
import { Event } from '../types';
import { dataService } from '../services/dataService';
import TechyLanding from '../components/TechyLanding';

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  return <TechyLanding events={events} loading={loading} />;
};

export default Home;
