import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, MeetingCardData, ViewType, TableColumn, Pagination, TruncatedWithTooltip, formatDateArabic } from '@/modules/shared';
import { MeetingClassification, MeetingClassificationLabels, MeetingTypeLabels } from '@/modules/shared';
import { cn } from '@/lib/ui';
import { Icon } from '@iconify/react';
import {
  MoreVertical, CalendarDays, Clock, Hash, ChevronDown,
  FileText, AlertCircle, Loader2, Search, LayoutList, LayoutGrid,
  Plus, CircleDot, CheckCircle2, XCircle, Timer
} from 'lucide-react';
import { getDirectives, getPreviousDirectives, Directive, PreviousDirectiveItem, takeDirective, requestMeetingFromDirective, getMeetingById, MeetingApiResponse } from '../data/meetingsApi';
import { mapDirectiveToCardData, mapPreviousDirectiveToCardData } from '../utils/directiveMapper';
import { PATH } from '../routes/paths';
import '@/modules/shared/styles';
import { useMeetingFormDrawer } from '../features/MeetingForm/hooks';
import { MeetingFormDrawer } from '../features/MeetingForm/components/MeetingFormDrawer';

const ITEMS_PER_PAGE = 10;

/* ═══════════════════════════════════════════════════════ */
/*                  MAIN DIRECTIVES PAGE                  */
/* ═══════════════════════════════════════════════════════ */

const Directives: React.FC = () => {
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  useEffect(() => { setExpandedId(null); }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdown = dropdownRefs.current[openDropdownId];
        const target = event.target as Node;
        if (dropdown && !dropdown.contains(target)) {
          const portalDropdown = document.querySelector('[data-directive-dropdown]');
          if (!portalDropdown || !portalDropdown.contains(target)) {
            setOpenDropdownId(null); setDropdownPosition(null);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    const handleScroll = () => { if (openDropdownId) { setOpenDropdownId(null); setDropdownPosition(null); } };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openDropdownId]);

  /* ─── Data ─── */
  const { data: directivesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['directives', 'current', debouncedSearch],
    queryFn: () => getDirectives({ skip: 0, limit: 100, search: debouncedSearch.trim() || undefined }),
    enabled: activeTab === 'current',
  });

  const allOriginalDirectives: Directive[] = directivesResponse?.items || [];
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: previousDirectivesResponse, isLoading: isLoadingPrevious, error: errorPrevious, refetch: refetchPrevious } = useQuery({
    queryKey: ['directives-previous', 0, 100, debouncedSearch],
    queryFn: () => getPreviousDirectives({ skip: 0, limit: 100, search: debouncedSearch.trim() || undefined }),
    enabled: activeTab === 'previous',
  });

  const originalPreviousDirectives: PreviousDirectiveItem[] = previousDirectivesResponse?.items || [];
  const previousDirectives: MeetingCardData[] = useMemo(() => {
    if (!previousDirectivesResponse?.items) return [];
    return previousDirectivesResponse.items.map(mapPreviousDirectiveToCardData);
  }, [previousDirectivesResponse]);

  const allDirectivesFiltered: MeetingCardData[] = useMemo(() => {
    if (!directivesResponse?.items) return [];
    return directivesResponse.items.map(mapDirectiveToCardData);
  }, [directivesResponse]);

  const totalItems = allDirectivesFiltered.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const directives: MeetingCardData[] = useMemo(
    () => allDirectivesFiltered.slice(skip, skip + ITEMS_PER_PAGE),
    [allDirectivesFiltered, skip]
  );

  const originalDirectives: Directive[] = useMemo(
    () => directives.map((d) => allOriginalDirectives.find((o) => o.id === d.id)).filter((o): o is Directive => o != null),
    [allOriginalDirectives, directives]
  );

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const meetingIds = useMemo(() => {
    return originalDirectives
      .filter((d) => d.meeting_id && UUID_REGEX.test(d.meeting_id))
      .map((d) => d.meeting_id!)
      .filter((id, i, self) => self.indexOf(id) === i);
  }, [originalDirectives]);

  const { data: meetingsData } = useQuery({
    queryKey: ['directives-meetings', meetingIds],
    queryFn: async () => {
      const meetings: Record<string, MeetingApiResponse> = {};
      await Promise.all(meetingIds.map(async (id) => {
        try { meetings[id] = await getMeetingById(id); } catch { /* skip */ }
      }));
      return meetings;
    },
    enabled: meetingIds.length > 0,
  });

  const formatDate = (dateString: string | null): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  /* ─── Table columns (current) ─── */
  const buildTableColumns = (
    originalList: Directive[],
    meetingsMap: Record<string, MeetingApiResponse> | undefined,
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    { id: 'item_number', header: '#', width: 'flex-none min-w-14 w-14', align: 'center',
      render: (_r, i) => <span className="text-sm text-[var(--color-text-gray-500)]">{i + 1 + pageOffset}</span>,
    },
    { id: 'directive_date', header: 'تاريخ التوجيه', width: 'flex-none min-w-28 w-28', align: 'end',
      render: (row) => <span className="text-sm text-[var(--color-text-gray-600)]">{formatDate(originalList.find((d) => d.id === row.id)?.due_date ?? null)}</span>,
    },
    { id: 'directive_text', header: 'التوجيه', width: 'min-w-0 flex-[2]', align: 'end',
      render: (row) => <TruncatedWithTooltip title={row.title}>{row.title}</TruncatedWithTooltip>,
    },
    { id: 'meeting_nature', header: 'طبيعة الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        const label = meeting?.meeting_type ? (MeetingTypeLabels[meeting.meeting_type as keyof typeof MeetingTypeLabels] ?? meeting.meeting_type) : '-';
        return <TruncatedWithTooltip title={label}>{label}</TruncatedWithTooltip>;
      },
    },
    { id: 'meeting_subject', header: 'موضوع الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        return <TruncatedWithTooltip title={meeting?.meeting_subject || '-'}>{meeting?.meeting_subject || '-'}</TruncatedWithTooltip>;
      },
    },
    { id: 'meeting_classification', header: 'فئة الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        return <TruncatedWithTooltip title={getClassificationLabel(meeting?.meeting_classification || null)}>{getClassificationLabel(meeting?.meeting_classification || null)}</TruncatedWithTooltip>;
      },
    },
    { id: 'meeting_date', header: 'تاريخ الاجتماع', width: 'flex-none min-w-28 w-28', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        return <span className="text-sm text-[var(--color-text-gray-600)]">{formatDate(meeting?.scheduled_at || null)}</span>;
      },
    },
    { id: 'responsible_person', header: 'المسؤول', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        return <TruncatedWithTooltip title={orig?.assignees ?? '-'}>{orig?.assignees ?? '-'}</TruncatedWithTooltip>;
      },
    },
  ];

  const buildPreviousTableColumns = (
    previousList: PreviousDirectiveItem[],
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    { id: 'item_number', header: '#', width: 'flex-none min-w-14 w-14', align: 'center',
      render: (_r, i) => <span className="text-sm text-[var(--color-text-gray-500)]">{i + 1 + pageOffset}</span>,
    },
    { id: 'action_number', header: 'رقم التوجيه', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => <span className="text-sm text-[var(--color-text-gray-600)]">{previousList.find((d) => d.id === row.id)?.action_number ?? '-'}</span>,
    },
    { id: 'created_date', header: 'تاريخ التوجيه', width: 'flex-none min-w-28 w-28', align: 'end',
      render: (row) => <span className="text-sm text-[var(--color-text-gray-600)]">{formatDate(previousList.find((d) => d.id === row.id)?.created_date ?? null)}</span>,
    },
    { id: 'title', header: 'التوجيه', width: 'min-w-0 flex-[2]', align: 'end',
      render: (row) => <TruncatedWithTooltip title={row.title}>{row.title}</TruncatedWithTooltip>,
    },
    { id: 'due_date', header: 'تاريخ الاستحقاق', width: 'flex-none min-w-28 w-28', align: 'end',
      render: (row) => <span className="text-sm text-[var(--color-text-gray-600)]">{formatDate(previousList.find((d) => d.id === row.id)?.due_date ?? null)}</span>,
    },
    { id: 'directive_status', header: 'الحالة', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => <span className="text-sm text-[var(--color-text-gray-600)]">{row.statusLabel ?? '-'}</span>,
    },
    { id: 'assignees', header: 'المسؤول', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const item = previousList.find((d) => d.id === row.id);
        const text = Array.isArray(item?.assignees) && item.assignees.length ? item.assignees.filter(Boolean).join('، ') : '-';
        return <TruncatedWithTooltip title={text}>{text}</TruncatedWithTooltip>;
      },
    },
  ];

  const tableColumns = useMemo(() => {
    const base = buildTableColumns(originalDirectives, meetingsData, (currentPage - 1) * ITEMS_PER_PAGE);
    return [
      ...base,
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
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-base-gray-100)] transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-[var(--color-text-gray-500)]" strokeWidth={2} />
            </button>
          </div>
        ),
      },
    ];
  }, [originalDirectives, meetingsData, currentPage]);

  const previousTableColumns = useMemo(
    () => buildPreviousTableColumns(originalPreviousDirectives, 0),
    [originalPreviousDirectives]
  );

  const { openCreateDrawer } = useMeetingFormDrawer({ createEditBasePath: PATH.DIRECTIVES });

  /* ═══════════ RENDER ═══════════ */
  const isCurrentTab = activeTab === 'current';
  const loading = isCurrentTab ? isLoading : isLoadingPrevious;
  const hasError = isCurrentTab ? error : errorPrevious;
  const dataList = isCurrentTab ? directives : previousDirectives;
  const originalList = isCurrentTab ? originalDirectives : originalPreviousDirectives;

  return (
    <>
      <div className="flex flex-col w-full min-h-0" dir="rtl">

        {/* ════════════════════════════════════════ */}
        {/* PAGE HEADER — Title + Action + Search   */}
        {/* ════════════════════════════════════════ */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Right: Title area */}
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]"
              >
                <Icon icon="solar:document-text-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">توجيهات الجدولة</h1>
                <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">إدارة ومتابعة جميع التوجيهات</p>
              </div>
            </div>

            {/* Left: Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-gray-500)]" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="بحث في التوجيهات..."
                  className="h-10 pr-10 pl-4 rounded-xl bg-white border border-[var(--color-base-gray-200)] text-sm text-[var(--color-text-gray-700)] placeholder:text-[var(--color-text-gray-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]/20 transition-all w-[260px]"
                />
              </div>

              {/* View switcher */}
              <div className="flex items-center bg-white rounded-xl border border-[var(--color-base-gray-200)] p-1 gap-0.5">
                <button
                  onClick={() => setView('cards')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    view === 'cards' ? 'bg-[var(--color-primary-500)] text-white shadow-sm' : 'text-[var(--color-text-gray-500)] hover:bg-[var(--color-base-gray-50)]'
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('table')}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                    view === 'table' ? 'bg-[var(--color-primary-500)] text-white shadow-sm' : 'text-[var(--color-text-gray-500)] hover:bg-[var(--color-base-gray-50)]'
                  )}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>

              {/* Create meeting */}
              <button
                onClick={() => openCreateDrawer()}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] bg-[var(--color-primary-500)]"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء اجتماع</span>
              </button>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/*     STATS CARDS                         */}
        {/* ════════════════════════════════════════ */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'إجمالي التوجيهات', value: allDirectivesFiltered.length + previousDirectives.length, icon: FileText, color: 'var(--color-primary-500)', bg: 'rgba(0,169,145,0.06)' },
              { label: 'التوجيهات الحالية', value: allDirectivesFiltered.length, icon: CircleDot, color: 'var(--color-status-blue)', bg: 'rgba(60,111,209,0.06)' },
              { label: 'التوجيهات السابقة', value: previousDirectives.length, icon: CheckCircle2, color: 'var(--color-status-green)', bg: 'rgba(2,122,72,0.06)' },
              { label: 'قيد المتابعة', value: allOriginalDirectives.filter(d => d.status === 'CURRENT').length, icon: Timer, color: 'var(--color-status-yellow)', bg: 'rgba(190,142,11,0.06)' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[var(--color-base-gray-200)] p-4 flex items-center gap-4 hover:shadow-[var(--shadow-sm)] transition-shadow">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-[var(--color-text-gray-900)]">{stat.value}</p>
                  <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/*     TABS + CONTENT PANEL                */}
        {/* ════════════════════════════════════════ */}
        <div className="px-6 pb-6 flex-1 min-h-0 flex flex-col">
          <div className="bg-white rounded-3xl border border-[var(--color-base-gray-200)] flex-1 min-h-0 flex flex-col overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            
            {/* Tab bar */}
            <div className="flex items-center border-b border-[var(--color-base-gray-200)] px-1 pt-1">
              {[
                { id: 'current' as const, label: 'التوجيهات الحالية', count: allDirectivesFiltered.length },
                { id: 'previous' as const, label: 'التوجيهات السابقة', count: previousDirectives.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors rounded-t-xl',
                    activeTab === tab.id
                      ? 'text-[var(--color-primary-500)] bg-[var(--color-bg-primary-light)]'
                      : 'text-[var(--color-text-gray-500)] hover:text-[var(--color-text-gray-700)] hover:bg-[var(--color-base-gray-50)]'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full',
                        activeTab === tab.id
                          ? 'bg-[var(--color-primary-500)] text-white'
                          : 'bg-[var(--color-base-gray-100)] text-[var(--color-text-gray-500)]'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[var(--color-primary-500)]" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto p-5">
              
              {/* Dropdown Portal */}
              {openDropdownId && dropdownPosition && (() => {
                const pos = dropdownPosition;
                const gap = 6;
                const top = Math.max(8, pos.bottom + gap);
                const right = window.innerWidth - pos.right;
                return createPortal(
                  <div
                    data-directive-dropdown
                    className="fixed rounded-2xl p-1.5 w-[170px]"
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      zIndex: 9999,
                      top: `${top}px`,
                      right: `${Math.min(right, window.innerWidth - 180)}px`,
                      left: 'auto',
                      background: 'white',
                      border: '1px solid var(--color-base-gray-200)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    {[
                      { label: 'الأخذ بالتوجيه', icon: XCircle, color: 'var(--color-status-yellow)', action: async () => {
                        const d = originalDirectives.find((x) => x.id === openDropdownId);
                        if (d) { try { await takeDirective(d.id); await refetch(); } catch { } }
                      }},
                      { label: 'طلب إجتماع', icon: CalendarDays, color: 'var(--color-primary-500)', action: async () => {
                        const d = originalDirectives.find((x) => x.id === openDropdownId);
                        if (d) {
                          openCreateDrawer({ directive_id: d.id, directive_text: d.title, related_meeting: d.assignees || '' });
                          try { await requestMeetingFromDirective(d.id); } catch { }
                        }
                      }},
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await item.action();
                          setOpenDropdownId(null); setDropdownPosition(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--color-base-gray-50)] text-[var(--color-text-gray-700)]"
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                );
              })()}

              {/* States */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
                  <p className="text-sm text-[var(--color-text-gray-500)]">جاري التحميل...</p>
                </div>
              ) : hasError ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-50">
                    <AlertCircle className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-sm text-red-600 font-medium">حدث خطأ أثناء تحميل البيانات</p>
                </div>
              ) : dataList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--color-base-gray-50)]">
                    <FileText className="w-8 h-8 text-[var(--color-text-gray-500)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--color-text-gray-700)]">لا توجد توجيهات</p>
                    <p className="text-xs text-[var(--color-text-gray-500)] mt-1">
                      {isCurrentTab ? 'لا توجد توجيهات حالية مسجلة' : 'لا توجد توجيهات سابقة مسجلة'}
                    </p>
                  </div>
                </div>
              ) : view === 'table' ? (
                /* ── Table View ── */
                <DataTable
                  columns={isCurrentTab ? tableColumns : previousTableColumns}
                  data={dataList}
                  rowPadding="py-2"
                />
              ) : (
                /* ── Cards View ── */
                <div className="flex flex-col gap-3">
                  {dataList.map((directive) => {
                    const isExpanded = expandedId === directive.id;
                    const original = isCurrentTab
                      ? originalDirectives.find((d) => d.id === directive.id)
                      : originalPreviousDirectives.find((d) => d.id === directive.id);

                    const isPrevious = !isCurrentTab;
                    const directiveDate = isPrevious
                      ? formatDate((original as PreviousDirectiveItem)?.created_date ?? null)
                      : formatDate((original as Directive)?.due_date ?? null);
                    const actionNumber = isPrevious
                      ? (original as PreviousDirectiveItem)?.action_number ?? '-'
                      : (original as Directive)?.action_number ?? '-';
                    const statusLabel = isPrevious
                      ? (directive.statusLabel ?? 'سابق')
                      : ((original as Directive)?.status === 'CURRENT' ? 'جاري' : 'توجيه');

                    return (
                      <div
                        key={directive.id}
                        className={cn(
                          'rounded-2xl border transition-all duration-200 overflow-hidden',
                          isExpanded
                            ? 'border-[var(--color-primary-500)] shadow-[0_2px_16px_rgba(0,169,145,0.12)]'
                            : 'border-[var(--color-base-gray-200)] hover:border-[var(--color-base-gray-300)]'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === directive.id ? null : directive.id)}
                          className="w-full text-right bg-white px-5 py-4 transition-colors hover:bg-[var(--color-base-gray-50)]"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Status indicator dot */}
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{
                                  background: isCurrentTab ? 'var(--color-primary-500)' : 'var(--color-status-green)',
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                                    style={{
                                      background: isCurrentTab ? 'rgba(0,169,145,0.08)' : 'rgba(2,122,72,0.08)',
                                      color: isCurrentTab ? 'var(--color-primary-500)' : 'var(--color-status-green)',
                                    }}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--color-text-gray-700)] leading-relaxed line-clamp-2">
                                  {directive.title || '—'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-base-gray-50)] text-[11px] text-[var(--color-text-gray-500)]">
                                <Clock className="w-3 h-3" />
                                <span>{directiveDate}</span>
                              </div>
                              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-base-gray-50)] text-[11px] text-[var(--color-text-gray-500)]">
                                <Hash className="w-3 h-3" />
                                <span>{actionNumber}</span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 text-[var(--color-text-gray-500)] transition-transform duration-200',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </div>
                          </div>
                        </button>

                        {/* Expanded panel */}
                        {isExpanded && original && (
                          <div className="border-t border-[var(--color-base-gray-200)] bg-[var(--color-base-gray-50)] px-5 py-4">
                            <div className="flex flex-col gap-3">
                              {/* Meta row */}
                              <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-gray-600)]">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[var(--color-text-gray-500)]" />
                                  تاريخ التوجيه: <strong className="text-[var(--color-text-gray-900)]">{directiveDate}</strong>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5 text-[var(--color-text-gray-500)]" />
                                  رقم التوجيه: <strong className="text-[var(--color-text-gray-900)]">{actionNumber}</strong>
                                </span>
                                {directive.coordinator && (
                                  <span>المسؤولون: <strong className="text-[var(--color-text-gray-900)]">{directive.coordinator}</strong></span>
                                )}
                                {isPrevious && (original as PreviousDirectiveItem).due_date && (
                                  <span>الموعد النهائي: <strong className="text-[var(--color-text-gray-900)]">{formatDate((original as PreviousDirectiveItem).due_date ?? null)}</strong></span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await takeDirective(original.id);
                                      setExpandedId(null);
                                      isPrevious ? await refetchPrevious() : await refetch();
                                    } catch { }
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border hover:shadow-sm"
                                  style={{ borderColor: 'var(--color-status-yellow)', color: 'var(--color-status-yellow)' }}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  الأخذ بالتوجيه
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const relatedMeeting = isPrevious
                                      ? (Array.isArray((original as PreviousDirectiveItem).assignees) ? (original as PreviousDirectiveItem).assignees!.join(', ') : '')
                                      : ((original as Directive).assignees || '');
                                    openCreateDrawer({ directive_id: original.id, directive_text: original.title, related_meeting: relatedMeeting });
                                    try { await requestMeetingFromDirective(original.id); } catch { }
                                    setExpandedId(null);
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:opacity-90"
                                  style={{ background: 'var(--color-primary-500)' }}
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

                  {isCurrentTab && totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <MeetingFormDrawer />
    </>
  );
};

export default Directives;
