import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

export interface FormSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  error?: boolean;
  className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onValueChange,
  placeholder = '-------',
  options,
  error,
  className,
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          'text-right',
          'flex-row-reverse',
          'justify-between',
          'focus:outline-none focus:border-[#008774]',
          error && 'border-[#D13C3C]',
          !error && 'focus:border-[#008774]',
          className
        )}
        style={{
          width: '534.5px',
          height: '44px',
          padding: '10px 14px',
          background: '#FFFFFF',
          border: error ? '1px solid #D13C3C' : '1px solid #D0D5DD',
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
          borderRadius: '8px',
          fontStyle: 'normal',
          fontWeight: 400,
          fontSize: '16px',
          lineHeight: '24px',
          color: value ? '#344054' : '#667085',
        }}
      >
        <SelectValue 
          placeholder={placeholder} 
          className="text-right"
          style={{
            fontStyle: 'normal',
            fontWeight: 400,
            fontSize: '16px',
            color: '#667085',
          }}
        />
      </SelectTrigger>
      <SelectContent className="text-right">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-right"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
