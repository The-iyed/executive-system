import React from 'react';

export interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = () => {
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
     <img
       src="/assets/Logomark.png"
       alt=""
       className="w-[40px] h-[40px] flex-shrink-0"
       width={40}
       height={40}
     />
     <div className="flex flex-col items-start">
       <h1 className="text-lg font-bold text-gray-800 leading-tight">
         المنصة الموحدة
       </h1>
       <p className="text-sm text-gray-500 leading-tight">
         للمكتب التنفيذي
       </p>
     </div>
    </div>
  );
};