import React, { useState } from 'react';
import SearchIcon from '../assets/search-lg.svg';

export interface SearchInputProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  className = '', 
  placeholder = 'بحث',
  value: controlledValue,
  onChange 
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

  return (
    <div 
      className={`
        relative
        flex flex-row justify-end items-center
        w-[191px] h-[42px]
        pt-[10px] pr-[16px] pb-[10px] pl-[16px]
        gap-[10px]
        rounded-[73px]
        bg-[rgba(255,255,255,0.08)]
        ${className}
      `}
    >
      {/* Cutted border effect - shows top and rounded ends, hides bottom straight edge */}
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
        className="w-full h-6 text-base font-normal text-white bg-transparent border-none outline-none placeholder:text-white"
      />
    </div>
  );
};
