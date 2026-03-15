import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, CardsGrid, MeetingCardData, ViewType, TableColumn, Pagination, TruncatedWithTooltip, formatDateArabic, MeetingStatus, StatusBadge, MeetingStatusLabels } from '@/modules/shared';
import { MeetingClassification, MeetingClassificationLabels } from '@/modules/shared';
import { getMeetings, GetMeetingsParams, MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';
import { cn } from '@/lib/ui';
import { Icon } from '@iconify/react';
import { Search, LayoutList, LayoutGrid, Inbox, CheckCircle2, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const ScheduledMeetings: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['scheduled-meetings', 'uc02', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
        status: MeetingStatus.CLOSED,
        owner_type: 'SCHEDULING',
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getMeetings(params);
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


  const tableColumns: TableColumn<MeetingApiResponse>[] = [
    {
      id: 'sequential_number',
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <span className="text-sm text-[var(--color-text-gray-600)]">{row.sequential_number || '-'}</span>
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
      {/* PAGE HEADER */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]">
              <Icon icon="solar:calendar-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">الاجتماعات السابقة</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">الاطلاع على الاجتماعات السابقة</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-gray-500)]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="بحث في الاجتماعات..."
                className="h-10 pr-10 pl-4 rounded-xl bg-white border border-[var(--color-base-gray-200)] text-sm text-[var(--color-text-gray-700)] placeholder:text-[var(--color-text-gray-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]/20 transition-all w-[220px]"
              />
            </div>

          </div>
        </div>
      </div>


      {/* CONTENT */}
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
            <p className="text-sm text-[var(--color-text-gray-500)]">لا توجد اجتماعات</p>
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

export default ScheduledMeetings;
