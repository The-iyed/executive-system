/**
 * Shared ContentInfoView – minimal, label-based layout.
 * Each section is a simple label + content underneath. No heavy card wrappers.
 */
import React from 'react';
import { cn } from '@/lib/ui';
import { FileCheck, FileText, ClipboardCheck, Zap, Download, Eye, File } from 'lucide-react';
import type { ContentInfoViewProps, ContentInfoSection, ContentFileItem } from './types';
import pdfIcon from '../../assets/pdf.svg';

/* ─── Section icon map ─── */
const SECTION_ICONS: Record<string, React.ElementType> = {
  presentation: FileCheck,
  attachment: FileText,
  summary: Zap,
  notes: ClipboardCheck,
};

/* ─── File icon ─── */
function FileIcon({ fileType, fileName }: { fileType?: string; fileName?: string }) {
  const ext = (fileType ?? '').toLowerCase().replace(/^\./, '').trim();
  const nameExt = (fileName ?? '').toLowerCase().split('.').pop() ?? '';
  const isPdf = ext === 'pdf' || ext === 'application/pdf' || nameExt === 'pdf';

  if (isPdf) {
    return <img src={pdfIcon} alt="pdf" className="h-11 w-11 object-contain flex-shrink-0" />;
  }

  return (
    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-muted/60 flex-shrink-0">
      <File className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
    </div>
  );
}

/* ─── File row ─── */
function FileRow({
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
      'group flex items-center gap-4 py-3.5 px-4 rounded-xl transition-all duration-200',
      'hover:bg-muted/40',
      showAccent && 'border-r-[3px] border-r-primary',
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
          <a href={file.blob_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="تحميل">
            <Download className="w-4 h-4" />
          </a>
        )}
        {onView && file.blob_url && (
          <button type="button" onClick={onView} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="معاينة">
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Empty inline ─── */
function EmptyInline({ text }: { text: string }) {
  return (
    <p className="text-sm text-muted-foreground py-3 px-1">{text}</p>
  );
}

/* ─── Section ─── */
function Section({
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
  const Icon = SECTION_ICONS[section.icon] ?? FileText;
  const files = section.files ?? [];
  const hasFiles = files.length > 0;
  const hasText = section.text && section.text.trim();
  const hasSecondary = section.secondaryText && section.secondaryText.trim();
  const isEmpty = !hasFiles && !hasText && !hasSecondary;
  const isPresentation = section.key === 'presentation';

  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-primary" strokeWidth={1.8} />
        </div>
        <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
      </div>

      {/* Content */}
      {isEmpty ? (
        <EmptyInline text={section.emptyTitle ?? 'لا توجد بيانات'} />
      ) : (
        <div className="flex flex-col gap-1">
          {/* Files */}
          {hasFiles && (
            <div className={cn(
              'flex flex-col gap-1',
              section.fileColumns === 2 && 'sm:grid sm:grid-cols-2',
            )}>
              {files.map((file) => (
                <FileRow
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

          {/* Text */}
          {hasText && (
            <div className={cn(
              'px-4 py-3 rounded-lg text-right text-sm leading-relaxed whitespace-pre-wrap',
              'bg-muted/30 text-foreground',
            )}>
              {section.text}
            </div>
          )}

          {/* Secondary text */}
          {hasSecondary && (
            <div className="flex flex-col gap-1.5 mt-1">
              {section.secondaryLabel && (
                <p className="text-xs font-semibold text-muted-foreground px-1">{section.secondaryLabel}</p>
              )}
              <div className="px-4 py-3 rounded-lg bg-primary/5 text-right text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                {section.secondaryText}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
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
    <div className={cn('w-full flex flex-col gap-6 max-w-4xl mx-auto divide-y divide-border/40', className)} dir="rtl">
      {data.sections.map((section, idx) => (
        <div key={section.key} className={idx > 0 ? 'pt-6' : ''}>
          <Section
            section={section}
            onViewFile={onViewFile}
            onDownloadFile={onDownloadFile}
            renderFileActions={renderFileActions}
          />
        </div>
      ))}
    </div>
  );
}
