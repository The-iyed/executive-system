import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, CardsGrid, ViewSwitcher, SearchInput, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination } from '@shared';
import { MeetingStatus } from '@shared';
import '@shared/styles';
import { Eye, Calendar } from 'lucide-react';
import { getMeetings, GetMeetingsParams } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';

const ITEMS_PER_PAGE = 10;

const ScheduledMeetings: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('table');
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

  // Fetch scheduled meetings from API
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['scheduled-meetings', 'uc01', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
        status: MeetingStatus.SCHEDULED,
        owner_type: 'SCHEDULING',
      };
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getMeetings(params);
    },
    enabled: true,
  });

  // Map API response to MeetingCardData
  const meetings: MeetingCardData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map((meeting) => {
      const mapped = mapMeetingToCardData(meeting);
      // Convert MeetingDisplayData to MeetingCardData (remove requestNumber)
      return {
        id: mapped.id,
        title: mapped.title,
        date: mapped.date,
        coordinator: mapped.coordinator,
        coordinatorAvatar: mapped.coordinatorAvatar,
        status: mapped.status,
        statusLabel: mapped.statusLabel,
        location: mapped.location,
      };
    });
  }, [meetingsResponse]);

  // Calculate total pages from API response
  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Define table columns
  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.id}
          </span>
        </div>
      ),
    },
    {
      id: 'subject',
      header: 'الموضوع',
      width: 'flex-1',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
          {row.title}
        </span>
      ),
    },
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
          {row.coordinator || 'أحمد محمد'}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-80',
      align: 'end',
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-3 w-full">
          <span className="text-base font-medium text-right text-gray-900 leading-5 whitespace-nowrap">
            {row.date}
          </span>
          <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-teal-600" strokeWidth={1.4} />
          </div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'الحالة',
      width: 'w-52',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-start items-center">
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
              navigate(`/meeting/${row.id}`);
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
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* View Switcher */}
        <div className="flex flex-row items-center justify-between mb-8" dir="ltr">
          <div className="pl-4 flex items-center gap-10">
            <ViewSwitcher view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Page Title, Description, and Search Bar */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">الاجتماعات المجدولة</h1>
            <p className="text-base text-gray-600 text-right">الاطلاع على الاجتماعات المجدولة</p>
          </div>

          <div className="flex-shrink-0">
            <div className="w-[240px] h-[32px]">
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="ادخل البحث"
                variant="default"
                className="w-full h-[32px]"
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
          ) : meetings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <DataTable
                  columns={tableColumns}
                  data={meetings}
                  onRowClick={(row) => navigate(`/meeting/${row.id}`)}
                />
              ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(`/meeting/${meeting.id}`)}
                  onDetails={(meeting) => navigate(`/meeting/${meeting.id}`)}
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

export default ScheduledMeetings;

