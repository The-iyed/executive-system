import React from 'react';


export interface ServiceCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  isComingSoon?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ 
  title, 
  description, 
  icon, 
  isComingSoon = false,
  isDisabled = false,
  onClick
}) => {
  return (
    <div 
      onClick={onClick && !isDisabled ? onClick : undefined}
      className={`relative h-[120px] sm:h-[140px] md:h-[150px] rounded-[8px] sm:rounded-[10px] border border-[#efefef] overflow-hidden ${
        isDisabled ? 'bg-[#f8f8f8]' : 'bg-white'
      } ${onClick && !isDisabled ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      {/* Background decoration */}
      <div className="absolute left-[-65px] top-[6px] w-[339px] h-[361px] flex items-center justify-center pointer-events-none opacity-50">
        <div className="rotate-[270deg] w-[361px] h-[339px]">
          <div className="w-full h-full bg-gradient-to-br from-[#045859]/5 to-transparent rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="absolute left-1/2 top-[10px] sm:top-[12px] md:top-[14px] -translate-x-1/2 w-[90%] max-w-[217px] flex flex-col gap-[3px] sm:gap-[4px] items-end justify-end">
        <div className="flex gap-[6px] sm:gap-[8px] items-center justify-end w-full">
        <div 
            className={`h-[26px] w-[26px] sm:h-[30px] sm:w-[30px] md:h-[32px] md:w-[32px] rounded-full flex items-center justify-center flex-shrink-0 ${
              isDisabled ? 'bg-[#969696]' : 'bg-[#045859]'
            }`}
          >
            {icon && (
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 text-white flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {icon}
              </div>
            )}
          </div>
          <p
            className={`text-right text-[12px] sm:text-[14px] md:text-[15px] font-semibold leading-[18px] sm:leading-[22px] flex-1 ${
              isDisabled ? 'text-[#9e9e9e]' : 'text-black'
            }`}
            dir="auto"
          >
            {title}
          </p>

        </div>
        <p
          className={`text-right text-[8px] sm:text-[9px] md:text-[10px] leading-[14px] sm:leading-[16px] ${
            isDisabled ? 'text-[#bfbfbf]' : 'text-[#727272]'
          }`}
          dir="auto"
        >
          {description}
        </p>
      </div>

      {/* Coming Soon Badge */}
      {isComingSoon && (
        <div className="absolute left-[6px] sm:left-[8px] top-[10px] sm:top-[12px] bg-[#fef9f2] flex gap-[2px] sm:gap-[3px] h-[18px] sm:h-[20px] items-center justify-end px-1.5 sm:px-2 rounded-full">
          <p
            className="text-[#b9672d] text-[9px] sm:text-[11px] leading-[16px] sm:leading-[18px]"
            dir="auto"
          >
            قريبًا
          </p>
          <div className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] bg-[#b9672d] rounded-full" />
        </div>
      )}
    </div>
  );
};

