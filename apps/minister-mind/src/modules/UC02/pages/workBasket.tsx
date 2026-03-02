import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MeetingStatus, MeetingClassificationLabels, MeetingStatusLabels, getMeetingStatusLabel, DataTable, CardsGrid, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination, TruncatedWithTooltip, formatDateArabic, ContentBar, MeetingOwnerType, getMeetingTabsByRole  } from '@shared';
import { getAssignedSchedulingRequests, GetMeetingsParams, MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';
import { trackEvent } from '@analytics';

const ITEMS_PER_PAGE = 10;

const WORK_BASKET_STATUS_OPTIONS: string[] = [
  MeetingStatus.UNDER_REVIEW,
  MeetingStatus.UNDER_GUIDANCE,
  MeetingStatus.UNDER_CONTENT_REVIEW,
  MeetingStatus.SCHEDULED,
  MeetingStatus.SCHEDULED_SCHEDULING,
  MeetingStatus.SCHEDULED_CONTENT,
  MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
  MeetingStatus.SCHEDULED_DELAYED,
  MeetingStatus.SCHEDULED_DELEGATED,
  MeetingStatus.RETURNED_FROM_SCHEDULING,
  MeetingStatus.RETURNED_FROM_CONTENT,
  MeetingStatus.WAITING,
  MeetingStatus.REJECTED,
  MeetingStatus.CANCELLED,
  MeetingStatus.CLOSED,
];

function getStatusFilterLabel(value: string): string {
  if (value === 'all') return 'جميع الحالات';
  return getMeetingStatusLabel(value);
}

const WorkBasket: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    trackEvent('UC-02', 'uc02_work_basket_viewed');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['work-basket', 'uc02', debouncedSearch.trim(), statusFilter, currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedSchedulingRequests(params);
    },
    enabled: true,
  });

  // Map API response to MeetingCardData for cards view
  const meetings: MeetingCardData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  // Raw meetings data for table view
  const rawMeetings: MeetingApiResponse[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items;
  }, [meetingsResponse]);

  // Calculate total pages from API response
  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const formatDate = (dateString: string | null): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  // Get classification label
  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  // Get status label
  const getStatusLabel = (status: string): string => {
    return MeetingStatusLabels[status as MeetingStatus] || status;
  };

  // Define table columns
  const tableColumns: TableColumn<MeetingApiResponse>[] = [
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
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {formatDate(row.scheduled_at)}
          </span>
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
    <div>
      <ContentBar
        showViewSwitcher={true}
        onViewChange={setView}
        view={view}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filterTabs={[ {id: 'all', label: 'جميع الحالات'}, ...getMeetingTabsByRole(MeetingOwnerType.SCHEDULING)]}
        activeFilterId={statusFilter}
        onFilterChange={setStatusFilter}
      />

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
            </div>
          ) : rawMeetings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
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
  );
};

export default WorkBasket;

