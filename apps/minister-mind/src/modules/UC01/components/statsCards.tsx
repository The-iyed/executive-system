
interface StatsCard {
  heading: string;
  number: string;
}

const statsCards = () => {
  const statsData: StatsCard[] = [
    { heading: 'مسودات قيد الإعداد', number: '12' },
    { heading: 'طلبات قيد المراجعة', number: '10' },
    { heading: 'طلبات معادة للتعديل', number: '08' },
    { heading: 'اجتماعات مجدولة', number: '14' },
  ];

  return (
    <div className="flex flex-row items-start justify-center px-7 gap-6 -mt-6">
      {statsData.map((stat, index) => (
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

export default statsCards;