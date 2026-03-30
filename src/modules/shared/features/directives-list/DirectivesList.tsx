/**
 * Shared Directives List feature.
 * Renders header, tabs (type or status), cards, skeleton, empty/error states, pagination.
 */
import React from 'react';
import { ScrollText, FileText } from 'lucide-react';
import { cn } from '@/lib/ui';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import type { DirectiveType, DirectiveStatus } from '@/modules/shared/types/minister-directive-enums';
import { DirectiveCard, type DirectiveCardAction } from './DirectiveCard';
import { Pagination } from '@/modules/shared/components/pagination';

/* ── Tab types ── */

/** `ALL` = no `directive_type` filter (list every type). */
export type TypeTabValue = DirectiveType | 'ALL';

export interface TypeTab {
  value: TypeTabValue;
  label: string;
}

export interface StatusTab {
  value: DirectiveStatus;
  label: string;
}

/* ── Props ── */

export interface DirectivesListProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle?: string;
  /** Total count shown in subtitle */
  total: number;

  /** Tab mode */
  tabMode: 'type' | 'status';
  /** Type tabs (for tabMode='type') */
  typeTabs?: TypeTab[];
  activeType?: DirectiveType | undefined;
  onTypeChange?: (type: DirectiveType | undefined) => void;
  /** Status tabs (for tabMode='status') */
  statusTabs?: StatusTab[];
  activeStatus?: DirectiveStatus;
  onStatusChange?: (status: DirectiveStatus) => void;
  /** Count badges per status tab */
  statusCounts?: Record<string, number>;

  /** Data */
  directives: MinisterDirective[];
  isLoading: boolean;
  error: unknown;

  /** Pagination */
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  /** Card config */
  statusField?: 'status' | 'scheduling_officer_status';
  actions?: DirectiveCardAction[];

  /** Optional header right slot (e.g. create button) */
  headerRight?: React.ReactNode;

  className?: string;
}

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border/20 bg-card p-5">
      <div className="flex gap-3">
        <div className="size-9 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/4 rounded bg-muted" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-14 rounded bg-muted" />
            <div className="h-5 w-12 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Component ── */
export function DirectivesList({
  title,
  subtitle,
  total,
  tabMode,
  typeTabs,
  activeType,
  onTypeChange,
  statusTabs,
  activeStatus,
  onStatusChange,
  statusCounts,
  directives,
  isLoading,
  error,
  currentPage,
  totalPages,
  onPageChange,
  statusField = 'scheduling_officer_status',
  actions,
  headerRight,
  className,
}: DirectivesListProps) {
  return (
    <div className={cn('space-y-5 px-4 sm:px-6 py-5', className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ScrollText className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {subtitle || 'إدارة ومتابعة التوجيهات الوزارية'} · {total} توجيه
            </p>
          </div>
        </div>
        {headerRight}
      </div>

      {/* White card wrapping tabs + list */}
      <div className="rounded-2xl border border-border/30 bg-card shadow-sm overflow-hidden">
        {/* Tabs bar */}
        <div className="flex items-center gap-1 px-5 pt-4 pb-0">
          {tabMode === 'type' && typeTabs?.map((tab) => {
            const isAllTab = tab.value === 'ALL';
            const isActive = isAllTab ? activeType === undefined : activeType === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  onTypeChange?.(isAllTab ? undefined : (tab.value as DirectiveType))
                }
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium transition-all rounded-t-lg',
                  isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-[2.5px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}

          {tabMode === 'status' && statusTabs?.map((tab) => {
            const count = statusCounts?.[tab.value] ?? 0;
            const isActive = activeStatus === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => onStatusChange?.(tab.value)}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium transition-all rounded-t-lg',
                  isActive ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'flex items-center justify-center size-6 rounded-full text-[11px] font-bold',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-[2.5px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border/30" />

        {/* List */}
        <div className="divide-y divide-border/20">
          {isLoading ? (
            <div className="p-4 space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm text-destructive font-medium">حدث خطأ أثناء تحميل البيانات</p>
            </div>
          ) : directives.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 mb-4">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <p className="text-[14px] font-medium text-foreground mb-1">لا توجد توجيهات</p>
              <p className="text-[12px] text-muted-foreground">ستظهر التوجيهات هنا عند إنشائها</p>
            </div>
          ) : (
            directives.map((d) => (
              <DirectiveCard
                key={d.id}
                directive={d}
                statusField={statusField}
                actions={actions}
              />
            ))
          )}
        </div>

        {/* Pagination inside card */}
        {totalPages > 1 && (
          <div className="border-t border-border/20 px-5 py-3">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
          </div>
        )}
      </div>
    </div>
  );
}
