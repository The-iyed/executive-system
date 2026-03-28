import React from 'react';

interface MeetingListEmptyProps {
  message?: string;
  isSearch?: boolean;
}

function EmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="60" cy="60" r="56" className="fill-muted/40" />
      {/* Folder body */}
      <rect x="28" y="44" width="64" height="44" rx="6" className="fill-background stroke-border" strokeWidth="1.5" />
      {/* Folder tab */}
      <path d="M28 44 L28 38 Q28 34 32 34 L48 34 Q50 34 51 36 L54 40 Q55 42 57 42 L86 42 Q92 42 92 48" className="fill-background stroke-border" strokeWidth="1.5" />
      <rect x="28" y="42" width="64" height="4" className="fill-background" />
      {/* Dashed line inside */}
      <line x1="44" y1="62" x2="76" y2="62" className="stroke-muted-foreground/20" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
      <line x1="50" y1="70" x2="70" y2="70" className="stroke-muted-foreground/15" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
      {/* Decorative dots */}
      <circle cx="22" cy="52" r="2" className="fill-primary/10" />
      <circle cx="100" cy="48" r="2.5" className="fill-primary/8" />
      <circle cx="96" cy="82" r="1.5" className="fill-primary/6" />
    </svg>
  );
}

function SearchEmptyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="56" cy="54" r="48" className="fill-muted/40" />
      {/* Magnifier circle */}
      <circle cx="52" cy="50" r="22" className="fill-background stroke-border" strokeWidth="2" />
      <circle cx="52" cy="50" r="14" className="fill-muted/30 stroke-muted-foreground/10" strokeWidth="1" />
      {/* Handle */}
      <line x1="68" y1="66" x2="86" y2="84" className="stroke-border" strokeWidth="5" strokeLinecap="round" />
      <line x1="68" y1="66" x2="86" y2="84" className="stroke-muted/60" strokeWidth="3" strokeLinecap="round" />
      {/* X mark inside */}
      <line x1="47" y1="45" x2="57" y2="55" className="stroke-muted-foreground/25" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="57" y1="45" x2="47" y2="55" className="stroke-muted-foreground/25" strokeWidth="1.8" strokeLinecap="round" />
      {/* Decorative */}
      <circle cx="82" cy="36" r="2" className="fill-primary/10" />
      <circle cx="28" cy="76" r="1.5" className="fill-primary/8" />
    </svg>
  );
}

export const MeetingListEmpty: React.FC<MeetingListEmptyProps> = ({
  message,
  isSearch = false,
}) => {
  const defaultMessage = isSearch ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد اجتماعات';
  const subtitle = isSearch ? 'حاول تغيير كلمات البحث أو الفلاتر' : 'لم يتم إضافة أي اجتماعات بعد';

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm py-20 w-full text-center">
        <div className="mb-4">
          {isSearch ? <SearchEmptyIllustration /> : <EmptyIllustration />}
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1">
          {message || defaultMessage}
        </h3>
        <p className="text-[13px] text-muted-foreground/60 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};
