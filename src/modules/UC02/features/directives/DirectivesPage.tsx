import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, ViewSwitcher, SearchInput, MeetingCardData, ViewType, TableColumn, Pagination, Tabs, TruncatedWithTooltip, ContentBar, formatDateArabic } from '@/modules/shared';
import { MeetingClassification, MeetingClassificationLabels, MeetingTypeLabels } from '@/modules/shared';
import { cn } from '@/lib/ui';
import '@/modules/shared/styles'; // Import shared styles including scrollbar
import { MoreVertical, X, CalendarDays, Clock, Hash, ChevronUp, ChevronDown } from 'lucide-react';
import { getDirectives, getPreviousDirectives, Directive, PreviousDirectiveItem, takeDirective, requestMeetingFromDirective, getMeetingById, MeetingApiResponse } from '../../data/meetingsApi';
import { mapDirectiveToCardData, mapPreviousDirectiveToCardData } from '../../utils/directiveMapper';
import { PATH } from '../../routes/paths';
import { useMeetingFormDrawer } from '../MeetingForm/hooks';

const ITEMS_PER_PAGE = 10;

export function DirectivesPage() {
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [directivesSubTab, setDirectivesSubTab] = useState<'current' | 'previous'>('current');
  const [expandedDirectiveId, setExpandedDirectiveId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Collapse expanded item when switching tabs
  useEffect(() => {
    setExpandedDirectiveId(null);
  }, [directivesSubTab]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdown = dropdownRefs.current[openDropdownId];
        const target = event.target as Node;
        if (dropdown && !dropdown.contains(target)) {
          // Check if click is on the portal dropdown
          const portalDropdown = document.querySelector('[style*="z-index: 9999"]');
          if (!portalDropdown || !portalDropdown.contains(target)) {
            setOpenDropdownId(null);
            setDropdownPosition(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Close dropdown when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId]);

  // Fetch current directives (التوجيهات الحالية); search is sent to API, not done on frontend
  const { data: directivesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['directives', 'current', debouncedSearch],
    queryFn: () =>
      getDirectives({
        skip: 0,
        limit: 100,
        search: debouncedSearch.trim() || undefined,
      }),
    enabled: directivesSubTab === 'current',
  });

  // Full list from API (already filtered by API when search is used); pagination is client-side
  const allOriginalDirectives: Directive[] = directivesResponse?.items || [];
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch previous directives (التوجيهات السابقة); search is sent to API, not done on frontend
  const { data: previousDirectivesResponse, isLoading: isLoadingPrevious, error: errorPrevious, refetch: refetchPrevious } = useQuery({
    queryKey: ['directives-previous', 0, 100, debouncedSearch],
    queryFn: () =>
      getPreviousDirectives({
        skip: 0,
        limit: 100,
        search: debouncedSearch.trim() || undefined,
      }),
    enabled: directivesSubTab === 'previous',
  });
  const originalPreviousDirectives: PreviousDirectiveItem[] = previousDirectivesResponse?.items || [];
  const previousDirectives: MeetingCardData[] = useMemo(() => {
    if (!previousDirectivesResponse?.items) return [];
    return previousDirectivesResponse.items.map(mapPreviousDirectiveToCardData);
  }, [previousDirectivesResponse]);

  // Map API response to MeetingCardData (no frontend search – API handles search)
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

  // Original directives for current page in display order (for table columns)
  const originalDirectives: Directive[] = useMemo(
    () =>
      directives
        .map((d) => allOriginalDirectives.find((o) => o.id === d.id))
        .filter((o): o is Directive => o != null),
    [allOriginalDirectives, directives]
  );

  // Only fetch meeting details for IDs that look like UUIDs (api/meetings/:id expects UUID, not numeric/legacy ids)
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
          try {
            const meeting = await getMeetingById(id);
            meetings[id] = meeting;
          } catch (err) {
            console.error(`Error fetching meeting ${id}:`, err);
          }
        })
      );
      return meetings;
    },
    enabled: meetingIds.length > 0,
  });

  const formatDate = (dateString: string | null): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  // Get classification label
  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  // Build table columns for a given directives list and meetings data
  const buildTableColumns = (
    originalList: Directive[],
    meetingsMap: Record<string, MeetingApiResponse> | undefined,
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    {
      id: 'item_number',
      header: '#',
      width: 'flex-none min-w-16 w-16',
      align: 'center',
      render: (_row, index) => (
        <div className="w-full flex justify-center">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {index + 1 + pageOffset}
          </span>
        </div>
      ),
    },
    {
      id: 'directive_date',
      header: 'تاريخ التوجيه',
      width: 'flex-none min-w-24 w-24',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        return (
          <div className="w-full flex justify-end min-w-0">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(originalDirective?.due_date ?? null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'directive_text',
      header: 'التوجيه',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => (
        <div className="w-full min-w-0">
          <TruncatedWithTooltip title={row.title}>
          {row.title}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'meeting_nature',
      header: 'طبيعة الاجتماع',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.meeting_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        const natureLabel = meeting?.meeting_type ? (MeetingTypeLabels[meeting.meeting_type as keyof typeof MeetingTypeLabels] ?? meeting.meeting_type) : '-';
        return (
          <div className="w-full flex justify-end min-w-0">
            <TruncatedWithTooltip title={natureLabel}>
              {natureLabel}
            </TruncatedWithTooltip>
        </div>
        );
      },
    },
    {
      id: 'meeting_subject',
      header: 'موضوع الاجتماع',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.meeting_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end min-w-0">
            <TruncatedWithTooltip title={meeting?.meeting_subject || '-'}>
              {meeting?.meeting_subject || '-'}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
    {
      id: 'meeting_classification',
      header: 'فئة الاجتماع',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.meeting_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end min-w-0">
            <TruncatedWithTooltip title={getClassificationLabel(meeting?.meeting_classification || null)}>
              {getClassificationLabel(meeting?.meeting_classification || null)}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
    {
      id: 'meeting_date',
      header: 'تاريخ الاجتماع',
      width: 'flex-none min-w-24 w-24',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.meeting_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end min-w-0">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(meeting?.scheduled_at || null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'responsible_person',
      header: 'الشخص المسؤول',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const displayName = originalDirective?.assignees ?? '-';
        return (
          <div className="w-full flex justify-end min-w-0">
            <TruncatedWithTooltip title={displayName}>
              {displayName}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
  ];

  // Previous directives table columns (matches /directives/previous API: id, external_id, action_number, title, due_date, status, assignees, etc.)
  const buildPreviousTableColumns = (
    previousList: PreviousDirectiveItem[],
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    {
      id: 'item_number',
      header: '#',
      width: 'flex-none min-w-16 w-16',
      align: 'center',
      render: (_row, index) => (
        <div className="w-full flex justify-center">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {index + 1 + pageOffset}
          </span>
        </div>
      ),
    },
    {
      id: 'action_number',
      header: 'رقم التوجيه',
      width: 'flex-none min-w-20 w-20',
      align: 'end',
      render: (row) => {
        const item = previousList.find((d) => d.id === row.id);
        return (
          <div className="w-full flex justify-end min-w-0">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {item?.action_number ?? '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'created_date',
      header: 'تاريخ التوجيه',
      width: 'flex-none min-w-24 w-24',
      align: 'end',
      render: (row) => {
        const item = previousList.find((d) => d.id === row.id);
        return (
          <div className="w-full flex justify-end min-w-0">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(item?.created_date ?? null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'title',
      header: 'التوجيه',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => (
        <div className="w-full min-w-0">
          <TruncatedWithTooltip title={row.title}>
            {row.title}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'due_date',
      header: 'تاريخ الاستحقاق',
      width: 'flex-none min-w-24 w-24',
      align: 'end',
      render: (row) => {
        const item = previousList.find((d) => d.id === row.id);
        return (
          <div className="w-full flex justify-end min-w-0">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(item?.due_date ?? null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'directive_status',
      header: 'حالة التوجيه',
      width: 'flex-none min-w-24 w-24',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end min-w-0">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.statusLabel ?? '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'assignees',
      header: 'الشخص المسؤول',
      width: 'min-w-0 flex-1',
      align: 'end',
      render: (row) => {
        const item = previousList.find((d) => d.id === row.id);
        const text = Array.isArray(item?.assignees) && item.assignees.length
          ? item.assignees.filter(Boolean).join('، ')
          : '-';
        return (
          <div className="w-full flex justify-end min-w-0">
            <TruncatedWithTooltip title={text}>
              {text}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
  ];

  const tableColumns = useMemo(() => {
    const base = buildTableColumns(originalDirectives, meetingsData, (currentPage - 1) * ITEMS_PER_PAGE);
    return [
      ...base,
      {
        id: 'actions',
        header: '',
        width: 'flex-none w-14 min-w-14',
        align: 'center' as const,
        render: (row: MeetingCardData) => (
          <div
            ref={(el) => {
              dropdownRefs.current[row.id] = el;
            }}
            className="flex justify-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenDropdownId(row.id);
                setDropdownPosition({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom });
              }}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-200 transition-colors bg-[#F6F6F6]"
            >
              <MoreVertical className="w-5 h-5 text-[#475467]" strokeWidth={1.67} />
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

  return (
    <>
      <ContentBar
        primaryAction={{
          label: 'إنشاء اجتماع',
          variant: 'primary',
          onClick: () => openCreateDrawer(),
        }}
      />
    <div className="w-full h-full flex flex-col" dir="rtl">
      {/* Scrollable Content */}
      <div className="flex-1 p-6 schedule-review-scroll">
        {/* Page Title, Description, Search/Filter Bar, and View Switcher */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          {/* Right side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">توجيهات الجدولة</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على توجيهات الجدولة الحالية والسابقة
            </p>
          </div>

          {/* Left side - Search and View Switcher */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0" dir="rtl">
            <div className="flex flex-row items-center gap-4 px-4 py-3 rounded-[10px]">
              <ViewSwitcher view={view} onViewChange={setView} />
              <div className="w-px h-8 bg-gray-300 flex-shrink-0" aria-hidden />
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="بحث"
                variant="default"
                className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
        </div>

        {/* Dropdown Portal */}
        {openDropdownId && dropdownPosition && (() => {
          const pos = dropdownPosition;
          const dropdownHeight = 100;
          const gap = 4;
          // Position above the button so it stays on screen; align right edge with button (RTL)
          const top = Math.max(8, pos.top - dropdownHeight - gap);
          const right = window.innerWidth - pos.right;
          return createPortal(
            <div 
              className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 w-[140px]" 
              dir="rtl" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                zIndex: 9999,
                top: `${top}px`,
                right: `${Math.min(right, window.innerWidth - 150)}px`,
                left: 'auto',
              }}
            >
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (openDropdownId) {
                    const d = originalDirectives.find((x) => x.id === openDropdownId);
                    if (d) {
                      try {
                        await takeDirective(d.id);
                        setOpenDropdownId(null);
                        setDropdownPosition(null);
                        await refetch();
                      } catch (err) {
                        console.error('Error taking directive:', err);
                        setOpenDropdownId(null);
                        setDropdownPosition(null);
                      }
                    }
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs mb-1.5 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: '#F59E0B',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                }}
              >
                <span>الأخذ بالتوجيه</span>
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (openDropdownId) {
                    const d = originalDirectives.find((x) => x.id === openDropdownId);
                    if (d) {
                      openCreateDrawer({
                        directive_id: d.id,
                        directive_text: d.title,
                        related_meeting: d.assignees || '',
                      });
                      try { await requestMeetingFromDirective(d.id); } catch (err) { console.error('Error requesting meeting:', err); }
                    }
                    setOpenDropdownId(null);
                    setDropdownPosition(null);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                style={{
                  background: '#048F86',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                }}
              >
                <span>طلب إجتماع</span>
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>,
            document.body
          );
        })()}

        {/* Sub-tabs: التوجيهات السابقة / التوجيهات الحالية */}
        <div className="flex justify-center my-4">
          <Tabs
            items={[
              { id: 'previous', label: 'التوجيهات السابقة' },
              { id: 'current', label: 'التوجيهات الحالية' },
            ]}
            activeTab={directivesSubTab}
            onTabChange={(id) => setDirectivesSubTab(id as 'current' | 'previous')}
            variant='pill'
          />
        </div>

        {/* Content - Table or Cards */}
        <div className="mt-4">
          {directivesSubTab === 'previous' ? (
            isLoadingPrevious ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : errorPrevious ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
              </div>
            ) : previousDirectives.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center text-gray-600">لا توجد توجيهات سابقة</div>
              </div>
            ) : view === 'table' ? (
              <div style={{ overflow: 'visible' }}>
                <DataTable
                  columns={previousTableColumns}
                  data={previousDirectives}
                  rowPadding="py-2"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full" dir="rtl">
                {previousDirectives.map((directive) => {
                  const isExpanded = expandedDirectiveId === directive.id;
                  const original = originalPreviousDirectives.find((d) => d.id === directive.id);
                  const directiveDate = original?.created_date
                    ? formatDate(original.created_date)
                    : directive.date;
                  return (
                    <div key={directive.id} className="flex flex-col gap-0">
                      <button
                        type="button"
                        onClick={() => setExpandedDirectiveId((id) => (id === directive.id ? null : directive.id))}
                        className={cn(
                          'w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2',
                          isExpanded
                            ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                            : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'
                        )}
                        style={{ fontFamily: "'Almarai', sans-serif" }}
                      >
                        <div className="flex flex-row items-start justify-between gap-4">
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <p className="text-base font-bold text-[#048F86] mb-1">{directive.statusLabel}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{directive.title || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span>تاريخ التوجيه : {directiveDate}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                              <Hash className="w-4 h-4 flex-shrink-0" />
                              <span>رقم التوجيه : {original?.action_number ?? '-'}</span>
                            </span>
                            <span className="flex-shrink-0 text-gray-500" aria-hidden>
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </span>
                          </div>
                        </div>
                      </button>
                      {isExpanded && original && (
                        <div className="mt-0 rounded-b-xl border-2 border-t-0 border-[#048F86] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]" style={{ fontFamily: "'Almarai', sans-serif" }}>
                          <div className="flex flex-col gap-3 text-right">
                            {directive.coordinator && (
                              <p className="text-sm text-gray-700"><span className="font-medium text-gray-800">المسؤولون :</span> {directive.coordinator}</p>
                            )}
                            {original.due_date && (
                              <p className="text-sm text-gray-700"><span className="font-medium text-gray-800">الموعد النهائي :</span> {formatDate(original.due_date)}</p>
                            )}
                            <div className="flex flex-wrap gap-2 justify-end mt-2">
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await takeDirective(original.id);
                                    setExpandedDirectiveId(null);
                                    await refetchPrevious();
                                  } catch (err) {
                                    console.error('Error taking directive:', err);
                                  }
                                }}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                                style={{ background: '#F59E0B', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <span>الأخذ بالتوجيه</span>
                                <X className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  openCreateDrawer({
                                    directive_id: original.id,
                                    directive_text: original.title,
                                    related_meeting: Array.isArray(original.assignees) ? original.assignees.join(', ') : '',
                                  });
                                  try { await requestMeetingFromDirective(original.id); } catch (err) { console.error('Error requesting meeting:', err); }
                                  setExpandedDirectiveId(null);
                                }}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                                style={{ background: '#048F86', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                              >
                                <span>طلب إجتماع</span>
                                <CalendarDays className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
            </div>
          ) : directives.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <div style={{ overflow: 'visible' }}>
                  <DataTable
                    columns={tableColumns}
                    data={directives}
                    rowPadding="py-2"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full" dir="rtl">
                  {directives.map((directive) => {
                    const isExpanded = expandedDirectiveId === directive.id;
                    const original = originalDirectives.find((d) => d.id === directive.id);
                    const directiveDate = original?.due_date ? formatDate(original.due_date) : directive.date;
                    const typeLabel = original?.status === 'CURRENT' ? 'جاري' : 'توجيه';
                    return (
                      <div key={directive.id} className="flex flex-col gap-0">
                        <button
                          type="button"
                          onClick={() => setExpandedDirectiveId((id) => (id === directive.id ? null : directive.id))}
                          className={cn(
                            'w-full text-right z-[2] rounded-xl px-5 py-4 transition-colors border-2',
                            isExpanded
                              ? 'bg-white border-[#048F86] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                              : 'bg-[#F5F6F7] border-gray-200 hover:border-gray-300'
                          )}
                          style={{ fontFamily: "'Almarai', sans-serif" }}
                        >
                          <div className="flex flex-row items-start justify-between gap-4">
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <p className="text-base font-bold text-[#048F86] mb-1">{typeLabel}</p>
                              <p className="text-sm text-gray-700 leading-relaxed">{directive.title || '-'}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>تاريخ التوجيه : {directiveDate}</span>
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-600">
                                <Hash className="w-4 h-4 flex-shrink-0" />
                                <span>رقم التوجيه : {original?.action_number ?? '-'}</span>
                              </span>
                              <span className="flex-shrink-0 text-gray-500" aria-hidden>
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </span>
                            </div>
                          </div>
                        </button>
                        {isExpanded && original && (
                          <div className="mt-0 rounded-b-xl border-2 border-t-0 border-[#048F86] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]" style={{ fontFamily: "'Almarai', sans-serif" }}>
                            <div className="flex flex-col gap-3 text-right">
                              {directive.coordinator && (
                                <p className="text-sm text-gray-700"><span className="font-medium text-gray-800">المسؤولون :</span> {directive.coordinator}</p>
                              )}
                              <div className="flex flex-wrap gap-2 justify-end mt-2">
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await takeDirective(original.id);
                                      setExpandedDirectiveId(null);
                                      await refetch();
                                    } catch (err) {
                                      console.error('Error taking directive:', err);
                                    }
                                  }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                                  style={{ background: '#F59E0B', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                                >
                                  <span>الأخذ بالتوجيه</span>
                                  <X className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    openCreateDrawer({
                                      directive_id: original.id,
                                      directive_text: original.title,
                                      related_meeting: original.assignees || '',
                                    });
                                    try { await requestMeetingFromDirective(original.id); } catch (err) { console.error('Error requesting meeting:', err); }
                                    setExpandedDirectiveId(null);
                                  }}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                                  style={{ background: '#048F86', boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)' }}
                                >
                                  <span>طلب إجتماع</span>
                                  <CalendarDays className="w-4 h-4" />
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

              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
