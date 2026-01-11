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
      className="shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)] border-none cursor-pointer transition-all duration-300 hover:shadow-[0px_16px_24px_-4px_rgba(16,24,40,0.12),0px_8px_8px_-4px_rgba(16,24,40,0.08)] hover:-translate-y-1 w-full sm:w-[302px] flex-shrink-0"
      dir="rtl"
      style={{ 
        fontFamily: 'Frutiger LT Arabic, sans-serif',
        minHeight: '324px',
        maxHeight: 'none',
        borderRadius: '16px',
        background: '#FFFFFF',
        border: 'none',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent 
        className="flex flex-col items-start flex-1 w-full" 
        dir="rtl" 
        style={{ 
          gap: '24px', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '100%',
          boxSizing: 'border-box'
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

        {/* Content - Responsive width, Gap: 16px, order: 2 */}
        <div 
          className="flex flex-col items-end text-right flex-1 w-full" 
          style={{ 
            gap: '16px', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '0px',
            width: '100%',
            minWidth: 0
          }}
        >
          {/* Frame - Category and Title - Responsive width, Gap: 12px */}
          <div 
            className="flex flex-col w-full" 
            style={{ 
              gap: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px',
              width: '100%',
              minWidth: 0
            }}
          >
            {/* Category - font-size 16px, line-height 11px */}
            <p 
              className="text-[#6C737F] font-normal text-right w-full" 
              style={{ 
                fontSize: '16px', 
                lineHeight: '11px',
                textAlign: 'right',
                fontFamily: 'Frutiger LT Arabic',
                fontStyle: 'normal',
                fontWeight: 400,
                margin: 0,
                padding: 0
              }}
            >
              {category}
            </p>
            {/* Title - font-size 18px, line-height 11px */}
            <h3 
              className="font-bold text-[#1F2A37] text-right w-full" 
              style={{ 
                fontSize: '18px', 
                lineHeight: '11px',
                textAlign: 'right',
                fontFamily: 'Frutiger LT Arabic',
                fontStyle: 'normal',
                fontWeight: 700,
                margin: 0,
                padding: 0
              }}
            >
              {title}
            </h3>
          </div>
          
          {/* Description - Responsive width, font-size 16px, line-height 24px */}
          <p 
            className="text-[#1F2A37] text-right w-full flex-1" 
            style={{ 
              fontSize: '16px', 
              lineHeight: '24px',
              textAlign: 'right',
              fontFamily: 'Frutiger LT Arabic',
              fontStyle: 'normal',
              fontWeight: 400,
              margin: 0,
              padding: 0,
              minWidth: 0
            }}
          >
            {description}
          </p>
        </div>

        {/* Actions - Responsive width, Height: 40px, Gap: 16px, order: 6 */}
        <div 
          className="flex justify-start items-center w-full" 
          style={{ 
            height: '40px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            padding: '0px',
            width: '100%',
            flexShrink: 0
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
            className="bg-[#045859] hover:bg-[#045859]/90 text-white flex-shrink-0"
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
              color: '#FFFFFF',
              flexShrink: 0
            }}
          >
            بدء الخدمة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

