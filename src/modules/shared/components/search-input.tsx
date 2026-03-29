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
            fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
          }}
        />
      </div>
    );
  }

  // Default variant - pill-shaped, white, subtle shadow (like design image)
  return (
    <div
      dir="rtl"
      className={`
        relative flex flex-row items-center
        h-10 pl-4 pr-4 gap-3
        rounded-full
        bg-white
        border-none
        shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)]
        ${className}
      `}
    >
      <img
        src={SearchIcon}
        alt=""
        className="w-5 h-5 flex-shrink-0 opacity-80"
        style={{ filter: 'brightness(0) saturate(100%)' }}
        aria-hidden
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="w-full min-w-0 h-[30px] text-[15px] font-normal bg-transparent border-none outline-none text-right placeholder:text-[#5E6977] text-gray-800"
        style={{
          fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif",
        }}
      />
    </div>
  );
};
