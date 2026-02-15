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
  TruncatedWithTooltip,
} from '@shared';
import { MeetingClassification, getMeetingClassificationLabel } from '@shared/types';
import '@shared/styles'; // Import shared styles including scrollbar
import { Calendar } from 'lucide-react';
import {
  getAssignedConsultationRequests,
  GetConsultationRequestsParams,
} from '../data/consultationsApi';
import {
  mapConsultationRequestToCardData,
  mapConsultationRequestToCardViewData,
} from '../utils/consultationMapper';
import { ConsultationRequestsGrid, ConsultationRequestCardData } from '../components';

const ITEMS_PER_PAGE = 10;

const ConsultationRequests: React.FC = () => {
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

  // Fetch consultation requests from API
  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['consultation-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetConsultationRequestsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      // Only add search if it's not empty
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedConsultationRequests(params);
    },
  });

  // Store original API response items for table columns
  const originalRequests = requestsResponse?.items || [];

  // Map API response to MeetingCardData (for table view)
  const requests: MeetingCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapConsultationRequestToCardData);
  }, [requestsResponse]);

  // Map API response to ConsultationRequestCardData (for card view)
  const cardViewRequests: ConsultationRequestCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapConsultationRequestToCardViewData);
  }, [requestsResponse]);

  // Calculate total pages from API response
  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'sequentialNumber',
      header: 'بند',
      width: 'w-[100px]',
      render: (row) => {
        // Get sequential number from original data
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const sequentialNumber = originalRequest?.sequential_number
          ? originalRequest.sequential_number.toString()
          : '-';
        return (
          <div className="w-full flex justify-start">
            <TruncatedWithTooltip title={sequentialNumber}>
              {sequentialNumber}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-[300px]',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const requestNumber = originalRequest?.request_number || row.id;
        return (
          <div className="w-full flex justify-start">
            <TruncatedWithTooltip title={requestNumber}>
              {requestNumber}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
    {
      id: 'requestDate',
      header: 'تاريخ الطلب',
      width: 'w-[250px]',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const submittedAt = originalRequest?.submitted_at;
        const requestDate = submittedAt
          ? new Date(submittedAt).toLocaleDateString('ar-SA')
          : '';

        return (
          <div className="w-full flex justify-start">
            <TruncatedWithTooltip title={requestDate || '-'}>
              {requestDate || '-'}
            </TruncatedWithTooltip>
          </div>
        );
      },
    },
    {
      id: 'submitterName',
      header: 'اسم مقدم الطلب',
      width: 'w-[300px]',
      render: (row) => (
          <TruncatedWithTooltip title={row.coordinator || '-'}>
            {row.coordinator || '-'}
          </TruncatedWithTooltip>
      ),
    },
    {
      id: 'meetingSubject',
      header: 'موضوع الاجتماع',
      width: 'w-[320px]',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const subject = originalRequest?.meeting_subject;
        return (
            <TruncatedWithTooltip title={subject || '-'}>
              {subject || '-'}
            </TruncatedWithTooltip>
        );
      },
    },
    {
      id: 'meetingCategory',
      header: 'فئة الاجتماع',
      width: 'w-[240px]',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const classification = originalRequest?.meeting_classification as MeetingClassification | undefined;
        const classificationLabel = classification
          ? getMeetingClassificationLabel(classification)
          : '-';

        return (
            <TruncatedWithTooltip title={classificationLabel}>
              {classificationLabel}
            </TruncatedWithTooltip>
        );
      },
    },
    {
      id: 'meetingDate',
      header: 'تاريخ الاجتماع',
      width: 'w-[300px]',     
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const meetingDate = originalRequest?.scheduled_at
          ? new Date(originalRequest.scheduled_at).toLocaleDateString('ar-SA')
          : '';

        return (
          <div className="flex flex-row justify-start items-center gap-3 w-full min-w-0">
            <span className="block max-w-full text-base font-medium text-right text-gray-900 leading-5 truncate">
              {meetingDate || '-'}
            </span>
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-teal-600" strokeWidth={1.4} />
            </div>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'حالة الطلب',
      width: 'w-[208px]',
      render: (row) => (
          <StatusBadge status={row.status} label={row.statusLabel} />
      ),
    },
    {
      id: 'isDataComplete',
      header: 'البيانات مكتملة؟',
      width: 'w-[220px]',
      render: (row) => {
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const isComplete = originalRequest?.is_data_complete;
        return (
            <span className="block max-w-full text-base font-normal text-right leading-5 truncate text-gray-600">
              {isComplete === true ? 'نعم' : isComplete === false ? 'لا' : '-'}
            </span>
        );
      },
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
            <h1 className="text-3xl font-bold mb-2 text-right">الطلبات التي تتطلب تقديم استشارة</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها
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
                  onRowClick={(row) => navigate(`/consultation-request/${row.id}`)}
                />
              ) : (
                <ConsultationRequestsGrid
                  requests={cardViewRequests}
                  onView={(request) => navigate(`/consultation-request/${request.id}`)}
                  onDetails={(request) => navigate(`/consultation-request/${request.id}`)}
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

export default ConsultationRequests;

