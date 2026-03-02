import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Pagination, ViewType, CardsGrid, ContentBar } from '@/modules/shared';
import { PAGINATION, createTableColumns } from '../../utils';
import { usePreviousMeetings } from '../../hooks';
import { PATH } from '../../routes/paths';

const PreviousMeeting: React.FC = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);
  const [view, setView] = useState<ViewType>('cards');

  useEffect(() => {
    setCurrentPage(PAGINATION.DEFAULT_PAGE);
  }, [searchValue]);

  const { meetings, isLoading, error, totalPages } = usePreviousMeetings({
    searchValue,
    currentPage,
  });

  const tableColumns = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGINATION.ITEMS_PER_PAGE;
    return createTableColumns(navigate, { startIndex });
  }, [navigate, currentPage]);

  return (
      <div>
        <ContentBar
          showViewSwitcher={true}
          onViewChange={setView}
          view={view}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
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
                  onRowClick={(row) =>
                    navigate(PATH.MEETING_PREVIEW.replace(':id', row.id))
                  }
                />
              ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                  onDetails={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
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

export default PreviousMeeting;