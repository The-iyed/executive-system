import React from 'react';
import { Card, CardContent } from '@sanad-ai/ui';
import { Button } from '@sanad-ai/ui';
import { LucideIcon } from 'lucide-react';

export interface ServiceCardProps {
  icon: LucideIcon;
  category: string;
  title: string;
  description: string;
  onStart?: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  icon: Icon,
  category,
  title,
  description,
  onStart,
}) => {
  return (
    <Card className="w-full max-w-[302px] shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)] rounded-2xl">
      <CardContent className="p-4 flex flex-col gap-6 items-end">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-[rgba(4,88,89,0.24)] flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#045859]" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 w-full items-end text-right">
          <div className="flex flex-col gap-3 items-start w-full">
            <p className="text-base text-[#6c737f] font-normal">{category}</p>
            <h3 className="text-lg font-bold text-[#1f2a37]">{title}</h3>
          </div>
          <p className="text-base text-[#1f2a37] leading-6">{description}</p>
        </div>

        {/* Action Button */}
        <div className="w-full flex justify-end">
          <Button
            onClick={onStart}
            className="bg-[#045859] hover:bg-[#045859]/90 text-white h-10 px-4 rounded"
          >
            بدء الخدمة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

