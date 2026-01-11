import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@sanad-ai/ui';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'البحث هنا',
}) => {
  return (
    <div className="w-full sm:w-[396px] h-10 flex-shrink-0" dir="rtl" style={{ fontFamily: 'Frutiger LT Arabic, sans-serif', minWidth: 0 }}>
      <div className="relative w-full h-full">
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded border border-[#9DA4AE] bg-white pr-8 pl-4",
            "text-right placeholder:text-[#6C737F]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "box-border"
          )}
          style={{ 
            fontSize: '16px', 
            lineHeight: '24px',
            borderRadius: '4px',
            textAlign: 'right',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            minWidth: 0
          }}
          dir="rtl"
        />
        {/* Leading Icon - 20px x 20px, color #161616 - positioned on the right in RTL */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex-shrink-0">
          <Search className="w-5 h-5 text-[#161616]" />
        </div>
      </div>
    </div>
  );
};

