import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, LayoutList, LayoutGrid, Inbox, AlertCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  DataTable,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
  MeetingClassification,
  MeetingClassificationLabels,
  MeetingStatus,
  MeetingStatusLabels,
  TruncatedWithTooltip,
  formatDateArabic,
} from '@/modules/shared';
import { cn } from '@/lib/ui';
import '@/modules/shared/styles';
import {
  getAssignedContentRequests,
  GetContentRequestsParams,
  ContentRequestApiResponse,
} from '../data/contentApi';
import { mapContentRequestToCardViewData } from '../utils/contentMapper';
import { ContentRequestsGrid, ContentRequestCardData } from '../components';

const ITEMS_PER_PAGE = 10;

const ContentRequests: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

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

  // Calculate pagination values
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch content requests from API
  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['content-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetContentRequestsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      // Only add search if it's not empty
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedContentRequests(params);
    },
  });

  // Store original API response items for table
  const originalRequests: ContentRequestApiResponse[] = requestsResponse?.items || [];

  // Map API response to ContentRequestCardData (for card view)
  const cardViewRequests: ContentRequestCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapContentRequestToCardViewData);
  }, [requestsResponse]);

  // Calculate total pages from API response
  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const formatDate = (dateString: string | null | undefined): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  // Get classification label
  const getClassificationLabel = (classification: string | null | undefined): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    return MeetingStatusLabels[status as MeetingStatus] ?? status;
  };

  const tableColumns: TableColumn<ContentRequestApiResponse>[] = [
    {
      id: 'sequential_number',
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.sequential_number ?? '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'request_number',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.request_number}
          </span>
        </div>
      ),
    },
    {
      id: 'created_at',
      header: 'تاريخ الطلب',
      width: 'w-64',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      id: 'submitter_name',
      header: 'اسم مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <TruncatedWithTooltip title={row.submitter_name || '-'}>
            {row.submitter_name || '-'}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'meeting_subject',
      header: 'موضوع الاجتماع',
      width: 'flex-1',
      align: 'end',
      render: (row) => (
        <TruncatedWithTooltip title={row.meeting_subject || '-'}>
          {row.meeting_subject || '-'}
        </TruncatedWithTooltip>
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
      id: 'meeting_date',
      header: 'تاريخ الاجتماع',
      width: 'w-64',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {formatDate(row.scheduled_at ?? row.submitted_at)}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'حالة الاجتماع',
      width: 'w-52',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <StatusBadge status={row.status} label={getStatusLabel(row.status)} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 'w-28',
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/content-request/${row.id}`);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-600" strokeWidth={1.67} />
          </button>
        </div>
      ),
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
              <Icon icon="solar:document-text-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">تقييم المحتوى وإضافة التوجيهات</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">يمكنك تقييم المحتوى وإضافة التوجيهات</p>
            </div>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-2">
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
        ) : originalRequests.length === 0 ? (
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
                data={originalRequests}
                onRowClick={(row) => {
                  navigate(`/content-request/${row.id}`);
                }}
                className="min-w-[1100px]"
              />
            ) : (
              <ContentRequestsGrid
                requests={cardViewRequests}
                onView={(request) => navigate(`/content-request/${request.id}`)}
                onDetails={(request) => navigate(`/content-request/${request.id}`)}
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

export default ContentRequests;
