import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, CardsGrid, ViewSwitcher, SearchInput, MeetingCardData, ViewType, TableColumn, Pagination, TruncatedWithTooltip, formatDateArabic } from '@shared';
import { MeetingClassification, MeetingClassificationLabels } from '@shared';
import '@shared/styles';
import { getWaitingList, GetMeetingsParams, MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';

const ITEMS_PER_PAGE = 10;

const WaitingList: React.FC = () => {
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

  // Fetch waiting list items from API
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['waiting-list', 'uc02', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getWaitingList(params);
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

  // Define table columns
  const tableColumns: TableColumn<MeetingApiResponse>[] = [
    {
      id: 'sequential_number',
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.sequential_number || '-'}
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
      width: 'w-40',
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
          <TruncatedWithTooltip title={row.submitter_name || (row.current_owner_user ? `${row.current_owner_user.first_name} ${row.current_owner_user.last_name}` : '-')}>
            {row.submitter_name || (row.current_owner_user ? `${row.current_owner_user.first_name} ${row.current_owner_user.last_name}` : '-')}
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
        <TruncatedWithTooltip title={row.meeting_subject}>
          {row.meeting_subject}
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
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="px-6 pt-6 pb-2 flex-shrink-0" dir="rtl">
        <div className="flex flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">قائمة الانتظار</h1>
            <p className="text-base text-gray-600 text-right">
              الاطلاع على طلبات قائمة الانتظار
            </p>
          </div>

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
                />
              ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(PATH.MEETING_DETAIL.replace(':id', meeting.id))}
                  onDetails={(meeting) => navigate(PATH.MEETING_DETAIL.replace(':id', meeting.id))}
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

export default WaitingList;
