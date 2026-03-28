/**
 * Shared ContentInfoView – card-based layout with compact width.
 * Each section has a header + body card. Tight padding, narrower layout.
 */
import React from 'react';
import { cn } from '@/lib/ui';
import { FileCheck, FileText, ClipboardCheck, Zap, Download, Eye, File } from 'lucide-react';
import type { ContentInfoViewProps, ContentInfoSection, ContentFileItem } from './types';
import pdfIcon from '../../assets/pdf.svg';

/* ─── Section icon config ─── */
const SECTION_CONFIG: Record<string, { icon: React.ElementType }> = {
  presentation: { icon: FileCheck },
  attachment: { icon: FileText },
  summary: { icon: Zap },
  notes: { icon: ClipboardCheck },
};

/* ─── File icon ─── */
function FileIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const ext = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  const nameExt = (fileName ?? '').toLowerCase().split('.').pop() ?? '';
  const isPdf = ext === 'pdf' || ext === 'application/pdf' || nameExt === 'pdf';

  if (isPdf) {
    return <img src={pdfIcon} alt="pdf" className="h-10 w-10 object-contain flex-shrink-0" />;
  }

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/60 flex-shrink-0">
      <File className="h-4.5 w-4.5 text-muted-foreground" strokeWidth={1.5} />
    </div>
  );
}

/* ─── File card ─── */
function FileCard({
  file,
  onView,
  onDownload,
  extraActions,
  showAccent,
}: {
  file: ContentFileItem;
  onView?: () => void;
  onDownload?: () => void;
  extraActions?: React.ReactNode;
  showAccent?: boolean;
}) {
  const sizeLabel = file.file_size >= 1024 * 1024
    ? `${(file.file_size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round((file.file_size || 0) / 1024)} KB`;

  return (
    <div className={cn(
      'group flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200',
      'bg-background hover:shadow-sm',
      showAccent
        ? 'border-primary/20 hover:border-primary/35'
        : 'border-border/70 hover:border-primary/25',
    )}>
      <FileIcon fileType={file.file_type} fileName={file.file_name} />

      <div className="flex flex-col items-end min-w-0 flex-1 gap-0.5">
        <div className="flex items-center gap-2 w-full justify-end flex-wrap">
          {file.badge && (
            <span className="text-[10px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-full flex-shrink-0">
              {file.badge}
            </span>
          )}
          <span className="text-sm font-medium text-foreground truncate">{file.file_name}</span>
        </div>
        <span className="text-xs text-muted-foreground">{sizeLabel}</span>
      </div>

      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {extraActions}
        {onDownload && file.blob_url && (
          <a href={file.blob_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="تحميل">
            <Download className="w-4 h-4" />
          </a>
        )}
        {onView && file.blob_url && (
          <button type="button" onClick={onView} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="معاينة">
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 rounded-xl bg-muted/15 border border-dashed border-border/50">
      <p className="text-sm text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
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
    <section className="rounded-xl border border-border/60 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/20 border-b border-border/40">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
        </div>
        <h3 className="text-[13px] font-bold text-foreground">{section.title}</h3>
      </div>

      {/* Body */}
      <div className="p-4">
        {isEmpty ? (
          <EmptyState
            title={section.emptyTitle ?? 'لا توجد بيانات'}
            description={section.emptyDescription}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {hasFiles && (
              <div className={cn(
                'grid gap-2.5',
                section.fileColumns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1',
              )}>
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    showAccent={isPresentation}
                    onView={onViewFile ? () => onViewFile(file) : undefined}
                    onDownload={onDownloadFile ? () => onDownloadFile(file) : undefined}
                    extraActions={renderFileActions?.(file, section.key)}
                  />
                ))}
              </div>
            )}

            {hasText && (
              <div className="px-3.5 py-3 rounded-lg bg-muted/30 text-right text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {section.text}
              </div>
            )}

            {hasSecondary && (
              <div className={hasText ? 'pt-3 border-t border-border/20' : ''}>
                {section.secondaryLabel && (
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-0.5">{section.secondaryLabel}</p>
                )}
                <div className="px-3.5 py-3 rounded-lg bg-primary/5 text-right text-foreground whitespace-pre-wrap text-sm leading-relaxed">
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
    <div className={cn('w-full flex flex-col gap-4 max-w-3xl mx-auto', className)} dir="rtl">
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
