import React from 'react';
import { MinisterCalendarView } from '../components';

const Calendar: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[1085px] flex flex-col gap-6">
            <MinisterCalendarView />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
