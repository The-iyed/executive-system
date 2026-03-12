import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus, MeetingClassificationLabels, MeetingStatusLabels, getMeetingStatusLabel, DataTable, CardsGrid, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination, TruncatedWithTooltip, formatDateArabic } from '@/modules/shared';
import { getAssignedSchedulingRequests, GetMeetingsParams, MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';
import { Icon } from '@iconify/react';
import { Search, LayoutList, LayoutGrid, Inbox, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, Filter, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { Popover, PopoverTrigger, PopoverContent, cn } from '@/lib/ui';

const ITEMS_PER_PAGE = 10;

const WORK_BASKET_STATUS_OPTIONS: string[] = [
  MeetingStatus.UNDER_REVIEW,
  MeetingStatus.UNDER_GUIDANCE,
  MeetingStatus.UNDER_CONTENT_REVIEW,
  MeetingStatus.SCHEDULED,
  MeetingStatus.SCHEDULED_SCHEDULING,
  MeetingStatus.SCHEDULED_CONTENT,
  MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  MeetingStatus.SCHEDULED_DELAYED,
  MeetingStatus.SCHEDULED_DELEGATED,
  MeetingStatus.RETURNED_FROM_SCHEDULING,
  MeetingStatus.RETURNED_FROM_CONTENT,
  MeetingStatus.WAITING,
  MeetingStatus.REJECTED,
  MeetingStatus.CANCELLED,
  MeetingStatus.CLOSED,
];

function getStatusFilterLabel(value: string): string {
  if (value === 'all') return 'جميع الحالات';
  return getMeetingStatusLabel(value);
}

type MeetingClassification = keyof typeof MeetingClassificationLabels;

const WorkBasket: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    trackEvent('UC-02', 'uc02_work_basket_viewed');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilters]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['work-basket', 'uc02', debouncedSearch.trim(), statusFilters, currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
      };
      if (statusFilters.length > 0) {
        params.status_in = statusFilters;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedSchedulingRequests(params);
    },
    enabled: true,
  });

  const meetings: MeetingCardData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  const rawMeetings: MeetingApiResponse[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items;
  }, [meetingsResponse]);

  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const formatDate = (dateString: string | null): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  const getStatusLabel = (status: string): string => {
    return MeetingStatusLabels[status as MeetingStatus] || status;
  };

  /* ─── Filter options: use full status list so "قيد المراجعة - محتوى" (UNDER_CONTENT_REVIEW) appears; getMeetingTabsByRole collapses it into RETURNED_FROM_CONTENT ─── */
  const filterTabs = [
    { id: 'all', label: 'جميع الحالات', count: totalItems },
    ...WORK_BASKET_STATUS_OPTIONS.map((status) => ({
      id: status,
      label: getMeetingStatusLabel(status),
      count: meetings.filter((m) => m.status === status).length,
    })),
  ];


  const tableColumns: TableColumn<MeetingApiResponse>[] = [
    {
      id: 'request_number',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-sm text-[var(--color-text-gray-600)]">{row.request_number}</span>
        </div>
      ),
    },
    {
      id: 'meeting_subject',
      header: 'عنوان الاجتماع',
      width: 'min-w-[220px] flex-1',
      align: 'end',
      render: (row) => (
        <TruncatedWithTooltip title={row.meeting_subject ?? '-'}>
          {row.meeting_subject ?? '-'}
        </TruncatedWithTooltip>
      ),
    },
    {
      id: 'submitter_name',
      header: 'اسم مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <TruncatedWithTooltip title={row.submitter_name || (row.current_owner_user ? `${row.current_owner_user.first_name} ${row.current_owner_user.last_name}` : '-')}>
            {row.submitter_name || (row.current_owner_user ? `${row.current_owner_user.first_name} ${row.current_owner_user.last_name}` : '-')}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'meeting_classification',
      header: 'فئة الاجتماع',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <TruncatedWithTooltip title={getClassificationLabel(row.meeting_classification)}>
            {getClassificationLabel(row.meeting_classification)}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'scheduled_at',
      header: 'تاريخ الاجتماع',
      width: 'w-40',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-sm text-[var(--color-text-gray-600)]">{formatDate(row.scheduled_at)}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'حالة الاجتماع',
      width: 'w-52',
      align: 'end',
      render: (row) => {
        const status = row.status as MeetingStatus;
        const statusLabel = getStatusLabel(row.status);
        return (
          <div className="w-full flex justify-start items-center">
            <StatusBadge status={status} label={statusLabel} />
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-0" dir="rtl">

      {/* ════════════════════════════════════════ */}
      {/* PAGE HEADER — Title + Search + Actions  */}
      {/* ════════════════════════════════════════ */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Right: Title area */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]">
              <Icon icon="solar:inbox-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">سلة العمل</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">إدارة ومتابعة الطلبات المسندة إليك</p>
            </div>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-2">
            {/* Multi-status filter */}
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  'h-10 px-3 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all',
                  statusFilters.length > 0
                    ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-200)] text-[var(--color-primary-700)]'
                    : 'bg-white border-[var(--color-base-gray-200)] text-[var(--color-text-gray-600)] hover:border-[var(--color-base-gray-300)]'
                )}>
                  <Filter className="w-4 h-4" />
                  <span>{statusFilters.length > 0 ? `${statusFilters.length} حالة` : 'تصفية الحالة'}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-2" dir="rtl">
                <div className="flex flex-col gap-0.5">
                  {filterTabs.filter(t => t.id !== 'all').map((tab) => {
                    const isChecked = statusFilters.includes(tab.id);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setStatusFilters(prev =>
                            isChecked ? prev.filter(s => s !== tab.id) : [...prev, tab.id]
                          );
                        }}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                          isChecked
                            ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
                            : 'text-[var(--color-text-gray-600)] hover:bg-[var(--color-base-gray-50)]'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                            isChecked
                              ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)]'
                              : 'border-[var(--color-base-gray-300)]'
                          )}>
                            {isChecked && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {statusFilters.length > 0 && (
                  <button
                    onClick={() => setStatusFilters([])}
                    className="w-full mt-2 pt-2 border-t border-[var(--color-base-gray-100)] text-xs text-[var(--color-text-gray-500)] hover:text-[var(--color-primary-600)] transition-colors text-center py-1.5"
                  >
                    مسح الكل
                  </button>
                )}
              </PopoverContent>
            </Popover>

            {/* Active filter chips */}
            {statusFilters.length > 0 && (
              <div className="flex items-center gap-1">
                {statusFilters.map(id => {
                  const tab = filterTabs.find(t => t.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-[var(--color-primary-50)] text-[var(--color-primary-700)] text-xs font-medium"
                    >
                      {tab?.label}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-[var(--color-primary-900)]"
                        onClick={() => setStatusFilters(prev => prev.filter(s => s !== id))}
                      />
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-gray-500)]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="بحث في الطلبات..."
                className="h-10 pr-10 pl-4 rounded-xl bg-white border border-[var(--color-base-gray-200)] text-sm text-[var(--color-text-gray-700)] placeholder:text-[var(--color-text-gray-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]/20 transition-all w-[220px]"
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
          </div>
        </div>
      </div>


      {/* ════════════════════════════════════════ */}
      {/*     CONTENT                              */}
      {/* ════════════════════════════════════════ */}
      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[var(--color-text-gray-600)]">جاري التحميل...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>حدث خطأ أثناء تحميل البيانات</span>
            </div>
          </div>
        ) : rawMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-base-gray-100)] flex items-center justify-center">
              <Inbox className="w-7 h-7 text-[var(--color-text-gray-500)]" />
            </div>
            <p className="text-sm text-[var(--color-text-gray-500)]">لا توجد طلبات</p>
          </div>
        ) : (
          <>
            {view === 'table' ? (
              <DataTable
                columns={tableColumns}
                data={rawMeetings}
                onRowClick={(row) => navigate(PATH.MEETING_DETAIL.replace(':id', row.id))}
                className="min-w-[900px]"
              />
            ) : (
              <CardsGrid
                meetings={meetings}
                onView={(meeting) => navigate(PATH.MEETING_DETAIL.replace(':id', meeting.id))}
                onDetails={(meeting) => navigate(PATH.MEETING_DETAIL.replace(':id', meeting.id))}
              />
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
  );
};

export default WorkBasket;

