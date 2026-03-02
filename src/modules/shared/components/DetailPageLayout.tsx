import React from 'react';
import { cn } from '@/lib/ui';

export interface DetailPageLayoutProps {
  /** Breadcrumb area (e.g. link back + path) */
  breadcrumb?: React.ReactNode;
  /** Title (e.g. request number or entity name) */
  title?: React.ReactNode;
  /** Status badge or other meta */
  statusBadge?: React.ReactNode;
  /** Action buttons bar */
  actionsBar?: React.ReactNode;
  /** Tab list + content (Tabs component + children) */
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared layout for detail pages: breadcrumb, title, status, actions, and content area.
 * Used by meeting detail, guidance detail, content detail, etc.
 */
export function DetailPageLayout({
  breadcrumb,
  title,
  statusBadge,
  actionsBar,
  children,
  className,
}: DetailPageLayoutProps) {
  return (
    <div className={cn('flex flex-col gap-4 w-full', className)} dir="rtl">
      {breadcrumb != null && <div className="w-full">{breadcrumb}</div>}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
          {title != null && <div className="min-w-0">{title}</div>}
          {statusBadge != null && <div className="flex-shrink-0">{statusBadge}</div>}
        </div>
        {actionsBar != null && <div className="w-full">{actionsBar}</div>}
      </div>
      <div className="w-full flex-1 min-h-0">{children}</div>
    </div>
  );
}
