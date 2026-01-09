import React from 'react';
import { Card, CardContent } from '@sanad-ai/ui';
import { Button } from '@sanad-ai/ui';
import { LucideIcon } from 'lucide-react';

export interface ServiceCardProps {
  icon: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  category: string;
  title: string;
  description: string;
  appKey?: string; // Key to identify which app/package to open
  onStart?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon: Icon,
  category,
  title,
  description,
  onStart,
}) => {
  const handleCardClick = () => {
    if (onStart) {
      onStart();
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)] border-none cursor-pointer transition-all duration-300 hover:shadow-[0px_16px_24px_-4px_rgba(16,24,40,0.12),0px_8px_8px_-4px_rgba(16,24,40,0.08)] hover:-translate-y-1 w-full sm:w-[302px]"
      dir="rtl"
      style={{ 
        fontFamily: 'Frutiger LT Arabic, sans-serif',
        minHeight: '324px',
        borderRadius: '16px',
        background: '#FFFFFF',
        border: 'none',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      <CardContent 
        className="flex flex-col items-start" 
        dir="rtl" 
        style={{ 
          gap: '24px', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        {/* Icon - 48px x 48px, order: 1 */}
        <div 
          className="rounded-full flex items-center justify-center flex-shrink-0 relative" 
          style={{ 
            width: '48px',
            height: '48px',
            background: 'rgba(4, 88, 89, 0.24)',
            borderRadius: '9999px'
          }}
        >
          <Icon className="w-6 h-6 text-[#045859]" style={{ width: '24px', height: '24px', color: '#045859' }} />
        </div>

        {/* Content - Width: 270px, Height: 156px, Gap: 16px, order: 2 */}
        <div 
          className="flex flex-col items-end text-right flex-1" 
          style={{ 
            gap: '16px', 
            width: '270px',
            height: '156px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '0px'
          }}
        >
          {/* Frame - Category and Title - Width: 270px, Height: 36px, Gap: 12px */}
          <div 
            className="flex flex-col w-full" 
            style={{ 
              gap: '12px',
              width: '270px',
              height: '36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px'
            }}
          >
            {/* Category - Width: 270px, Height: 11px, font-size 16px, line-height 11px */}
            <p 
              className="text-[#6C737F] font-normal text-right" 
              style={{ 
                fontSize: '16px', 
                lineHeight: '11px',
                width: '270px',
                height: '11px',
                textAlign: 'right',
                fontFamily: 'Frutiger LT Arabic',
                fontStyle: 'normal',
                fontWeight: 400
              }}
            >
              {category}
            </p>
            {/* Title - Width: 270px, Height: 13px, font-size 18px, line-height 11px */}
            <h3 
              className="font-bold text-[#1F2A37] text-right" 
              style={{ 
                fontSize: '18px', 
                lineHeight: '11px',
                width: '270px',
                height: '13px',
                textAlign: 'right',
                fontFamily: 'Frutiger LT Arabic',
                fontStyle: 'normal',
                fontWeight: 700
              }}
            >
              {title}
            </h3>
          </div>
          
          {/* Description - Width: 270px, font-size 16px, line-height 24px */}
          <p 
            className="text-[#1F2A37] text-right" 
            style={{ 
              fontSize: '16px', 
              lineHeight: '24px',
              width: '270px',
              textAlign: 'right',
              fontFamily: 'Frutiger LT Arabic',
              fontStyle: 'normal',
              fontWeight: 400
            }}
          >
            {description}
          </p>
        </div>

        {/* Actions - Width: 270px, Height: 40px, Gap: 16px, order: 6 */}
        <div 
          className="flex justify-start items-center" 
          style={{ 
            width: '270px',
            height: '40px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '0px'
          }}
        >
          {/* Button - Width: 100px, Height: 40px */}
          <Button
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              if (onStart) {
                onStart();
              }
            }}
            className="bg-[#045859] hover:bg-[#045859]/90 text-white"
            dir="rtl"
            style={{ 
              fontSize: '16px', 
              lineHeight: '24px',
              width: '100px',
              height: '40px',
              minHeight: '40px',
              maxHeight: '40px',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px 16px',
              gap: '4px',
              fontFamily: 'Frutiger LT Arabic',
              fontStyle: 'normal',
              fontWeight: 400,
              color: '#FFFFFF'
            }}
          >
            بدء الخدمة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

