import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchFilterBar, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination, SearchInput } from '@shared';
import { MeetingStatus } from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye } from 'lucide-react';
import { getMeetings, GetMeetingsParams, getAssignedSchedulingRequests } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';

const ITEMS_PER_PAGE = 10;

const ScheduleReview: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('work-basket');
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

  // Reset to page 1 when search, tab, or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeTab, statusFilter]);

  const tabs = [
    {
      id: 'scheduled-meetings',
      label: 'الاجتماعات المجدولة',
    },
    {
      id: 'work-basket',
      label: 'سلة العمل',
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1); // Reset to first page when tab changes
  };

  // Determine API status based on active tab
  // For scheduled-meetings tab, always use SCHEDULED status
  // For work-basket tab, use statusFilter or default to UNDER_REVIEW
  const apiStatus = useMemo(() => {
    if (activeTab === 'scheduled-meetings') {
      // Always use SCHEDULED for scheduled meetings tab
      return MeetingStatus.SCHEDULED;
    }
    // For work-basket tab, use statusFilter or default to UNDER_REVIEW
    if (activeTab === 'work-basket') {
      if (statusFilter === 'all') {
        return undefined;
      }
      return statusFilter;
    }
    return undefined;
  }, [activeTab, statusFilter]);
  // Calculate pagination values
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch meetings from API
  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', activeTab, apiStatus, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      // Always add status (apiStatus is always defined based on tab)
      if (apiStatus) {
        params.status = apiStatus;
      }
      // Only add search if it's not empty
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      // Use assigned scheduling endpoint for work-basket tab
      if (activeTab === 'work-basket') {
        return getAssignedSchedulingRequests(params);
      }
      // For scheduled meetings fetch meetings filtered by status SCHEDULED and owner_type
      if (activeTab === 'scheduled-meetings') {
        params.status = MeetingStatus.SCHEDULED;
        params.owner_type = 'SCHEDULING';
        return getMeetings(params);
      }
      return getMeetings(params);
    },
    enabled: true, // Always enabled, status is optional
  });

  // Map API response to MeetingCardData
  const meetings: MeetingCardData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  // Calculate total pages from API response
  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Auto-switch to scheduled-meetings tab when all cases with UNDER_REVIEW status are removed
  useEffect(() => {
    // Only check when on work-basket tab and not loading
    if (
      activeTab === 'work-basket' &&
      !isLoading &&
      (statusFilter === 'all' || statusFilter === MeetingStatus.UNDER_REVIEW) &&
      apiStatus === MeetingStatus.UNDER_REVIEW
    ) {
      // Check if there are no more cases with UNDER_REVIEW status
      if (totalItems === 0 && meetings.length === 0) {
        // Switch to scheduled-meetings tab immediately
        // This will change activeTab, which will change apiStatus to SCHEDULED
        // and prevent further queries with UNDER_REVIEW
        setActiveTab('scheduled-meetings');
      }
    }
  }, [activeTab, isLoading, statusFilter, totalItems, meetings.length, apiStatus]);

  // Define table columns - order is from left to right (will be displayed RTL)
  // First column will appear on the rightmost side in RTL layout

  // Define table columns - order is from right to left (RTL)
  // First column (requestNumber) will appear on the rightmost side
  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-48', // Fixed width for request number - rightmost in RTL
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
      width: 'flex-1', // Flexible width to fill remaining space
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
      width: 'w-56', // Fixed width for coordinator
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
      width: 'w-72', // Fixed width for date
      align: 'end',
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-3 w-full">
          <span className="text-base font-medium text-right text-gray-900 leading-5 whitespace-nowrap">
            {row.date}
          </span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'الحالة',
      width: 'w-42', // Fixed width for status
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
      width: 'w-28', // Fixed width for actions - leftmost in RTL
      align: 'center',
      render: (row) => (
        <div className="w-full flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(PATH.MEETING_DETAIL.replace(':id', row.id));
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
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* Tabs and View Switcher */}
        <div className="flex flex-row items-center justify-between mb-8" dir="ltr">
          <div className="pl-4 flex items-center gap-10">
            <ViewSwitcher view={view} onViewChange={setView} />
          </div>
          <Tabs
            items={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Page Title, Description, and Search/Filter Bar */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          {/* Left side - Title and Description */}
          <div>
            <h1 className="text-3xl font-bold mb-2 text-right">
              {activeTab === 'work-basket' ? 'سلة العمل - طلبات قيد المراجعة' : 'الاجتماعات المجدولة'}
            </h1>
            <p className="text-base text-gray-600 text-right">
              {activeTab === 'work-basket' 
                ? 'الاطلاع على الطلبات قيد المراجعة' 
                : 'الاطلاع على الاجتماعات المجدولة'}
            </p>
          </div>

          {/* Right side - Search and Filter Bar */}
          <div className="flex-shrink-0">
            {activeTab === 'scheduled-meetings' ? (
              // For scheduled meetings, only show search input (no status filter)
              <div className="w-[240px] h-[32px]">
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="ادخل البحث"
                  variant="default"
                  className="w-full h-[32px]"
                />
              </div>
            ) : (
              // For work-basket, show full SearchFilterBar with status filter
              <SearchFilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            )}
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

export default ScheduleReview;
