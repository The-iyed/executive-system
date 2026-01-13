import React from 'react';
import Logomark from '../assets/Logomark.svg';

export interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
        <img 
          src={Logomark} 
          alt="Logo" 
          className=""
        />
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-white leading-tight">
          المنصة الموحدة
        </h1>
        <p className="text-sm text-white/95 leading-tight">
          للمكتب التنفيذي
        </p>
      </div>
    </div>
  );
};
