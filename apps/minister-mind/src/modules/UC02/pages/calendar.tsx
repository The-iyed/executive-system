import React from 'react';
import { MinisterCalendarView } from '../components';

const Calendar: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <MinisterCalendarView />
      </div>
    </div>
  );
};

export default Calendar;
