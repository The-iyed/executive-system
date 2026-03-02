import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, MeetingCardData, ViewType, TableColumn, Pagination, Tabs, TruncatedWithTooltip, ContentBar, formatDateArabic } from '@/modules/shared';
import { MeetingClassification, MeetingClassificationLabels, MeetingTypeLabels } from '@/modules/shared';
import { cn } from '@/lib/ui';
import { MoreVertical, X, CalendarDays, Clock, Hash, ChevronUp, ChevronDown, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { getDirectives, getPreviousDirectives, Directive, PreviousDirectiveItem, closeDirective, cancelDirective, directiveToExternalDirectiveBody, previousDirectiveToExternalDirectiveBody, getMeetingById, MeetingApiResponse } from '../data/meetingsApi';
import { mapDirectiveToCardData, mapPreviousDirectiveToCardData } from '../utils/directiveMapper';
import { PATH } from '../routes/paths';
import '@/modules/shared/styles';
import { useMeetingFormDrawer } from '../features/MeetingForm/hooks';
import { MeetingFormDrawer } from '../features/MeetingForm/components/MeetingFormDrawer';

const ITEMS_PER_PAGE = 10;

/* ─── Reusable Action Buttons for directive cards ─── */
const DirectiveActionButtons: React.FC<{
  onCancel: (e: React.MouseEvent) => void;
  onRequestMeeting: (e: React.MouseEvent) => void;
  onClose: (e: React.MouseEvent) => void;
}> = ({ onCancel, onRequestMeeting, onClose }) => (
  <div className="flex flex-wrap gap-2 justify-end">
    <button
      type="button"
      onClick={onCancel}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all hover:opacity-90 active:scale-95"
      style={{ background: 'var(--color-status-yellow)', color: 'white' }}
    >
      <span>إلغاء التوجيه</span>
      <X className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onClick={onRequestMeeting}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all hover:opacity-90 active:scale-95"
      style={{ background: 'var(--color-primary-500)', color: 'white' }}
    >
      <span>طلب إجتماع</span>
      <CalendarDays className="w-3.5 h-3.5" />
    </button>
    <button
      type="button"
      onClick={onClose}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all hover:opacity-90 active:scale-95 bg-red-600 text-white"
    >
      <span>إغلاق التوجيه</span>
      <X className="w-3.5 h-3.5" />
    </button>
  </div>
);

/* ─── Empty / Loading / Error states ─── */
const StateMessage: React.FC<{ type: 'loading' | 'error' | 'empty'; message?: string }> = ({ type, message }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    {type === 'loading' && (
      <>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary-500)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-gray-500)' }}>جاري التحميل...</p>
      </>
    )}
    {type === 'error' && (
      <>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-sm font-medium text-red-600">{message || 'حدث خطأ أثناء تحميل البيانات'}</p>
      </>
    )}
    {type === 'empty' && (
      <>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--color-base-gray-100)' }}>
          <FileText className="w-7 h-7" style={{ color: 'var(--color-text-gray-500)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-gray-500)' }}>{message || 'لا توجد بيانات'}</p>
      </>
    )}
  </div>
);

/* ─── Directive Card (shared between current & previous) ─── */
const DirectiveCard: React.FC<{
  id: string;
  title: string;
  statusLabel: string;
  date: string;
  actionNumber: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedContent?: React.ReactNode;
  coordinator?: string;
}> = ({ title, statusLabel, date, actionNumber, isExpanded, onToggle, expandedContent, coordinator }) => (
  <div className="flex flex-col">
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-right rounded-2xl px-6 py-5 transition-all duration-200 border',
        isExpanded
          ? 'bg-white border-[var(--color-primary-500)] shadow-[0_2px_12px_rgba(0,169,145,0.10)] rounded-b-none'
          : 'bg-white border-[var(--color-base-gray-200)] hover:border-[var(--color-base-gray-300)] hover:shadow-[var(--shadow-sm)]'
      )}
    >
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Right side – status + title */}
        <div className="flex flex-col items-start flex-1 min-w-0 gap-1.5">
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(4,143,134,0.08)',
              color: 'var(--color-primary-500)',
            }}
          >
            {statusLabel}
          </span>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-gray-700)' }}>
            {title || '—'}
          </p>
        </div>

        {/* Left side – metadata chips + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--color-base-gray-100)', color: 'var(--color-text-gray-600)' }}>
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>تاريخ التوجيه : {date}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--color-base-gray-100)', color: 'var(--color-text-gray-600)' }}>
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span>رقم التوجيه : {actionNumber}</span>
          </div>
          <span style={{ color: 'var(--color-text-gray-500)' }} aria-hidden>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </span>
        </div>
      </div>
    </button>

    {/* Expanded details */}
    {isExpanded && (
      <div
        className="rounded-b-2xl border border-t-0 bg-white px-6 py-5"
        style={{ borderColor: 'var(--color-primary-500)' }}
      >
        <div className="flex flex-col gap-4 text-right">
          {coordinator && (
            <p className="text-sm" style={{ color: 'var(--color-text-gray-700)' }}>
              <span className="font-semibold" style={{ color: 'var(--color-text-gray-900)' }}>المسؤولون :</span>{' '}
              {coordinator}
            </p>
          )}
          {expandedContent}
        </div>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════ */
/*                  MAIN DIRECTIVES PAGE                  */
/* ═══════════════════════════════════════════════════════ */

const Directives: React.FC = () => {
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [directivesSubTab, setDirectivesSubTab] = useState<'current' | 'previous'>('current');
  const [expandedDirectiveId, setExpandedDirectiveId] = useState<string | null>(null);

  const handleCloseDirective = async (directive: Directive) => {
    await closeDirective(directive.id, directiveToExternalDirectiveBody(directive));
    await refetch();
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);
  useEffect(() => { setExpandedDirectiveId(null); }, [directivesSubTab]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdown = dropdownRefs.current[openDropdownId];
        const target = event.target as Node;
        if (dropdown && !dropdown.contains(target)) {
          const portalDropdown = document.querySelector('[style*="z-index: 9999"]');
          if (!portalDropdown || !portalDropdown.contains(target)) {
            setOpenDropdownId(null);
            setDropdownPosition(null);
          }
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [openDropdownId]);

  /* ─── Data fetching ─── */
  const { data: directivesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['directives', 'current', debouncedSearch],
    queryFn: () => getDirectives({ skip: 0, limit: 100, search: debouncedSearch.trim() || undefined }),
    enabled: directivesSubTab === 'current',
  });

  const allOriginalDirectives: Directive[] = directivesResponse?.items || [];
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: previousDirectivesResponse, isLoading: isLoadingPrevious, error: errorPrevious, refetch: refetchPrevious } = useQuery({
    queryKey: ['directives-previous', 0, 100, debouncedSearch],
    queryFn: () => getPreviousDirectives({ skip: 0, limit: 100, search: debouncedSearch.trim() || undefined }),
    enabled: directivesSubTab === 'previous',
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
      .filter((id, index, self) => self.indexOf(id) === index);
  }, [originalDirectives]);

  const { data: meetingsData } = useQuery({
    queryKey: ['directives-meetings', meetingIds],
    queryFn: async () => {
      const meetings: Record<string, MeetingApiResponse> = {};
      await Promise.all(
        meetingIds.map(async (id) => {
          try { meetings[id] = await getMeetingById(id); } catch (error) { console.error(`Error fetching meeting ${id}:`, error); }
        })
      );
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
    {
      id: 'item_number', header: '#', width: 'flex-none min-w-16 w-16', align: 'center',
      render: (_row, index) => (
        <div className="w-full flex justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-gray-600)' }}>{index + 1 + pageOffset}</span>
        </div>
      ),
    },
    {
      id: 'directive_date', header: 'تاريخ التوجيه', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        return <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{formatDate(orig?.due_date ?? null)}</span>;
      },
    },
    {
      id: 'directive_text', header: 'التوجيه', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => <TruncatedWithTooltip title={row.title}>{row.title}</TruncatedWithTooltip>,
    },
    {
      id: 'meeting_nature', header: 'طبيعة الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        const label = meeting?.meeting_type ? (MeetingTypeLabels[meeting.meeting_type as keyof typeof MeetingTypeLabels] ?? meeting.meeting_type) : '-';
        return <TruncatedWithTooltip title={label}>{label}</TruncatedWithTooltip>;
      },
    },
    {
      id: 'meeting_subject', header: 'موضوع الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        return <TruncatedWithTooltip title={meeting?.meeting_subject || '-'}>{meeting?.meeting_subject || '-'}</TruncatedWithTooltip>;
      },
    },
    {
      id: 'meeting_classification', header: 'فئة الاجتماع', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        const label = getClassificationLabel(meeting?.meeting_classification || null);
        return <TruncatedWithTooltip title={label}>{label}</TruncatedWithTooltip>;
      },
    },
    {
      id: 'meeting_date', header: 'تاريخ الاجتماع', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        const meeting = orig?.meeting_id && meetingsMap ? meetingsMap[orig.meeting_id] : undefined;
        return <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{formatDate(meeting?.scheduled_at || null)}</span>;
      },
    },
    {
      id: 'responsible_person', header: 'الشخص المسؤول', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => {
        const orig = originalList.find((d) => d.id === row.id);
        return <TruncatedWithTooltip title={orig?.assignees ?? '-'}>{orig?.assignees ?? '-'}</TruncatedWithTooltip>;
      },
    },
  ];

  /* ─── Table columns (previous) ─── */
  const buildPreviousTableColumns = (
    previousList: PreviousDirectiveItem[],
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    { id: 'item_number', header: '#', width: 'flex-none min-w-16 w-16', align: 'center',
      render: (_row, index) => <span className="text-sm font-medium" style={{ color: 'var(--color-text-gray-600)' }}>{index + 1 + pageOffset}</span>,
    },
    { id: 'action_number', header: 'رقم التوجيه', width: 'flex-none min-w-20 w-20', align: 'end',
      render: (row) => <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{previousList.find((d) => d.id === row.id)?.action_number ?? '-'}</span>,
    },
    { id: 'created_date', header: 'تاريخ التوجيه', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{formatDate(previousList.find((d) => d.id === row.id)?.created_date ?? null)}</span>,
    },
    { id: 'title', header: 'التوجيه', width: 'min-w-0 flex-1', align: 'end',
      render: (row) => <TruncatedWithTooltip title={row.title}>{row.title}</TruncatedWithTooltip>,
    },
    { id: 'due_date', header: 'تاريخ الاستحقاق', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{formatDate(previousList.find((d) => d.id === row.id)?.due_date ?? null)}</span>,
    },
    { id: 'directive_status', header: 'حالة التوجيه', width: 'flex-none min-w-24 w-24', align: 'end',
      render: (row) => <span className="text-sm" style={{ color: 'var(--color-text-gray-600)' }}>{row.statusLabel ?? '-'}</span>,
    },
    { id: 'assignees', header: 'الشخص المسؤول', width: 'min-w-0 flex-1', align: 'end',
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
        id: 'actions', header: '', width: 'flex-none w-14 min-w-14', align: 'center' as const,
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
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ background: 'var(--color-base-gray-50)' }}
            >
              <MoreVertical className="w-4 h-4" style={{ color: 'var(--color-text-gray-600)' }} strokeWidth={1.67} />
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

  /* ─── Card action handlers ─── */
  const handleCancelAction = useCallback(async (id: string, list: Directive[] | PreviousDirectiveItem[], isPrevious: boolean) => {
    const item = list.find((x) => x.id === id);
    if (!item) return;
    try {
      const body = isPrevious
        ? previousDirectiveToExternalDirectiveBody(item as PreviousDirectiveItem)
        : directiveToExternalDirectiveBody(item as Directive);
      await cancelDirective(id, body);
      setExpandedDirectiveId(null);
      isPrevious ? await refetchPrevious() : await refetch();
    } catch (err) { console.error('Error cancelling directive:', err); }
  }, [refetch, refetchPrevious]);

  const handleRequestMeetingAction = useCallback(async (id: string, list: Directive[] | PreviousDirectiveItem[], isPrevious: boolean) => {
    const item = list.find((x) => x.id === id);
    if (!item) return;
    try {
      const body = isPrevious
        ? previousDirectiveToExternalDirectiveBody(item as PreviousDirectiveItem)
        : directiveToExternalDirectiveBody(item as Directive);
      await closeDirective(id, body);
      const relatedMeeting = isPrevious
        ? (Array.isArray((item as PreviousDirectiveItem).assignees) ? (item as PreviousDirectiveItem).assignees!.join(', ') : '')
        : ((item as Directive).assignees || '');
      openCreateDrawer({ directive_id: id, directive_text: item.title, related_meeting: relatedMeeting });
    } catch (err) { console.error('Error:', err); }
    setExpandedDirectiveId(null);
  }, [openCreateDrawer]);

  const handleCloseAction = useCallback(async (id: string, list: Directive[] | PreviousDirectiveItem[], isPrevious: boolean) => {
    const item = list.find((x) => x.id === id);
    if (!item) return;
    try {
      const body = isPrevious
        ? previousDirectiveToExternalDirectiveBody(item as PreviousDirectiveItem)
        : directiveToExternalDirectiveBody(item as Directive);
      await closeDirective(id, body);
      isPrevious ? await refetchPrevious() : await refetch();
    } catch (err) { console.error('Error closing directive:', err); }
    setExpandedDirectiveId(null);
  }, [refetch, refetchPrevious]);

  /* ─── Counts for tab badges ─── */
  const currentCount = allDirectivesFiltered.length;
  const previousCount = previousDirectives.length;

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      <div className="flex flex-col gap-0" dir="rtl">

        {/* ── Action bar ── */}
        <ContentBar
          showViewSwitcher={true}
          onViewChange={setView}
          view={view}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          primaryAction={{
            label: 'إنشاء اجتماع',
            variant: 'primary',
            onClick: () => openCreateDrawer(),
          }}
        />

        {/* ── Sub-tabs (current / previous) ── */}
        <div className="flex justify-center py-4">
          <Tabs
            items={[
              { id: 'previous', label: 'التوجيهات السابقة', badge: previousCount || undefined },
              { id: 'current', label: 'التوجيهات الحالية', badge: currentCount || undefined },
            ]}
            activeTab={directivesSubTab}
            onTabChange={(id) => setDirectivesSubTab(id as 'current' | 'previous')}
            variant="pill"
          />
        </div>

        {/* ── Content area ── */}
        <div className="px-6 pb-6">

          {/* Dropdown Portal for table actions */}
          {openDropdownId && dropdownPosition && (() => {
            const pos = dropdownPosition;
            const dropdownHeight = 120;
            const gap = 4;
            const top = Math.max(8, pos.top - dropdownHeight - gap);
            const right = window.innerWidth - pos.right;
            return createPortal(
              <div
                className="fixed rounded-2xl p-2 w-[160px]"
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
                style={{
                  zIndex: 9999,
                  top: `${top}px`,
                  right: `${Math.min(right, window.innerWidth - 170)}px`,
                  left: 'auto',
                  background: 'white',
                  border: '1px solid var(--color-base-gray-200)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                }}
              >
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (openDropdownId) {
                      const d = originalDirectives.find((x) => x.id === openDropdownId);
                      if (d) {
                        try {
                          await cancelDirective(d.id, directiveToExternalDirectiveBody(d));
                          setOpenDropdownId(null); setDropdownPosition(null);
                          await refetch();
                        } catch (error) {
                          console.error('Error cancelling directive:', error);
                          setOpenDropdownId(null); setDropdownPosition(null);
                        }
                      }
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold mb-1 transition-all hover:opacity-90"
                  style={{ background: 'var(--color-status-yellow)', color: 'white' }}
                >
                  <span>إلغاء التوجيه</span>
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (openDropdownId) {
                      const d = originalDirectives.find((x) => x.id === openDropdownId);
                      if (d) {
                        try {
                          await closeDirective(d.id, directiveToExternalDirectiveBody(d));
                          openCreateDrawer({ directive_id: d.id, directive_text: d.title, related_meeting: d.assignees || '' });
                        } catch (err) { console.error('Error:', err); }
                      }
                      setOpenDropdownId(null); setDropdownPosition(null);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold mb-1 transition-all hover:opacity-90"
                  style={{ background: 'var(--color-primary-500)', color: 'white' }}
                >
                  <span>طلب إجتماع</span>
                  <CalendarDays className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (openDropdownId) {
                      const d = originalDirectives.find((x) => x.id === openDropdownId);
                      if (d) {
                        try { await handleCloseDirective(d); } catch (err) { console.error('Error:', err); }
                      }
                      setOpenDropdownId(null); setDropdownPosition(null);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 bg-red-600 text-white"
                >
                  <span>إغلاق التوجيه</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>,
              document.body
            );
          })()}

          {/* ── Previous directives tab ── */}
          {directivesSubTab === 'previous' ? (
            isLoadingPrevious ? <StateMessage type="loading" /> :
            errorPrevious ? <StateMessage type="error" /> :
            previousDirectives.length === 0 ? <StateMessage type="empty" message="لا توجد توجيهات سابقة" /> :
            view === 'table' ? (
              <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-base-gray-200)', background: 'white' }}>
                <DataTable columns={previousTableColumns} data={previousDirectives} rowPadding="py-2" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 w-full">
                {previousDirectives.map((directive) => {
                  const original = originalPreviousDirectives.find((d) => d.id === directive.id);
                  const directiveDate = original?.created_date ? formatDate(original.created_date) : directive.date;
                  return (
                    <DirectiveCard
                      key={directive.id}
                      id={directive.id}
                      title={directive.title}
                      statusLabel={directive.statusLabel ?? 'سابق'}
                      date={directiveDate}
                      actionNumber={original?.action_number ?? '-'}
                      isExpanded={expandedDirectiveId === directive.id}
                      onToggle={() => setExpandedDirectiveId((id) => (id === directive.id ? null : directive.id))}
                      coordinator={directive.coordinator}
                      expandedContent={
                        original && (
                          <>
                            {original.due_date && (
                              <p className="text-sm" style={{ color: 'var(--color-text-gray-700)' }}>
                                <span className="font-semibold" style={{ color: 'var(--color-text-gray-900)' }}>الموعد النهائي :</span>{' '}
                                {formatDate(original.due_date)}
                              </p>
                            )}
                            <DirectiveActionButtons
                              onCancel={(e) => { e.stopPropagation(); handleCancelAction(directive.id, originalPreviousDirectives, true); }}
                              onRequestMeeting={(e) => { e.stopPropagation(); handleRequestMeetingAction(directive.id, originalPreviousDirectives, true); }}
                              onClose={(e) => { e.stopPropagation(); handleCloseAction(directive.id, originalPreviousDirectives, true); }}
                            />
                          </>
                        )
                      }
                    />
                  );
                })}
              </div>
            )

          /* ── Current directives tab ── */
          ) : (
            isLoading ? <StateMessage type="loading" /> :
            error ? <StateMessage type="error" /> :
            directives.length === 0 ? <StateMessage type="empty" /> :
            <>
              {view === 'table' ? (
                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--color-base-gray-200)', background: 'white' }}>
                  <DataTable columns={tableColumns} data={directives} rowPadding="py-2" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  {directives.map((directive) => {
                    const original = originalDirectives.find((d) => d.id === directive.id);
                    const directiveDate = original?.due_date ? formatDate(original.due_date) : directive.date;
                    const typeLabel = original?.status === 'CURRENT' ? 'جاري' : 'توجيه';
                    return (
                      <DirectiveCard
                        key={directive.id}
                        id={directive.id}
                        title={directive.title}
                        statusLabel={typeLabel}
                        date={directiveDate}
                        actionNumber={original?.action_number ?? '-'}
                        isExpanded={expandedDirectiveId === directive.id}
                        onToggle={() => setExpandedDirectiveId((id) => (id === directive.id ? null : directive.id))}
                        coordinator={directive.coordinator}
                        expandedContent={
                          original && (
                            <DirectiveActionButtons
                              onCancel={(e) => { e.stopPropagation(); handleCancelAction(directive.id, originalDirectives as Directive[], false); }}
                              onRequestMeeting={(e) => { e.stopPropagation(); handleRequestMeetingAction(directive.id, originalDirectives as Directive[], false); }}
                              onClose={(e) => { e.stopPropagation(); handleCloseAction(directive.id, originalDirectives as Directive[], false); }}
                            />
                          )
                        }
                      />
                    );
                  })}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MeetingFormDrawer />
    </>
  );
};

export default Directives;
