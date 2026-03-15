import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, LayoutList, LayoutGrid, Inbox, AlertCircle, Calendar } from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  DataTable,
  MeetingCardData,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
  TruncatedWithTooltip,
  formatDateArabic,
} from '@/modules/shared';
import { MeetingClassification, getMeetingClassificationLabel } from '@/modules/shared/types';
import { cn } from '@/lib/ui';
import '@/modules/shared/styles';
import {
  getAssignedConsultationRequests,
  GetConsultationRequestsParams,
} from '../data/consultationsApi';
import {
  mapConsultationRequestToCardData,
} from '../utils/consultationMapper';
import { CardsGrid } from '@/modules/shared';
import { trackEvent } from '@/lib/analytics';

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
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['consultation-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetConsultationRequestsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedConsultationRequests(params);
    },
  });

  const originalRequests = requestsResponse?.items || [];

  const requests: MeetingCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapConsultationRequestToCardData);
  }, [requestsResponse]);


  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'sequentialNumber',
      header: 'بند',
      width: 'w-[100px]',
      render: (row) => {
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
    <div className="flex flex-col w-full min-h-0" dir="rtl">

      {/* ════════════════════════════════════════ */}
      {/* PAGE HEADER — Title + Search + Actions  */}
      {/* ════════════════════════════════════════ */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Right: Title area */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]">
              <Icon icon="solar:chat-round-check-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">طلبات الاستشارات</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">يمكنك تقديم الاستشارات للطلبات المحالة إليك</p>
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
        ) : requests.length === 0 ? (
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
                data={requests}
                onRowClick={(row) => navigate(`/consultation-request/${row.id}`)}
              />
            ) : (
              <CardsGrid
                meetings={requests}
                onView={(meeting) => navigate(`/consultation-request/${meeting.id}`)}
                onDetails={(meeting) => navigate(`/consultation-request/${meeting.id}`)}
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

export default ConsultationRequests;
