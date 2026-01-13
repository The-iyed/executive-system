import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusType } from './status-badge';
import { Eye, ChevronLeft } from 'lucide-react';
import { MeetingStatus } from '../types';

export interface MeetingCardData {
  id: string;
  title: string;
  date: string;
  coordinator?: string;
  coordinatorAvatar?: string;
  status: StatusType | MeetingStatus;
  statusLabel: string;
  location?: string;
}

export interface MeetingCardProps {
  meeting: MeetingCardData;
  onView?: () => void;
  onDetails?: () => void;
  className?: string;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onView,
  onDetails,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onDetails) {
      onDetails();
    } else {
      navigate(`/meeting/${meeting.id}`);
    }
  };

  return (
    <div
      className={`
        box-border
        flex flex-col
        items-start
        bg-white
        rounded-[11.36px]
        w-full
        p-1
        gap-2
        shadow-[0px_2.52357px_20.8195px_rgba(58,168,124,0.25)]
        cursor-pointer
        hover:shadow-[0px_4px_24px_rgba(58,168,124,0.35)]
        transition-shadow
        ${className}
      `}
      dir="rtl"
      onClick={handleCardClick}
    >
      {/* Card Content Frame */}
      <div className="flex flex-col items-start p-0 w-full gap-1.5">
        {/* Main Content Area */}
        <div className="relative bg-white rounded-lg overflow-hidden w-full h-36">
          {/* Background Blur Effect */}
          <div
            className="absolute rounded-full bg-[#A6D8C1]"
            style={{
              width: '194px',
              height: '182px',
              left: '-35px',
              top: '4px',
              filter: 'blur(54px)',
              transform: 'rotate(-90deg)',
            }}
          />

          {/* Content Frame - Centered */}
          <div className="absolute flex flex-col items-end p-0 w-[calc(100%-22px)] max-w-[338px] h-[110px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">


            {/* Title, Date, and Coordinator */}
            <div className="flex flex-col items-end p-0 w-full gap-2.5">
              {/* Title and Status Badge - Same row */}
              <div className="flex flex-row justify-between items-center p-0 w-full gap-3">
                <h3
                  className="text-right flex-1 text-black font-semibold leading-7"
                  style={{
                    fontFamily: "'Somar Sans', sans-serif",
                    fontSize: '18px',
                  }}
                >
                  {meeting.title}
                </h3>
                {/* Status Badge - Right aligned */}
                <div className="flex flex-row justify-center items-center px-2.5 py-0.5 h-5 rounded-[77px] bg-[rgba(255,162,162,0.12)] flex-shrink-0">
                  <span className="text-xs font-medium text-[#D13C3C] leading-4" style={{ fontFamily: "'Somar Sans', sans-serif" }}>
                    {meeting.statusLabel}
                  </span>
                </div>
              </div>
              {/* Date */}
              <div className="flex flex-col items-start p-0 w-full">
                <p
                  className="text-right w-full text-[#2C2C2C] font-normal text-xs leading-[19px]"
                  style={{
                    fontFamily: "'Ping AR + LT', sans-serif",
                  }}
                >
                  {meeting.date}
                </p>
              </div>

              {/* Coordinator - Right aligned, no avatar */}
              {meeting.coordinator && (
                <div className="flex flex-row items-center justify-start w-full">
                  <span
                    className="text-right text-sm font-medium text-[#344054] leading-5"
                    style={{
                      fontFamily: "'Somar Sans', sans-serif",
                    }}
                  >
                    {meeting.coordinator}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="box-border flex flex-col justify-center items-center bg-white border border-[#EDEDED] rounded-lg w-full h-9 p-1.5 gap-1.5 shadow-[0px_2.52357px_11.4192px_rgba(0,0,0,0.1)]">
          <div className="flex flex-row justify-between items-center p-0 w-full h-7 gap-1.5">
                 {/* Details Button */}
                 <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="flex flex-row items-center gap-1.5 p-0 hover:opacity-80 transition-opacity"
            >
              
              <span
                className="text-right text-sm font-normal text-[#344054] leading-4"
                style={{
                  fontFamily: "'Ping AR + LT', sans-serif",
                }}
              >
                تفاصيل
              </span>
              <ChevronLeft
                className="w-[15px] h-[15px] text-[#344054]"
             
              />
            </button>
            {/* Eye Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onView) {
                  onView();
                } else {
                  handleCardClick();
                }
              }}
              className="flex flex-row justify-center items-center rounded-md hover:bg-gray-200 transition-colors w-7 h-7 bg-[#F6F6F6]"
            >
              <Eye className="w-5 h-5 text-[#475467]" strokeWidth={1.67} />
            </button>
            
    
          </div>
        </div>
      </div>
    </div>
  );
};
