import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, LayoutList, LayoutGrid, Inbox, AlertCircle, Calendar } from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  DataTable,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
  MeetingCardData,
  CardsGrid,
  TruncatedWithTooltip,
  formatDateArabic,
} from '@/modules/shared';
import { MeetingChannelLabels, getMeetingClassificationLabel } from '@/modules/shared/types';
import { cn } from '@/lib/ui';
import '@/modules/shared/styles';
import {
  getAssignedContentConsultationRequests,
  GetContentConsultationRequestsParams,
  ContentConsultationRequestApiResponse,
} from '../data/contentConsultantApi';
import { mapContentConsultationRequestToCardData } from '../utils/contentConsultantMapper';

const ITEMS_PER_PAGE = 10;

const ContentConsultationRequests: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['content-consultation-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetContentConsultationRequestsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedContentConsultationRequests(params);
    },
  });

  const originalRequests: ContentConsultationRequestApiResponse[] = requestsResponse?.items || [];

  const cardViewRequests: MeetingCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapContentConsultationRequestToCardData);
  }, [requestsResponse]);

  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const formatDate = (dateString: string | null | undefined): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'sequentialNumber',
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => {
        const orig = originalRequests.find((r) => r.id === row.id);
        return (
          <div className="w-full flex justify-center">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {orig?.sequential_number ?? '-'}
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
        const orig = originalRequests.find((r) => r.id === row.id);
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {orig?.request_number || row.id}
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
        <TruncatedWithTooltip title={row.title}>
          {row.title}
        </TruncatedWithTooltip>
      ),
    },
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <TruncatedWithTooltip title={row.coordinator || '-'}>
            {row.coordinator || '-'}
          </TruncatedWithTooltip>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-64',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.date}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'الحالة',
      width: 'w-52',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
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
              navigate(`/content-consultation-request/${row.id}`);
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
              <Icon icon="solar:chat-round-check-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">تقديم استشارة المحتوى</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">يمكنك تقديم استشارة المحتوى للطلبات المحالة إليك</p>
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
        ) : cardViewRequests.length === 0 ? (
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
                data={cardViewRequests}
                onRowClick={(row) => {
                  navigate(`/content-consultation-request/${row.id}`);
                }}
                className="min-w-[1100px]"
              />
            ) : (
              <CardsGrid
                meetings={cardViewRequests}
                onView={(m) => navigate(`/content-consultation-request/${m.id}`)}
                onDetails={(m) => navigate(`/content-consultation-request/${m.id}`)}
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

export default ContentConsultationRequests;
