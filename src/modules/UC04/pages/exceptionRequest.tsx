import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  MeetingCardData,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
  formatDateArabic,
  ContentBar,
} from '@/modules/shared';
import '@/modules/shared/styles'; // Import shared styles including scrollbar
import { Eye, Calendar, Search } from 'lucide-react';
import {
  getContentExceptions,
  GetGuidanceRequestsParams,
} from '../data/guidanceApi';
import {
  getMeetingClassificationLabel,
  getMeetingClassificationTypeLabel,
} from '@/modules/shared/types';
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
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const sequentialNumber = originalRequest?.sequential_number
          ? originalRequest.sequential_number.toString()
          : '-';
        return (
          <div className="w-full flex justify-center">
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
          requestDate = formatDateArabic(originalRequest.created_at) || '-';
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
          ? formatDateArabic(originalRequest.scheduled_at)
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
    <div>
      <div className="flex items-center justify-between gap-2 px-6 pt-6 pb-4">
        <div></div>
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
      </div>
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
  );
};

export default ExceptionRequest;
