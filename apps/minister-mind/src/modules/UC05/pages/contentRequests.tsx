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
  const [view, setView] = useState<ViewType>('table');
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

  // Format date in Arabic Islamic format: الجمعة، ١٠ رمضان ١٤٤٧ هـ
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'islamic',
        numberingSystem: 'arab',
      }).format(date);
    } catch {
      return dateString;
    }
  };

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
      header: 'رقم البند',
      width: 'w-32',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
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
          <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full truncate">
            {row.submitter_name || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'meeting_subject',
      header: 'موضوع الاجتماع',
      width: 'flex-1',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full truncate">
          {row.meeting_subject || '-'}
        </span>
      ),
    },
    {
      id: 'meeting_classification',
      header: 'فئة الاجتماع',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full truncate">
            {getClassificationLabel(row.meeting_classification)}
          </span>
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
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* Page Title, Description, Search/Filter Bar, and View Switcher */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          {/* Right side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">الطلبات التي تتطلب تقييم المحتوى</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الطلبات التي تتطلب تقديم توجيه
            </p>
          </div>

          {/* Left side - Search and View Switcher */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0" dir="ltr">
            <div className="flex flex-row items-center gap-9">
              <ViewSwitcher view={view} onViewChange={setView} />
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="بحث"
                variant="default"
                className="w-[300px]"
              />
            </div>
          </div>
        </div>


        {/* Content - Table or Cards */}
        <div className="mt-4">
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

