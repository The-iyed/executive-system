import React from 'react';
import WeatherIconSvg from '../assets/image 4.svg?react';
import LocationIcon from '../assets/ic_round-location-on.svg';

export interface WeatherCardProps {
  className?: string;
  rainChance?: string;
  condition?: string;
  location?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  className = '',
  rainChance = 'احتمال هطول الأمطار 60٪',
  condition = 'غائم جزئيًا',
  location = 'الرياض، المملكة العربية السعودية',
}) => {
  return (
    <div
      className={`
        absolute bottom-[40px] left-0
        flex flex-row
        justify-center items-center
        p-[13px] pl-[25px]
        gap-[10px]
        w-[338px] h-[127px]
        rounded-[20px]
        bg-gradient-to-r from-[#6DCDCD] to-[#048F86]
        ${className}
      `}
    >
      <WeatherIconSvg className="w-[75px] h-[60px] flex-none drop-shadow-[0px_12.6923px_21.1538px_rgba(31,36,75,0.25)]"/>
          <div
            className="relative flex flex-col items-start p-0 gap-[3px] w-full"
          >
            <div
              className="flex flex-col p-0 gap-[8px] w-full"
            >
              <p
                className="w-[179.11px] text-right text-white font-normal text-sm whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {rainChance}
              </p>
              <p
                className="w-[179.11px] text-right text-white font-extrabold text-2xl leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
                style={{
                  textShadow: '0 12.692px 21.154px rgba(31, 36, 75, 0.25)',
                }}
              >
                {condition}
              </p>
            </div>
            <div
              className="flex flex-row items-center p-0 gap-[6px] w-[244px]"
            >
              <img
                src={LocationIcon}
                alt="Location"
                className="w-[17px] h-[16px] flex-none"
              />
              <p
                className="text-white flex-1 font-bold text-sm leading-normal whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {location}
              </p>
            </div>
      </div>
    </div>
  );
};