import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchInput, ViewType, Pagination } from '@shared';
import { MeetingStatus } from '@shared';
import '@shared/styles';
import { useMeetings } from '../../hooks';
import { createTableColumns } from '../../utils/tableColumns';
import { MEETING_TABS, DEFAULT_TAB, PAGE_INFO, PAGINATION } from '../../utils/constants';

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(DEFAULT_TAB);
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);

  // Reset to page 1 when search, tab, or status filter changes
  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue, activeTab, statusFilter]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
    setStatusFilter('all'); // Reset status filter when tab changes
  };

  // Fetch meetings using custom hook
  const { meetings, isLoading, error, totalPages } = useMeetings({
    activeTab,
    searchValue,
    statusFilter,
    currentPage,
  });

  // Create table columns (memoized to avoid recreation on each render)
  const tableColumns = useMemo(() => createTableColumns(navigate), [navigate]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* Tabs and View Switcher */}
        <div className="flex flex-row items-center justify-between mb-8">
          <Tabs
            items={MEETING_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
          <div className="pl-4">
            <ViewSwitcher view={view} onViewChange={setView} />
          </div>
        </div>

        {/* Page Title, Description, and Search/Filter Bar */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6">
          {/* Left side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right text-gray-900">
              {PAGE_INFO.title}
            </h1>
            <p className="text-base text-gray-600 text-right">
              {PAGE_INFO.description}
            </p>
          </div>

          {/* Right side - Search Input */}
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                // placeholder="بحث"
                variant="default"
                // className="w-full h-[32px]"
              />
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

export default Meeting;
