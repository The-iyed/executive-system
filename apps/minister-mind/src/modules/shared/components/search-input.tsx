import React, { useState } from 'react';
import SearchIcon from '../assets/search-lg.svg';

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  variant?: 'header' | 'default';
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  className = '', 
  placeholder = 'بحث',
  value: controlledValue,
  onChange,
  variant = 'header'
}) => {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const isHeaderVariant = variant === 'header';
  
  if (isHeaderVariant) {
    return (
      <div 
        className={`
          relative
          flex flex-row justify-end items-center
          h-[42px]
          pt-[10px] pr-[16px] pb-[10px] pl-[16px]
          gap-[10px]
          rounded-[73px]
          bg-[rgba(255,255,255,0.08)]
          ${className}
        `}
        style={{
          width: className.includes('w-') ? undefined : '191px',
        }}
      >
        {/* Cutted border effect - only for header variant */}
        <div
          className="absolute inset-0 rounded-[73px] pointer-events-none"
          style={{
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderBottom: 'none',
            clipPath: 'polygon(0 0, 131px 0, 31px 100%, 0 100%, 0 0, 190px 0, 241px 0, 321px 100%, -170px 100%, 196px 0)',
            boxShadow: '0 -1px 2px rgba(255, 255, 255, 0.15)',
          }}
        />
        <img 
          src={SearchIcon} 
          alt="Search" 
          className="w-5 h-5"
        />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="w-full h-6 text-base font-normal bg-transparent border-none outline-none text-white placeholder:text-white"
          style={{
            fontFamily: "'Ping AR + LT', sans-serif",
          }}
        />
      </div>
    );
  }

  // Default variant - smaller size
  return (
    <div 
      className={`
        relative
        flex flex-row justify-end items-center
        h-[32px]
        px-3 py-1.5
        gap-1.5
        rounded-lg
        bg-white
        border border-[#D0D5DD]
        shadow-[0px_1px_2px_rgba(16,24,40,0.05)]
        ${className}
      `}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full h-4 text-sm font-normal bg-transparent border-none outline-none text-gray-900 placeholder:text-[#667085]"
        style={{
          fontFamily: "'Ping AR + LT', sans-serif",
        }}
      />
      <img 
        src={SearchIcon} 
        alt="Search" 
        className="w-4 h-4 flex-shrink-0"
        style={{
          filter: 'opacity(0.7)',
        }}
      />
    </div>
  );
};
