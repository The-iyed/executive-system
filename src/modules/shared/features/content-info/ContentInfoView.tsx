/**
 * Shared ContentInfoView – production-ready read-only content display.
 * Modern, polished UI with subtle depth, refined cards, and proper RTL support.
 * Uses design system tokens throughout.
 */
import React from 'react';
import { cn } from '@/lib/ui';
import { FileCheck, FileText, ClipboardCheck, Download, Eye, Zap } from 'lucide-react';
import type { ContentInfoViewProps, ContentInfoSection, ContentFileItem } from './types';
import pdfIcon from '../../assets/pdf.svg';

/* ─── Section icon config ─── */
const SECTION_CONFIG: Record<string, { icon: React.ElementType; gradient: string }> = {
  presentation: { icon: FileCheck, gradient: 'from-primary/20 to-primary/5' },
  attachment: { icon: FileText, gradient: 'from-primary/15 to-primary/5' },
  summary: { icon: Zap, gradient: 'from-primary/15 to-primary/5' },
  notes: { icon: ClipboardCheck, gradient: 'from-primary/15 to-primary/5' },
};

/* ─── File icon ─── */
function FileIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const ext = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  const nameExt = (fileName ?? '').toLowerCase().split('.').pop() ?? '';
  const isPdf = ext === 'pdf' || ext === 'application/pdf' || nameExt === 'pdf';

  if (isPdf) {
    return (
      <div className="relative flex-shrink-0">
        <img src={pdfIcon} alt="pdf" className="h-11 w-11 object-contain" />
      </div>
    );
  }

  const label = (ext || nameExt || 'FILE').toUpperCase().slice(0, 4);
  return (
    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted border border-border/50 flex-shrink-0">
      <span className="text-[10px] font-bold text-muted-foreground tracking-wide">{label}</span>
    </div>
  );
}

/* ─── File card ─── */
function FileCard({
  file,
  onView,
  onDownload,
  extraActions,
  variant = 'default',
}: {
  file: ContentFileItem;
  onView?: () => void;
  onDownload?: () => void;
  extraActions?: React.ReactNode;
  variant?: 'presentation' | 'default';
}) {
  const isPresentation = variant === 'presentation';

  return (
    <div className={cn(
      'group relative flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-300',
      'bg-background hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]',
      isPresentation
        ? 'border-primary/20 hover:border-primary/40'
        : 'border-border hover:border-primary/25',
    )}>
      {/* Subtle left accent for presentation */}
      {isPresentation && (
        <div className="absolute top-3 bottom-3 right-0 w-[3px] rounded-full bg-gradient-to-b from-primary to-primary/40" />
      )}

      <FileIcon fileType={file.file_type} fileName={file.file_name} />

      <div className="flex flex-col items-end min-w-0 flex-1">
        <div className="flex items-center gap-2 w-full justify-end flex-wrap">
          {file.badge && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full flex-shrink-0 border border-primary/15">
              {file.badge}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground truncate">{file.file_name}</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {file.file_size >= 1024 * 1024
            ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round((file.file_size || 0) / 1024)} KB`}
        </span>
      </div>

      <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {extraActions}
        {onDownload && file.blob_url && (
          <a
            href={file.blob_url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="تحميل"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        {onView && file.blob_url && (
          <button
            type="button"
            onClick={onView}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="معاينة"
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
    <div className="flex flex-col items-center justify-center py-8 px-6 rounded-xl bg-muted/20 border-2 border-dashed border-border/60">
      <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground/70" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>}
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
  const config = SECTION_CONFIG[section.icon] ?? SECTION_CONFIG.attachment;
  const Icon = config.icon;
  const files = section.files ?? [];
  const hasFiles = files.length > 0;
  const hasText = section.text && section.text.trim();
  const hasSecondary = section.secondaryText && section.secondaryText.trim();
  const isEmpty = !hasFiles && !hasText && !hasSecondary;
  const isPresentation = section.key === 'presentation';

  return (
    <section className="rounded-2xl border border-border/70 bg-background overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className={cn(
        'flex items-center gap-3 px-6 py-4',
        'bg-gradient-to-l',
        config.gradient,
      )}>
        <div className="w-10 h-10 rounded-xl bg-background border border-primary/15 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-[15px] font-bold text-foreground leading-tight">{section.title}</h3>
          {hasFiles && (
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {files.length} {files.length === 1 ? 'ملف' : 'ملفات'}
            </span>
          )}
        </div>
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
                    variant={isPresentation ? 'presentation' : 'default'}
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
                  ? 'bg-primary/5 border border-primary/15 text-foreground'
                  : 'bg-muted/40 border border-border/40 text-foreground',
              )}>
                {section.text}
              </div>
            )}

            {/* Secondary text (e.g. content officer notes) */}
            {hasSecondary && (
              <div className={hasText ? 'pt-4 border-t border-border/20' : ''}>
                {section.secondaryLabel && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                      <ClipboardCheck className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{section.secondaryLabel}</span>
                  </div>
                )}
                <div className="w-full px-5 py-4 bg-primary/5 border border-primary/10 rounded-xl text-right text-foreground whitespace-pre-wrap text-sm leading-relaxed">
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
    <div className={cn('w-full flex flex-col gap-5 max-w-4xl mx-auto', className)} dir="rtl">
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
