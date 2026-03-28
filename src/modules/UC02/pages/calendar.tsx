import React, { useEffect } from 'react';
import { CalendarView } from '../features/calendar';
import { trackEvent } from '@/lib/analytics';
import { MeetingFormDrawer } from '../features/MeetingForm/components/MeetingFormDrawer';
import { PATH } from '../routes/paths';

const Calendar: React.FC = () => {
  useEffect(() => {
    trackEvent('UC-02', 'uc02_calendar_viewed');
  }, []);

  return (
    <>
      <CalendarView />
      <MeetingFormDrawer createEditBasePath={PATH.CALENDAR} />
    </>
  );
};

export default Calendar;
