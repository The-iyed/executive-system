import React, { useEffect } from 'react';
import { MinisterCalendarView } from '../components';
import { trackEvent } from '@analytics';

const Calendar: React.FC = () => {
  useEffect(() => {
    trackEvent('UC-02', 'uc02_calendar_viewed');
  }, []);

  return <MinisterCalendarView />;
};

export default Calendar;