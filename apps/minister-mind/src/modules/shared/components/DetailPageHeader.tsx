import React from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';
import { Tabs, type TabItem } from './tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@sanad-ai/ui';
import { cn } from '@sanad-ai/ui';

export interface DetailPageHeaderProps {
  /** Page title (e.g. "مراجعة طلب الاجتماع (123)") */
  title: string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Back navigation handler */
  onBack?: () => void;
  /** Status badge element (e.g. <StatusBadge ... />) */
  statusBadge: React.ReactNode;
  /** Show "تغييرات غير محفوظة" badge when true */
  hasChanges?: boolean;
  /** Primary action button (e.g. "تقييم جاهزية الاجتماع") – rendered at start in RTL */
  primaryAction?: React.ReactNode;
  /** Tab items for the tabs row */
  tabs: TabItem[];
  /** Currently active tab id */
  activeTab: string;
  /** Tab change handler */
  onTabChange: (tabId: string) => void;
  /** Optional help tooltip next to tabs */
  helpTooltip?: { title: string; description: string };
  /** Optional class for the root card */
  className?: string;
}

/**
 * Shared detail page header: back, title, subtitle, status, primary action,
 * and a tabs strip. Clean structure and hierarchy for RTL.
 */
export function DetailPageHeader({
  title,
  subtitle,
  onBack,
  statusBadge,
  hasChanges = false,
  primaryAction,
  tabs,
  activeTab,
  onTabChange,
  helpTooltip,
  className,
}: DetailPageHeaderProps) {
  return (
    <div
      className={cn(
        'w-full mt-[30px] flex flex-col rounded-2xl bg-white min-w-0 overflow-hidden',
        'border border-[#E5E7EB] shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className
      )}
      dir="rtl"
    >
      {/* Top accent */}
      <div
        className="h-0.5 w-full flex-shrink-0"
      />

      <div className="flex flex-col min-w-0">
        {/* Row 1: Back + Title + Subtitle + (optional) unsaved badge */}
        <div className="flex flex-row items-center justify-between gap-4 px-5 pt-5 pb-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] hover:text-[#374151] transition-colors flex-shrink-0 mt-0.5"
              aria-label="رجوع"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col min-w-0 flex-1 text-right">
            <div className="flex flex-row items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-[#111827] leading-tight truncate max-w-full">
                {title}
              </h1>
              
            {statusBadge}
            {hasChanges && (
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium text-white flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #048F86 50%, #22D3D3 100%)',
                    boxShadow: '0 1px 2px rgba(4, 143, 134, 0.25)',
                  }}
                >
                  تغييرات غير محفوظة
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#6B7280] leading-snug mt-0.5 truncate max-w-full">
                {subtitle}
              </p>
            )}
          </div>
          {primaryAction && (
            <div className="flex-shrink-0">{primaryAction}</div>
          )}
         
        </div>

        {/* Row 2: Status + Primary action (aligned end in RTL) */}
        <div className="flex flex-row items-center justify-between gap-4 px-5 pb-4 min-w-0">
        
          <div className="flex flex-row items-center gap-3 flex-wrap min-w-0">
          </div>
         
        </div>

        {/* Tabs strip: full width, light bg, clear separation */}
        <div className="flex flex-row items-center gap-3 w-full min-w-0 bg-[#F9FAFB] border-t border-[#E5E7EB] px-4 py-3">
          <div className="flex-1 flex justify-center min-w-0 overflow-x-auto">
            <Tabs
              items={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              variant="underline"
              className="gap-1 sm:gap-2.5"
            />
          </div>
          {helpTooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-[#6B7280] hover:bg-white hover:text-[#111827] hover:shadow-sm transition-all flex-shrink-0 border border-transparent hover:border-[#E5E7EB]"
                    aria-label="مساعدة"
                  >
                    <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-[280px] text-right border border-[#E5E7EB] shadow-lg bg-white"
                >
                  <p className="font-semibold text-[#111827] mb-1">{helpTooltip.title}</p>
                  <p className="text-sm text-[#6B7280]">{helpTooltip.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
