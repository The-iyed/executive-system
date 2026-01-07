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
    <div className="w-full max-w-[396px]">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "flex h-10 w-full rounded border border-[#9da4ae] bg-white px-4 pr-8 text-base",
            "text-right placeholder:text-[#6c737f]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          dir="rtl"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-[#161616] rotate-180" />
        </div>
      </div>
    </div>
  );
};

