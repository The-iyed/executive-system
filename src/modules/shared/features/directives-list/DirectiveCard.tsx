import { useState } from 'react';
import {
  Clock, CheckCircle2, FileText, Volume2, AlertTriangle,
  Zap, Copy, Check, Calendar, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/ui';
import type { MinisterDirective } from '@/modules/shared/api/directives';
import {
  DIRECTIVE_TYPE_LABELS,
  IMPORTANCE_LABELS,
  PRIORITY_LABELS,
  DURATION_UNIT_LABELS,
  DIRECTIVE_STATUS_LABELS,
  SCHEDULING_OFFICER_STATUS_LABELS,
} from '@/modules/shared/types/minister-directive-enums';
import { formatDateArabic } from '@/modules/shared/utils/format';
import { VoicePlayer } from './VoicePlayer';

export interface DirectiveCardAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
  onClick: (directive: MinisterDirective) => void;
  hidden?: (directive: MinisterDirective) => boolean;
}

interface DirectiveCardProps {
  directive: MinisterDirective;
  statusField?: 'status' | 'scheduling_officer_status';
  actions?: DirectiveCardAction[];
}

const STATUS_BADGE: Record<string, { color: string; dot: string; label: string }> = {
  TAKEN: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: DIRECTIVE_STATUS_LABELS.TAKEN },
  ADOPTED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: DIRECTIVE_STATUS_LABELS.ADOPTED },
  OPEN: { color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: SCHEDULING_OFFICER_STATUS_LABELS.OPEN },
  CLOSED: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: SCHEDULING_OFFICER_STATUS_LABELS.CLOSED },
};

export function DirectiveCard({ directive, statusField = 'scheduling_officer_status', actions }: DirectiveCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const statusValue = statusField === 'status' ? directive.status : directive.scheduling_officer_status;
  const badge = STATUS_BADGE[statusValue] || STATUS_BADGE.OPEN;
  const isCompleted = statusValue === 'CLOSED' || statusValue === 'ADOPTED';
  const hasVoice = !!directive.voice_play_url;
  const isUrgent = directive.priority === 'URGENT' || directive.priority === 'VERY_URGENT';
  const isImportant = directive.importance === 'IMPORTANT' || directive.importance === 'VERY_IMPORTANT';

  const visibleActions = actions?.filter((a) => !a.hidden?.(directive)) || [];
  const hasExpandableContent = visibleActions.length > 0 || hasVoice;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(directive.title);
    setCopied(true);
    toast.success('تم النسخ');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        'group px-5 py-3.5 transition-colors cursor-pointer select-none',
        expanded ? 'bg-muted/30' : 'hover:bg-muted/20',
      )}
      onClick={() => hasExpandableContent && setExpanded((v) => !v)}
    >
      {/* Row 1: Split layout — title right, metadata left */}
      <div className="flex items-center justify-between gap-3">
        {/* Right group: icon + title + copy */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full',
            isCompleted ? 'text-emerald-500' : 'text-muted-foreground',
          )}>
            {isCompleted ? <CheckCircle2 className="size-[18px]" /> : <Clock className="size-[18px]" />}
          </div>

          <h3 className={cn(
            'min-w-0 text-[13px] font-bold text-foreground leading-normal',
            expanded ? 'whitespace-normal' : 'truncate',
          )}>
            {directive.title}
          </h3>
        </div>

        {/* Left group: tags + date + badge + chevron */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 shrink-0 rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-all"
            title="نسخ المحتوى"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            نسخ
          </button>
          {directive.directive_type && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <FileText className="size-3" />
              {DIRECTIVE_TYPE_LABELS[directive.directive_type] || directive.directive_type}
            </span>
          )}
          {isImportant && (
            <span className="inline-flex items-center gap-1 rounded-md bg-orange-50/80 border border-orange-200/50 px-2 py-0.5 text-[10px] font-semibold text-orange-500">
              <Zap className="size-3" />
              {IMPORTANCE_LABELS[directive.importance!]}
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50/80 border border-rose-200/50 px-2 py-0.5 text-[10px] font-semibold text-rose-500">
              <AlertTriangle className="size-3" />
              {PRIORITY_LABELS[directive.priority!]}
            </span>
          )}
          {directive.due_duration_enabled && directive.due_duration_value && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Clock className="size-3" />
              {directive.due_duration_value} {DURATION_UNIT_LABELS[directive.due_duration_unit || 'DAY']}
            </span>
          )}
          {hasVoice && (
            <span className="inline-flex items-center gap-1 rounded-md bg-sky-50/80 border border-sky-200/50 px-2 py-0.5 text-[10px] text-sky-500 font-medium">
              <Volume2 className="size-3" />
              صوتي
            </span>
          )}

          <span className="flex items-center gap-1 shrink-0 text-[11px] text-muted-foreground whitespace-nowrap">
            <Calendar className="size-3" />
            {formatDateArabic(directive.created_at)}
          </span>

          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap shrink-0',
            badge.color,
          )}>
            {badge.label}
            <span className={cn('size-1.5 rounded-full', badge.dot)} />
          </span>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 shrink-0 rounded-md bg-muted/50 border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-all"
            title="نسخ المحتوى"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            نسخ
          </button>

          {hasExpandableContent && (
            <ChevronDown className={cn(
              'size-4 shrink-0 text-muted-foreground/50 transition-transform duration-200',
              expanded && 'rotate-180',
            )} />
          )}
        </div>
      </div>

      {/* Row 2: Expandable — actions + voice, aligned left */}
      {hasExpandableContent && (
        <div className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          expanded ? 'max-h-40 opacity-100 mt-2.5' : 'max-h-0 opacity-0',
        )}>
          <div className="flex justify-end items-center gap-1.5 flex-wrap">
            {visibleActions.map((action) => (
              <button
                key={action.id}
                onClick={(e) => { e.stopPropagation(); action.onClick(directive); }}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  action.className,
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {hasVoice && (
            <div className="mt-2 flex justify-end">
              <div className="max-w-sm rounded-lg bg-muted/30 px-3 py-2">
                <VoicePlayer url={directive.voice_play_url!} compact />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
