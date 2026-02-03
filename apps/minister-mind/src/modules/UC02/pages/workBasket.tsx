import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, CardsGrid, ViewSwitcher, SearchFilterBar, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination } from '@shared';
import { MeetingStatus, MeetingClassification, MeetingClassificationLabels, MeetingStatusLabels } from '@shared';
import '@shared/styles';
import { getAssignedSchedulingRequests, GetMeetingsParams, MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';

const ITEMS_PER_PAGE = 10;

const WorkBasket: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce search input
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

  // Determine API status based on status filter
  const apiStatus = useMemo(() => {
    if (statusFilter === 'all') {
      return undefined;
    }
    return statusFilter;
  }, [statusFilter]);

  // Calculate pagination values
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch assigned scheduling requests from API
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['work-basket', 'uc02', apiStatus, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      if (apiStatus) {
        params.status = apiStatus;
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

  // Format date helper
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

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
      id: 'sequential_number',
      header: 'رقم البند',
      width: 'w-32',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
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
      id: 'meeting_subject',
      header: 'موضوع الاجتماع',
      width: 'min-w-[220px] flex-1',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
          {row.meeting_subject ?? '-'}
        </span>
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
          <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
            {row.submitter_name || (row.current_owner_user ? `${row.current_owner_user.first_name} ${row.current_owner_user.last_name}` : '-')}
          </span>
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
          <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
            {getClassificationLabel(row.meeting_classification)}
          </span>
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
    {
      id: 'is_data_complete',
      header: 'البيانات مكتملة؟',
      width: 'w-40',
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <span className={`text-base font-medium leading-5 ${row.is_data_complete ? 'text-green-600' : 'text-red-600'}`}>
            {row.is_data_complete ? 'نعم' : 'لا'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* Page Title, Description, Search/Filter Bar and View Switcher */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-right">الطلبات الحالية</h1>
            <p className="text-base text-gray-600 text-right">الاطلاع على الطلبات قيد المراجعة</p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-6" dir="ltr">
            <ViewSwitcher view={view} onViewChange={setView} />
            <SearchFilterBar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
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
          ) : rawMeetings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <div className="w-full overflow-x-auto">
                  <DataTable
                    columns={tableColumns}
                    data={rawMeetings}
                    onRowClick={(row) => navigate(PATH.MEETING_DETAIL.replace(':id', row.id))}
                    className="min-w-[900px]"
                  />
                </div>
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

export default WorkBasket;

