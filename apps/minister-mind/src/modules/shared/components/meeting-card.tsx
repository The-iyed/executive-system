import React from 'react';
import { StatusBadge, StatusType } from './status-badge';
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
  return (
    <div
      className={`
        box-border
        flex flex-col
        items-start
        w-full
        bg-white
        rounded-[11.36px]
        ${className}
      `}
      style={{
        padding: '4.39551px',
        gap: '8.79px',
        boxShadow: '0px 2.52357px 20.8195px rgba(58, 168, 124, 0.25)',
        aspectRatio: '432.79 / 226.94',
        minWidth: '300px',
        maxWidth: '432.79px',
      }}
    >
      {/* Card Content */}
      <div
        className="flex flex-col items-start p-0 w-full"
        style={{
          height: 'calc(100% - 8.79px)',
          gap: '6.15px',
        }}
      >
        {/* Main Content Area */}
        <div
          className="relative w-full bg-white rounded-[8.2px] overflow-hidden flex-1"
          style={{
            minHeight: '171px',
          }}
        >
          {/* Background Blur Effect */}
          <div
            className="absolute rounded-full"
            style={{
              width: '227.75px',
              height: '213.87px',
              left: '-41.02px',
              top: '4.66px',
              background: '#A6D8C1',
              filter: 'blur(63.2649px)',
              transform: 'rotate(-90deg)',
            }}
          />

          {/* Content Frame */}
          <div
            className="absolute flex flex-col items-end p-0"
            style={{
              width: 'calc(100% - 26px)',
              maxWidth: '398px',
              height: '130px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              gap: '21px',
            }}
          >
            {/* Header Row - Status Badge and ID */}
            <div className="flex flex-row justify-between items-center p-0 w-full h-[22px]">
              <StatusBadge status={meeting.status} label={meeting.statusLabel} />
              <span className="text-right text-sm font-normal text-[#2C2C2C] h-4 flex-shrink-0">
                {meeting.id}
              </span>
            </div>

            {/* Title, Date, and Coordinator */}
            <div
              className="flex flex-col items-end p-0 w-full"
              style={{
                height: '87px',
                gap: '11px',
              }}
            >
              {/* Title and Date */}
              <div
                className="flex flex-col items-start p-0 w-full"
                style={{
                  height: '52px',
                  gap: '4px',
                }}
              >
                <h3 className="text-right w-full text-black font-semibold h-[29px] text-[21.0984px] leading-7">
                  {meeting.title}
                </h3>
                <p className="text-right w-full text-[#2C2C2C] font-normal text-xs leading-[19px] h-[19px]">
                  {meeting.date}
                </p>
              </div>

              {/* Coordinator */}
              {meeting.coordinator && (
                <div
                  className="flex flex-row items-center p-0"
                  style={{
                    width: '109px',
                    height: '24px',
                    gap: '10px',
                  }}
                >
                  <div
                    className="flex flex-col justify-center items-end p-0"
                    style={{
                      width: '75px',
                      height: '20px',
                    }}
                  >
                    <span className="text-right text-sm font-medium text-[#344054] w-[75px] h-5 leading-5">
                      {meeting.coordinator}
                    </span>
                  </div>
                  {meeting.coordinatorAvatar ? (
                    <img
                      src={meeting.coordinatorAvatar}
                      alt={meeting.coordinator}
                      className="w-6 h-6 rounded-full"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '211.687px',
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-full bg-gray-200"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '211.687px',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div
          className="box-border flex flex-col justify-center items-center bg-white border rounded-[8.2px] w-full"
          style={{
            height: '41px',
            padding: '6.30893px',
            gap: '6.31px',
            border: '0.630893px solid #EDEDED',
            boxShadow: '0px 2.52357px 11.4192px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            className="flex flex-row justify-between items-center p-0 w-full"
            style={{
              height: '29px',
              gap: '6.31px',
            }}
          >
            <button
              onClick={onView}
              className="flex flex-row justify-center items-center rounded-md hover:bg-gray-200 transition-colors"
              style={{
                padding: '10px',
                gap: '8px',
                width: '28px',
                height: '29px',
                background: '#F6F6F6',
                borderRadius: '6px',
              }}
            >
              <Eye
                className="text-gray-600"
                style={{
                  width: '20px',
                  height: '20px',
                }}
                strokeWidth={1.67}
              />
            </button>
            <button
              onClick={onDetails}
              className="flex flex-row items-center p-0 hover:opacity-80 transition-opacity"
              style={{
                width: '65.89px',
                height: '17.58px',
                gap: '6.31px',
              }}
            >
              <ChevronLeft
                className="text-gray-700"
                style={{
                  width: '17.58px',
                  height: '17.58px',
                  transform: 'rotate(-90deg)',
                }}
              />
              <span className="text-right text-sm font-normal text-[#344054] w-[42px] h-4 leading-4">
                تفاصيل
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
