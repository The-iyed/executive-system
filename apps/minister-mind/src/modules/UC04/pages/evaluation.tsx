import React from 'react';
import { MinisterCalendarView } from '../../UC02/components/MinisterCalendarView';

const Evaluation: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6">
        <MinisterCalendarView />
      </div>
    </div>
  );
};

export default Evaluation;
