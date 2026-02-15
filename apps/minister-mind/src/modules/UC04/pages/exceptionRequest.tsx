import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  ViewSwitcher,
  SearchInput,
  MeetingCardData,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
} from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye, Calendar } from 'lucide-react';
import {
  getContentExceptions,
  GetGuidanceRequestsParams,
} from '../data/guidanceApi';
import {
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
} from '@shared/types';
import {
  mapGuidanceRequestToCardData,
  mapGuidanceRequestToCardViewData,
} from '../utils/guidanceMapper';
import { GuidanceRequestsGrid, GuidanceRequestCardData } from '../components';

const ITEMS_PER_PAGE = 10;

const ExceptionRequest: React.FC = () => {
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

  // Fetch guidance requests from API
  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['exception-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetGuidanceRequestsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      // Only add search if it's not empty
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getContentExceptions(params);
    },
  });

  // Store original API response items for table columns
  const originalRequests = requestsResponse?.items || [];

  // Map API response to MeetingCardData (for table view)
  const requests: MeetingCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapGuidanceRequestToCardData);
  }, [requestsResponse]);

  // Map API response to GuidanceRequestCardData (for card view)
  const cardViewRequests: GuidanceRequestCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapGuidanceRequestToCardViewData);
  }, [requestsResponse]);

  // Calculate total pages from API response
  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Define table columns - order is from right to left (RTL)
  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'sequentialNumber',
      header: 'رقم البند',
      width: 'w-32',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const sequentialNumber = originalRequest?.sequential_number
          ? originalRequest.sequential_number.toString()
          : '-';
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {sequentialNumber}
            </span>
          </div>
        );
      },
    },
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const requestNumber = originalRequest?.request_number || row.id;
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {requestNumber}
            </span>
          </div>
        );
      },
    },
    {
      id: 'requestDate',
      header: 'تاريخ الطلب',
      width: 'w-64',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        let requestDate = '-';
        if (originalRequest?.created_at) {
          const date = new Date(originalRequest.created_at);
          requestDate = new Intl.DateTimeFormat('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            calendar: 'islamic',
            numberingSystem: 'arab',
          }).format(date);
        }
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {requestDate}
            </span>
          </div>
        );
      },
    },
    {
      id: 'title',
      header: 'عنوان الاجتماع',
      width: 'flex-1',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      id: 'coordinator',
      header: 'اسم مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.coordinator || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'meetingCategory',
      header: 'فئة الاجتماع',
      width: 'w-48',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const typeLabel = getMeetingClassificationTypeLabel(originalRequest?.meeting_classification_type);
        const classLabel = getMeetingClassificationLabel(originalRequest?.meeting_classification ?? '');
        const category = typeLabel !== '-' ? typeLabel : classLabel || '-';

        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {category}
            </span>
          </div>
        );
      },
    },
    {
      id: 'meetingDate',
      header: 'تاريخ الاجتماع',
      width: 'w-60',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const meetingDate = originalRequest?.scheduled_at
          ? new Date(originalRequest.scheduled_at).toLocaleDateString('ar-SA')
          : '-';

        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {meetingDate}
            </span>
          </div>
        );
      },
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-72',
      align: 'end',
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-3 w-full min-w-0">
          <span className="text-base font-medium text-right text-gray-900 leading-5 whitespace-nowrap overflow-visible">
            {row.date}
          </span>
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-teal-600" strokeWidth={1.4} />
          </div>
        </div>
      ),
    },
    {
      id: 'isDataComplete',
      header: 'بيانات مكتملة',
      width: 'w-36',
      align: 'end',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const value = originalRequest?.is_data_complete ?? false;
        return (
          <div className="w-full flex justify-start">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {value ? 'نعم' : 'لا'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'الحالة',
      width: 'w-52',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-start">
          <StatusBadge status={row.status} label={row.statusLabel} />
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
              navigate(`/exception-request/${row.id}`);
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
            <h1 className="text-3xl font-bold mb-2 text-right">طلب استثناء</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الطلبات التي تتطلب تقديم استثناء
            </p>
          </div>

          {/* Left side - Search and View Switcher */}
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
                className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
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
          ) : requests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <DataTable
                  columns={tableColumns}
                  data={requests}
                  onRowClick={(row) => navigate(`/exception-request/${row.id}`)}
                />
              ) : (
                <GuidanceRequestsGrid
                  requests={cardViewRequests}
                  onView={(request) => navigate(`/exception-request/${request.id}`)}
                  onDetails={(request) => navigate(`/exception-request/${request.id}`)}
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

export default ExceptionRequest;
