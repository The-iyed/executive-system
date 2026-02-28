import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchFilterBar, MeetingCardData, ViewType, TableColumn, StatusBadge, Pagination, SearchInput, TruncatedWithTooltip, formatDateArabic } from '@shared';
import { MeetingStatus, MeetingClassificationLabels, MeetingStatusLabels } from '@shared';
import type { MeetingClassification } from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye } from 'lucide-react';
import { getMeetings, GetMeetingsParams, getAssignedSchedulingRequests, getPreviousMeetingsFromExecutionSystem, type MeetingApiResponse } from '../data/meetingsApi';
import { mapMeetingToCardData } from '../utils/meetingMapper';
import { PATH } from '../routes/paths';

const ITEMS_PER_PAGE = 10;

const ScheduleReview: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('work-basket');
  const [view, setView] = useState<ViewType>('cards');
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
      label: 'الاجتماعات السابقة',
    },
    {
      id: 'work-basket',
      label: 'الطلبات الحالية',
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(1); // Reset to first page when tab changes
  };

  // API status: for work-basket use statusFilter (undefined when 'all'); for scheduled-meetings use CLOSED (like before redesign)
  const apiStatus = useMemo(() => {
    if (activeTab === 'scheduled-meetings') return MeetingStatus.CLOSED;
    if (activeTab === 'work-basket') {
      if (statusFilter === 'all') return undefined;
      return statusFilter;
    }
    return undefined;
  }, [activeTab, statusFilter]);

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: meetingsResponse, isLoading, error } = useQuery({
    queryKey: ['meetings', activeTab, apiStatus, debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetMeetingsParams = {
        skip,
        limit: ITEMS_PER_PAGE,
      };
      if (apiStatus) {
        params.status = apiStatus;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (activeTab === 'work-basket') {
        return getAssignedSchedulingRequests(params);
      }
      if (activeTab === 'scheduled-meetings') {
        return getPreviousMeetingsFromExecutionSystem({ skip, limit: ITEMS_PER_PAGE });
      }
      return getMeetings(params);
    },
    enabled: true,
  });

  // Map API response to MeetingCardData
  const meetings: MeetingCardData[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items.map(mapMeetingToCardData);
  }, [meetingsResponse]);

  // Raw meetings for work-basket table (to show meeting_subject, فئة الاجتماع)
  const rawMeetings: MeetingApiResponse[] = useMemo(() => {
    if (!meetingsResponse?.items) return [];
    return meetingsResponse.items;
  }, [meetingsResponse]);

  // Get classification label for work-basket table
  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  const formatDate = (dateString: string | null): string =>
    dateString ? (formatDateArabic(dateString) || '-') : '-';

  // Calculate total pages from API response
  const totalItems = meetingsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Auto-switch to scheduled-meetings tab when all UNDER_REVIEW items are gone (like before redesign)
  useEffect(() => {
    if (
      activeTab === 'work-basket' &&
      !isLoading &&
      (statusFilter === 'all' || statusFilter === MeetingStatus.UNDER_REVIEW) &&
      apiStatus === MeetingStatus.UNDER_REVIEW &&
      totalItems === 0 &&
      meetings.length === 0
    ) {
      setActiveTab('scheduled-meetings');
    }
  }, [activeTab, isLoading, statusFilter, apiStatus, totalItems, meetings.length]);

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
        <TruncatedWithTooltip title={row.title}>
          {row.title}
        </TruncatedWithTooltip>
      ),
    },
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56', // Fixed width for coordinator
      align: 'end',
      render: (row) => (
        <TruncatedWithTooltip title={row.coordinator || 'أحمد محمد'}>
          {row.coordinator || 'أحمد محمد'}
        </TruncatedWithTooltip>
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

  // Table columns for الطلبات الحالية (work-basket)
  const workBasketTableColumns: TableColumn<MeetingApiResponse>[] = [
    {
      id: 'request_number',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">{row.request_number}</span>
        </div>
      ),
    },
    {
      id: 'meeting_subject',
      header: 'عنوان الاجتماع',
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
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <TruncatedWithTooltip title={row.submitter_name || '-'}>
          {row.submitter_name || '-'}
        </TruncatedWithTooltip>
      ),
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-40',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">{formatDate(row.submitted_at || row.created_at)}</span>
      ),
    },
    {
      id: 'status',
      header: 'الحالة',
      width: 'w-42',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-start items-center">
          <StatusBadge status={row.status as MeetingStatus} label={MeetingStatusLabels[row.status as MeetingStatus] || row.status} />
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
      <div className="px-6 pt-6 pb-2 flex-shrink-0" dir="rtl">
        <div className="flex flex-row items-center justify-between mb-6">
          <Tabs
            items={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
        <div className="flex flex-row items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-right">
              {activeTab === 'work-basket' ? 'الطلبات الحالية' : 'الاجتماعات المجدولة'}
            </h1>
            <p className="text-base text-gray-600 text-right">
              {activeTab === 'work-basket'
                ? 'الاطلاع على الطلبات الحالية'
                : 'الاطلاع على الاجتماعات المجدولة'}
            </p>
          </div>
          <div className="flex-shrink-0">
            {activeTab === 'scheduled-meetings' ? (
              <div className="w-[240px] h-[32px]">
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="ادخل البحث"
                  variant="default"
                  className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                />
              </div>
            ) : (
              <SearchFilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
              />
            )}
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
          ) : meetings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                activeTab === 'work-basket' ? (
                  <DataTable
                    columns={workBasketTableColumns}
                    data={rawMeetings}
                    onRowClick={(row) => navigate(PATH.MEETING_DETAIL.replace(':id', row.id))}
                  />
                ) : (
                  <DataTable
                    columns={tableColumns}
                    data={meetings}
                    onRowClick={(row) => navigate(PATH.MEETING_DETAIL.replace(':id', row.id))}
                  />
                )
              ) : (
                <CardsGrid
                  meetings={meetings}
                  hideStatus={false}
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
