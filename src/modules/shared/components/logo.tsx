import React from 'react';
import LogomarkSvg from '@/modules/shared/assets/Logomark.svg';

export interface LogoProps {
  className?: string;
  /** When 'column', logo and text stack vertically (e.g. for onboarding). */
  variant?: 'row' | 'column';
}

export const Logo: React.FC<LogoProps> = ({ variant = 'row' }) => {
  return (
    <div className={`flex items-center gap-3 flex-shrink-0 ${variant === 'column' ? 'flex-col' : ''}`}>
     <img
       src={LogomarkSvg}
       alt=""
       className="w-[40px] h-[40px] flex-shrink-0"
       width={40}
       height={40}
     />
     <div className={`flex flex-col ${variant === 'column' ? 'items-center text-center' : 'items-start'}`}>
       <h1 className="text-lg font-bold text-gray-800 leading-tight">
         المنصة الموحدة
       </h1>
       <p className="text-sm text-gray-500 leading-tight">
       للشؤون التنفيذية بمكتب معالي الوزير
       </p>
     </div>
    </div>
  );
};
