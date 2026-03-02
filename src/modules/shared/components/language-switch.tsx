import React, { useState } from 'react';
import UKFlag from '@/modules/shared/assets/Unitedkingdom.svg';
import SaudiFlag from '@/modules/shared/assets/Saudiarabia.svg';

export interface Language {
  key: 'ar' | 'en';
  icon: string;
  label: string;
}

const languages: Language[] = [
  {
    key: 'en',
    icon: UKFlag,
    label: 'United Kingdom'
  },
  {
    key: 'ar',
    icon: SaudiFlag,
    label: 'Saudi Arabia'
  }
];

export interface LanguageSwitchProps {
  className?: string;
}

export const LanguageSwitch: React.FC<LanguageSwitchProps> = ({ className = '' }) => {
  const [activeLang, setActiveLang] = useState<'ar' | 'en'>('ar');

  return (
    <div 
      className={`
        flex items-center 
        gap-2
        w-[85px] h-[42px] 
        p-[4.234px] 
        rounded-[29.636px] 
        bg-[rgba(255,255,255,0.14)]
        ${className}
      `}
    >
      {languages.map((language) => {
        const isActive = activeLang === language.key;
        return (
          <button
            key={language.key}
            onClick={() => setActiveLang(language.key)}
            className={`
              flex flex-col justify-center items-center overflow-hidden
              w-[35px] h-[35px] p-[10.161px] rounded-[28.789px]
              transition-all duration-300 ease-in-out
              ${isActive 
                ? 'bg-white shadow-[0px_-0.846746px_16.0035px_rgba(0,0,0,0.1)]' 
                : 'bg-[rgba(0,0,0,0.00)] border-[rgba(255,255,255,0.25)] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.2),inset_0_-0.5px_1px_rgba(0,0,0,0.15)]'
              }
            `}
            aria-label={`Switch to ${language.label}`}
            aria-pressed={isActive}
          >
            <img 
              src={language.icon} 
              alt={language.label} 
              className="w-full h-full" 
            />
          </button>
        );
      })}
    </div>
  );
};