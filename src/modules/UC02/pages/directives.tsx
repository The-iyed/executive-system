import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, MeetingCardData, ViewType, TableColumn, Pagination, TruncatedWithTooltip, formatDateArabic } from '@/modules/shared';
import { cn } from '@/lib/ui';
import { Icon } from '@iconify/react';
import {
  MoreVertical, CalendarDays, Clock, Hash, ChevronDown,
  FileText, AlertCircle, Loader2, Search, LayoutList, LayoutGrid,
  CircleDot, CheckCircle2, Timer, XCircle, Copy, Check,
} from 'lucide-react';
import { takeDirective, requestMeetingFromDirective } from '../data/meetingsApi';
import { listDirectives, type MinisterDirective } from '@/modules/UC19/api/directivesApi';
import {
  IMPORTANCE_LABELS,
  PRIORITY_LABELS,
  DURATION_UNIT_LABELS,
  SCHEDULING_OFFICER_STATUS_LABELS,
} from '@/modules/shared/types/minister-directive-enums';
import { SchedulerModal } from '@/modules/shared/features/meeting-request-form';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

type TabType = 'current' | 'previous';

/* ═══════════════════════════════════════════════════════ */
/*                  MAIN DIRECTIVES PAGE                  */
/* ═══════════════════════════════════════════════════════ */

const Directives: React.FC = () => {
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Meeting form
  const [meetingFormOpen, setMeetingFormOpen] = useState(false);
  const [schedulerDirective, setSchedulerDirective] = useState<{ directiveId?: string; directiveText?: string }>({});
  const openForm = (directiveId?: string, directiveText?: string) => {
    setMeetingFormOpen(true);
    setSchedulerDirective({ directiveId, directiveText });
  };

  // Dropdown (table actions)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  useEffect(() => { setExpandedId(null); }, [activeTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!openDropdownId) return;
      const dropdown = dropdownRefs.current[openDropdownId];
      const target = event.target as Node;
      if (dropdown && !dropdown.contains(target)) {
        const portalDropdown = document.querySelector('[data-directive-dropdown]');
        if (!portalDropdown || !portalDropdown.contains(target)) {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId) { setOpenDropdownId(null); setDropdownPosition(null); }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openDropdownId]);

  /* ─── API: always directive_type=SCHEDULING, tab controls scheduling_officer_status ─── */
  const schedulingOfficerStatus = activeTab === 'current' ? 'OPEN' : 'CLOSED';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['uc02-scheduling-directives', activeTab, currentPage, debouncedSearch],
    queryFn: () =>
      listDirectives({
        directive_type: 'SCHEDULING',
        scheduling_officer_status: schedulingOfficerStatus,
        skip: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
      }),
  });

  // Counts for both tabs
  const { data: currentCountData } = useQuery({
    queryKey: ['uc02-scheduling-directives-count', 'OPEN'],
    queryFn: () => listDirectives({ directive_type: 'SCHEDULING', scheduling_officer_status: 'OPEN', skip: 0, limit: 1 }),
  });
  const { data: previousCountData } = useQuery({
    queryKey: ['uc02-scheduling-directives-count', 'CLOSED'],
    queryFn: () => listDirectives({ directive_type: 'SCHEDULING', scheduling_officer_status: 'CLOSED', skip: 0, limit: 1 }),
  });

  const directives = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const currentCount = currentCountData?.total ?? 0;
  const previousCount = previousCountData?.total ?? 0;

  /* ─── Helpers ─── */
  const formatDate = (dateString: string | null | undefined): string =>
    dateString ? format(new Date(dateString), 'dd/MM/yyyy') : '-';

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('تم النسخ');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTakeDirective = async (directive: MinisterDirective) => {
    try {
      await takeDirective(directive.id);
      toast.success('تم الأخذ بالتوجيه');
      await refetch();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleRequestMeeting = async (directive: MinisterDirective) => {
    openForm(directive.id, directive.title);
    try {
      await requestMeetingFromDirective(directive.id);
    } catch { /* handled by form */ }
  };

  /* ─── Table columns ─── */
  const tableColumns = useMemo((): TableColumn<MeetingCardData>[] => {
    const pageOffset = (currentPage - 1) * ITEMS_PER_PAGE;
    return [
      {
        id: 'item_number', header: '#', width: 'flex-none min-w-14 w-14', align: 'center',
        render: (_r, i) => <span className="text-sm text-muted-foreground">{i + 1 + pageOffset}</span>,
      },
      {
        id: 'created_at', header: 'التاريخ', width: 'flex-none min-w-28 w-28', align: 'end',
        render: (row) => {
          const d = directives.find((x) => x.id === row.id);
          return <span className="text-sm text-muted-foreground">{formatDate(d?.created_at)}</span>;
        },
      },
      {
        id: 'title', header: 'التوجيه', width: 'min-w-0 flex-[2]', align: 'end',
        render: (row) => <TruncatedWithTooltip title={row.title}>{row.title}</TruncatedWithTooltip>,
      },
      {
        id: 'importance', header: 'الأهمية', width: 'flex-none min-w-24 w-24', align: 'end',
        render: (row) => {
          const d = directives.find((x) => x.id === row.id);
          return <span className="text-sm text-muted-foreground">{d?.importance ? IMPORTANCE_LABELS[d.importance] : '-'}</span>;
        },
      },
      {
        id: 'priority', header: 'الأولوية', width: 'flex-none min-w-24 w-24', align: 'end',
        render: (row) => {
          const d = directives.find((x) => x.id === row.id);
          return <span className="text-sm text-muted-foreground">{d?.priority ? PRIORITY_LABELS[d.priority] : '-'}</span>;
        },
      },
      {
        id: 'status', header: 'الحالة', width: 'flex-none min-w-24 w-24', align: 'end',
        render: (row) => {
          const d = directives.find((x) => x.id === row.id);
          return (
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-md',
              d?.scheduling_officer_status === 'CLOSED'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            )}>
              {d ? SCHEDULING_OFFICER_STATUS_LABELS[d.scheduling_officer_status] : '-'}
            </span>
          );
        },
      },
      {
        id: 'actions', header: '', width: 'flex-none w-12 min-w-12', align: 'center' as const,
        render: (row: MeetingCardData) => (
          <div ref={(el) => { dropdownRefs.current[row.id] = el; }} className="flex justify-center w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenDropdownId(row.id);
                setDropdownPosition({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom });
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted/60 transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ];
  }, [currentPage, directives]);

  /* ─── Card data for DataTable ─── */
  const cardData: MeetingCardData[] = useMemo(
    () => directives.map((d) => ({
      id: d.id,
      title: d.title,
      date: formatDate(d.created_at),
      status: d.scheduling_officer_status as any,
      statusLabel: SCHEDULING_OFFICER_STATUS_LABELS[d.scheduling_officer_status],
    })),
    [directives]
  );

  const isCurrentTab = activeTab === 'current';

  return (
    <>
      <SchedulerModal open={meetingFormOpen} onOpenChange={setMeetingFormOpen} directiveId={schedulerDirective?.directiveId} directiveText={schedulerDirective?.directiveText} />
      <div className="flex flex-col w-full min-h-0" dir="rtl">

        {/* ═══ HEADER ═══ */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-primary/10">
                <Icon icon="solar:document-text-bold" width={22} height={22} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">توجيهات الجدولة</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  إدارة ومتابعة جميع التوجيهات · {currentCount + previousCount} توجيه
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="بحث في التوجيهات..."
                  className="h-10 pr-10 pl-4 rounded-xl bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all w-[260px]"
                />
              </div>

              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setView('cards')}
                  className={cn('p-2.5 transition-colors', view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('table')}
                  className={cn('p-2.5 transition-colors', view === 'table' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60')}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ STATS ═══ */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'إجمالي التوجيهات', value: currentCount + previousCount, icon: FileText, color: 'text-primary', bg: 'bg-primary/5' },
              { label: 'التوجيهات الحالية', value: currentCount, icon: CircleDot, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'التوجيهات المكتملة', value: previousCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ TABS + CONTENT ═══ */}
        <div className="px-6 pb-6 flex-1 min-h-0 flex flex-col">
          <div className="bg-card rounded-3xl border border-border flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm">

            {/* Tab bar */}
            <div className="flex items-center border-b border-border px-1 pt-1">
              {([
                { id: 'current' as TabType, label: 'التوجيهات الحالية', count: currentCount },
                { id: 'previous' as TabType, label: 'التوجيهات السابقة', count: previousCount },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                  className={cn(
                    'relative flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors rounded-t-xl',
                    activeTab === tab.id
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-full',
                      activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto p-5">

              {/* Dropdown Portal */}
              {openDropdownId && dropdownPosition && (() => {
                const pos = dropdownPosition;
                const top = Math.max(8, pos.bottom + 6);
                const right = window.innerWidth - pos.right;
                const directive = directives.find((x) => x.id === openDropdownId);
                return createPortal(
                  <div
                    data-directive-dropdown
                    className="fixed rounded-2xl p-1.5 w-[170px] bg-card border border-border shadow-lg"
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                    style={{ zIndex: 9999, top: `${top}px`, right: `${Math.min(right, window.innerWidth - 180)}px`, left: 'auto' }}
                  >
                    {directive && ([
                      { label: 'الأخذ بالتوجيه', icon: XCircle, className: 'text-amber-600', action: () => handleTakeDirective(directive) },
                      { label: 'طلب إجتماع', icon: CalendarDays, className: 'text-primary', action: () => handleRequestMeeting(directive) },
                    ]).map((item, idx) => (
                      <button
                        key={idx}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await item.action();
                          setOpenDropdownId(null);
                          setDropdownPosition(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-muted/60 text-foreground"
                      >
                        <item.icon className={cn('w-4 h-4 flex-shrink-0', item.className)} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                );
              })()}

              {/* States */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">جاري التحميل...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-destructive/10">
                    <AlertCircle className="w-7 h-7 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive font-medium">حدث خطأ أثناء تحميل البيانات</p>
                </div>
              ) : directives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-muted/60">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">لا توجد توجيهات</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isCurrentTab ? 'لا توجد توجيهات حالية مسجلة' : 'لا توجد توجيهات سابقة مسجلة'}
                    </p>
                  </div>
                </div>
              ) : view === 'table' ? (
                <DataTable columns={tableColumns} data={cardData} rowPadding="py-2" />
              ) : (
                /* ── Cards View ── */
                <div className="flex flex-col gap-3">
                  {directives.map((directive) => {
                    const isExpanded = expandedId === directive.id;
                    const isCopied = copiedId === directive.id;
                    const isUrgent = directive.priority === 'URGENT' || directive.priority === 'VERY_URGENT';
                    const isImportant = directive.importance === 'IMPORTANT' || directive.importance === 'VERY_IMPORTANT';

                    return (
                      <div
                        key={directive.id}
                        className={cn(
                          'rounded-2xl border transition-all duration-200 overflow-hidden',
                          isExpanded
                            ? 'border-primary shadow-md'
                            : 'border-border hover:border-border/80'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : directive.id)}
                          className="w-full text-right bg-card px-5 py-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: isCurrentTab ? 'hsl(var(--primary))' : 'hsl(142 76% 36%)' }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={cn(
                                    'text-[11px] font-bold px-2 py-0.5 rounded-md',
                                    isCurrentTab ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-700'
                                  )}>
                                    {SCHEDULING_OFFICER_STATUS_LABELS[directive.scheduling_officer_status]}
                                  </span>
                                  {isUrgent && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                                      {PRIORITY_LABELS[directive.priority!]}
                                    </span>
                                  )}
                                  {isImportant && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      {IMPORTANCE_LABELS[directive.importance!]}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                                  {directive.title || '—'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Copy */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(directive.title, directive.id); }}
                                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                title="نسخ المحتوى"
                              >
                                {isCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                              </button>

                              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(directive.created_at)}</span>
                              </div>

                              {directive.due_duration_enabled && directive.due_duration_value && (
                                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-[11px] text-muted-foreground">
                                  <Timer className="w-3 h-3" />
                                  <span>{directive.due_duration_value} {DURATION_UNIT_LABELS[directive.due_duration_unit || 'DAY']}</span>
                                </div>
                              )}

                              <ChevronDown className={cn(
                                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )} />
                            </div>
                          </div>
                        </button>

                        {/* Expanded panel */}
                        {isExpanded && (
                          <div className="border-t border-border bg-muted/30 px-5 py-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  تاريخ الإنشاء: <strong className="text-foreground">{formatDate(directive.created_at)}</strong>
                                </span>
                                {directive.importance && (
                                  <span>الأهمية: <strong className="text-foreground">{IMPORTANCE_LABELS[directive.importance]}</strong></span>
                                )}
                                {directive.priority && (
                                  <span>الأولوية: <strong className="text-foreground">{PRIORITY_LABELS[directive.priority]}</strong></span>
                                )}
                                {directive.responsible_user && (
                                  <span>المسؤول: <strong className="text-foreground">{directive.responsible_user}</strong></span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleTakeDirective(directive); setExpandedId(null); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-amber-400 text-amber-600 hover:bg-amber-50 hover:shadow-sm"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  الأخذ بالتوجيه
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRequestMeeting(directive); setExpandedId(null); }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 bg-primary"
                                >
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  طلب إجتماع
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Directives;
