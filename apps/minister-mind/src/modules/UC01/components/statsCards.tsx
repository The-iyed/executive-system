import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, StatsCard } from '../data';
import { ScreenLoader } from '@shared';

const StatsCards: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const statsData: StatsCard[] = data
  ? [
      { heading: 'مسودات قيد الإعداد', number: data.drafts_in_preparation.toString() },
      { heading: 'طلبات قيد المراجعة', number: data.under_review.toString() },
      { heading: 'طلبات معادة للتعديل', number: data.returned_for_modification.toString() },
      { heading: 'اجتماعات مجدولة', number: data.scheduled_meetings.toString() },
    ]
  : [];

  if (isLoading) {
    return <ScreenLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-red-500">حدث خطأ في تحميل البيانات</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-start justify-center px-7 gap-6 -mt-6">
      { statsData.length > 0 && statsData?.map((stat, index) => (
        <div
          key={index}
          className="flex flex-col items-start p-6 gap-6 w-[312px] h-[140px] bg-white border border-[#EAECF0] rounded-xl"
          style={{
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
          }}
        >
          <p className="font-bold text-base text-right text-[#101828]">{stat.heading}</p>
          <p className="font-bold text-[42px] text-right text-[#009883]">{stat.number}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;