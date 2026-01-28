import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchInput, ViewType, Pagination, MeetingStatus } from '@shared';
import { createTableColumns } from '../../utils/createTableColumns';
import { MEETING_TABS, PAGINATION } from '../../utils';
import { useMeetings } from '../../hooks';
import { PATH } from '../../routes/paths';
import '@shared/styles';

const Meeting: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MeetingStatus>(MeetingStatus.UNDER_REVIEW);
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);

  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue, activeTab, statusFilter]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as MeetingStatus);
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
    setStatusFilter('all');
  };

  const { meetings, isLoading, error, totalPages } = useMeetings({
    activeTab,
    searchValue,
    statusFilter,
    currentPage,
  });

  const tableColumns = useMemo(
    () => createTableColumns(navigate),
    [navigate]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
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
            سلة العمل - طلبات قيد المراجعة'
            </h1>
            <p className="text-base text-gray-600 text-right">
            يمكنك الاطلاع على الاجتماعات التي قمت بإنشائها.
            </p>
          </div>
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            variant="default"
          />
        </div>

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