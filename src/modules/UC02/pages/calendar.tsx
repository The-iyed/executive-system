import React, { useEffect } from 'react';
import { CalendarView } from '../features/calendar';
import { trackEvent } from '@/lib/analytics';

const Calendar: React.FC = () => {
  useEffect(() => {
    trackEvent('UC-02', 'uc02_calendar_viewed');
  }, []);

  return <CalendarView />;
};

export default Calendar;
