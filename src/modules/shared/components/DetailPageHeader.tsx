import React from 'react';
import { ChevronRight, HelpCircle, Pencil } from 'lucide-react';
import { Tabs, type TabItem } from './tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/lib/ui';
import { cn } from '@/lib/ui';

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
  /** Optional secondary action (e.g. "حذف" for draft) – rendered before edit in RTL */
  secondaryAction?: React.ReactNode;
  /** Edit action config – renders the edit/save button inline in the header */
  editAction?: {
    visible: boolean;
    hasChanges: boolean;
    /** When true, button opens full edit form and is always enabled when visible (ignores hasChanges for enabled state) */
    opensForm?: boolean;
    onClick: () => void;
    label?: string;
    tooltip?: string;
  };
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
 * edit button, and a tabs strip. Clean structure and hierarchy for RTL.
 */
export function DetailPageHeader({
  title,
  subtitle,
  onBack,
  statusBadge,
  hasChanges = false,
  primaryAction,
  secondaryAction,
  editAction,
  tabs,
  activeTab,
  onTabChange,
  
  helpTooltip,
  className,
}: DetailPageHeaderProps) {
  const sanitizedTitle = title.replace(/\s*\((?:null|undefined|)\)\s*$/, '').trim();

  return (
    <div
      className={cn(
        'w-full mt-[30px] flex flex-col rounded-2xl bg-white min-w-0 overflow-hidden',
        'border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow duration-300',
        className
      )}
      dir="rtl"
    >
      {/* No top accent bar */}

      <div className="flex flex-col min-w-0">
        {/* Row 1: Back + Title + Status + Actions */}
        <div className="flex flex-row items-center justify-between gap-4 px-6 pt-5 pb-4 min-w-0">
          {/* Right side: back + title + status */}
          <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] text-[#6B7280] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] hover:text-[#374151] hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0"
                aria-label="رجوع"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col min-w-0 flex-1 text-right">
              <div className="flex flex-row items-center gap-2.5 flex-wrap">
                <h1 className="text-[18px] font-bold text-[#101828] leading-tight truncate max-w-full">
                  {sanitizedTitle}
                </h1>
                {statusBadge}
              </div>
              {subtitle && (
                <p className="text-[13px] text-[#667085] leading-snug mt-0.5 truncate max-w-full">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Left side: actions */}
          <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap [&_button]:transition-all [&_button]:duration-200">
            {secondaryAction && <div className="flex-shrink-0">{secondaryAction}</div>}
            {editAction?.visible && (
              <button
                type="button"
                onClick={() => (editAction.opensForm || editAction.hasChanges) && editAction.onClick()}
                disabled={!editAction.opensForm && !editAction.hasChanges}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  (editAction.opensForm || editAction.hasChanges)
                    ? 'bg-gradient-to-r from-[#048F86] via-[#069E95] to-[#0BB5AA] shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]'
                    : 'bg-gradient-to-r from-[#B0B7C3] to-[#CDD3DC]'
                )}
              >
                <Pencil className="w-4 h-4" strokeWidth={2} />
                <span>{editAction.label ?? 'تعديل'}</span>
              </button>
            )}
            {primaryAction && (
              <div className="flex-shrink-0">{primaryAction}</div>
            )}
          </div>
        </div>

        {/* Tabs strip */}
        <div className="flex flex-row items-center gap-3 w-full min-w-0 bg-[#FAFBFC] border-t border-[#EAECF0] px-5 py-0">
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
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-[#98A2B3] hover:bg-white hover:text-[#344054] hover:shadow-sm transition-all flex-shrink-0 border border-transparent hover:border-[#E5E7EB]"
                    aria-label="مساعدة"
                  >
                    <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="max-w-[280px] text-right border border-[#E5E7EB] shadow-lg bg-white"
                >
                  <p className="font-bold text-[#101828] mb-1">{helpTooltip.title}</p>
                  <p className="text-sm text-[#667085]">{helpTooltip.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
