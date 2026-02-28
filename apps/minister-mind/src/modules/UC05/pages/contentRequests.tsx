import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  ViewSwitcher,
  SearchInput,
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
} from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye } from 'lucide-react';
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

  // Define table columns - order is from right to left (RTL)
  // Columns: رقم البند، رقم الطلب، تاريخ الطلب، اسم مقدم الطلب، موضوع الاجتماع، فئة الاجتماع، تاريخ الاجتماع، حالة الاجتماع
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
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="px-6 pt-6 pb-2 flex-shrink-0" dir="rtl">
        <div className="flex flex-row items-start justify-between gap-6">
          {/* Right side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">الطلبات التي تتطلب تقييم المحتوى</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الطلبات التي تتطلب تقديم توجيه
            </p>
          </div>

          {/* Left side - Search and View Switcher (bar styled to match table area) */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0">
            <div
              className="flex flex-row items-center gap-4 px-4 py-3 rounded-[10px]"
              dir="rtl"
            >
              <ViewSwitcher view={view} onViewChange={setView} />
              <div className="w-px h-8 bg-gray-300 flex-shrink-0" aria-hidden />
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="بحث"
                variant="default"
                className="w-[280px] h-[40px] min-w-0 rounded-full! bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6 schedule-review-scroll">
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
            </div>
          ) : originalRequests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <div className="overflow-x-auto -mx-6 px-6" dir="rtl">
                  <DataTable
                    columns={tableColumns}
                    data={originalRequests}
                    onRowClick={(row) => {
                      navigate(`/content-request/${row.id}`);
                    }}
                    className="min-w-[1100px]"
                  />
                </div>
              ) : (
                <ContentRequestsGrid
                  requests={cardViewRequests}
                  onView={(request) => navigate(`/content-request/${request.id}`)}
                  onDetails={(request) => navigate(`/content-request/${request.id}`)}
                />
              )}

              {/* Pagination */}
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
  );
};

export default ContentRequests;

