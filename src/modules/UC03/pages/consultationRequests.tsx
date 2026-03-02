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
  TruncatedWithTooltip,
  formatDateArabic,
  ContentBar,
} from '@/modules/shared';
import { MeetingClassification, getMeetingClassificationLabel } from '@/modules/shared/types';
import '@/modules/shared/styles'; // Import shared styles including scrollbar
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
import { trackEvent } from '@analytics';

const ITEMS_PER_PAGE = 10;

const ConsultationRequests: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    trackEvent('UC-03', 'uc03_consultation_requests_viewed');
  }, []);

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
          ? formatDateArabic(submittedAt)
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
          ? formatDateArabic(originalRequest.scheduled_at)
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
     <div>
      <ContentBar
        showViewSwitcher={true}
        onViewChange={setView}
        view={view}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />
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

export default ConsultationRequests;