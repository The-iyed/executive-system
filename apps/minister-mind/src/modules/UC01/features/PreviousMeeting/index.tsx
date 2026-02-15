import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, SearchInput, Pagination, ContentBar } from '@shared';
import { useMeetingFormDrawer } from '../MeetingForm/hooks/useMeetingFormDrawer';
import { PAGINATION, createTableColumns } from '../../utils';
import { usePreviousMeetings } from '../../hooks';
import { PATH } from '../../routes/paths';
import '@shared/styles';

const PreviousMeeting: React.FC = () => {
  const navigate = useNavigate();
  const {
    openCreateDrawer,
  } = useMeetingFormDrawer();
  const [searchValue, setSearchValue] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(PAGINATION.DEFAULT_PAGE);

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
    <>
    <ContentBar
      primaryAction={{
        label: 'إنشاء اجتماع',
        variant: 'primary',
        onClick: openCreateDrawer,
      }}
  />
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right text-gray-900">
              قائمة الاجتماعات السابقة
            </h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الاجتماعات السابقة.
            </p>
          </div>
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder="بحث"
            variant="default"
            className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)] p-4"
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
              {/* {view === 'table' ? ( */}
                <div className="w-full overflow-x-auto table-scroll">
                  <div className="min-w-[1400px]">
                    <DataTable
                      columns={tableColumns}
                      data={meetings}
                      onRowClick={(row) =>
                        navigate(PATH.MEETING_PREVIEW.replace(':id', row.id))
                      }
                    />
                  </div>
                </div>
              {/* ) : (
                <CardsGrid
                  meetings={meetings}
                  onView={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                  onDetails={(meeting) => navigate(PATH.MEETING_PREVIEW.replace(':id', meeting.id))}
                />
              )} */}
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
    </>
  );
};

export default PreviousMeeting;