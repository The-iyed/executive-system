/**
 * Shared ContentInfoView – production-ready read-only content display.
 * Renders file sections (presentation, optional, executive summary) and text sections (notes).
 * Clean, modern RTL layout following the same design system as MeetingInfoView.
 */
import React from 'react';
import { cn } from '@/lib/ui';
import { FileCheck, FileText, ClipboardCheck, Download, Eye } from 'lucide-react';
import type { ContentInfoViewProps, ContentInfoSection, ContentFileItem } from './types';
import pdfIcon from '../../assets/pdf.svg';

/* ─── Icon map ─── */
const SECTION_ICONS = {
  presentation: FileCheck,
  attachment: FileText,
  summary: FileText,
  notes: ClipboardCheck,
} as const;

/* ─── File icon component ─── */
function FileIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const ext = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  const nameExt = (fileName ?? '').toLowerCase().split('.').pop() ?? '';
  const isPdf = ext === 'pdf' || ext === 'application/pdf' || nameExt === 'pdf';

  if (isPdf) {
    return <img src={pdfIcon} alt="pdf" className="h-10 w-10 object-contain flex-shrink-0" />;
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted flex-shrink-0">
      <FileText className="h-5 w-5 text-destructive" />
    </div>
  );
}

/* ─── File card ─── */
function FileCard({
  file,
  onView,
  onDownload,
  extraActions,
}: {
  file: ContentFileItem;
  onView?: () => void;
  onDownload?: () => void;
  extraActions?: React.ReactNode;
}) {
  return (
    <div className="group flex items-center gap-3 px-4 py-3.5 bg-background border border-border rounded-xl hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <FileIcon fileType={file.file_type} fileName={file.file_name} />

      <div className="flex flex-col items-end min-w-0 flex-1">
        <div className="flex items-center gap-2 w-full justify-end flex-wrap">
          {file.badge && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
              {file.badge}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground truncate">{file.file_name}</span>
        </div>
        <span className="text-xs text-muted-foreground mt-0.5">
          {Math.round((file.file_size || 0) / 1024)} KB
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {extraActions}
        {onDownload && file.blob_url && (
          <a
            href={file.blob_url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        {onView && file.blob_url && (
          <button
            type="button"
            onClick={onView}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 py-5 px-5 rounded-xl bg-muted/30 border-2 border-dashed border-border">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.2} />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

/* ─── Section wrapper ─── */
function SectionCard({
  section,
  onViewFile,
  onDownloadFile,
  renderFileActions,
}: {
  section: ContentInfoSection;
  onViewFile?: (file: ContentFileItem) => void;
  onDownloadFile?: (file: ContentFileItem) => void;
  renderFileActions?: (file: ContentFileItem, sectionKey: string) => React.ReactNode;
}) {
  const Icon = SECTION_ICONS[section.icon];
  const files = section.files ?? [];
  const hasFiles = files.length > 0;
  const hasText = section.text && section.text.trim();
  const hasSecondary = section.secondaryText && section.secondaryText.trim();
  const isEmpty = !hasFiles && !hasText && !hasSecondary;

  return (
    <section className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-muted/30">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
        </div>
        <h3 className="text-[15px] font-bold text-foreground">{section.title}</h3>
      </div>

      {/* Body */}
      <div className="p-6">
        {isEmpty ? (
          <EmptyState
            icon={Icon}
            title={section.emptyTitle ?? 'لا توجد بيانات'}
            description={section.emptyDescription}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Files */}
            {hasFiles && (
              <div className={cn(
                'grid gap-3',
                section.fileColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
              )}>
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onView={onViewFile ? () => onViewFile(file) : undefined}
                    onDownload={onDownloadFile ? () => onDownloadFile(file) : undefined}
                    extraActions={renderFileActions?.(file, section.key)}
                  />
                ))}
              </div>
            )}

            {/* Text content */}
            {hasText && (
              <div className={cn(
                'w-full px-5 py-4 rounded-xl text-right text-sm leading-relaxed whitespace-pre-wrap',
                section.key === 'executive-summary'
                  ? 'bg-[hsl(var(--warning-bg,48,96%,89%)/0.5)] border border-[hsl(var(--warning-border,48,96%,89%)/0.4)] text-foreground'
                  : 'bg-muted/40 border border-border/40 text-foreground',
              )}>
                {section.text}
              </div>
            )}

            {/* Secondary text (e.g. content officer notes) */}
            {hasSecondary && (
              <div className={hasText ? 'pt-4 border-t border-border/30' : ''}>
                {section.secondaryLabel && (
                  <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
                      <ClipboardCheck className="w-3.5 h-3.5 text-accent-foreground" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold text-accent-foreground">{section.secondaryLabel}</span>
                  </div>
                )}
                <div className="w-full px-5 py-4 bg-amber-50/60 border border-amber-200/40 rounded-xl text-right text-amber-900 whitespace-pre-wrap text-sm leading-relaxed">
                  {section.secondaryText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Main view ─── */
export function ContentInfoView({
  data,
  className,
  onViewFile,
  onDownloadFile,
  renderFileActions,
}: ContentInfoViewProps) {
  return (
    <div className={cn('w-full flex flex-col gap-6 max-w-4xl mx-auto', className)} dir="rtl">
      {data.sections.map((section) => (
        <SectionCard
          key={section.key}
          section={section}
          onViewFile={onViewFile}
          onDownloadFile={onDownloadFile}
          renderFileActions={renderFileActions}
        />
      ))}
    </div>
  );
}
