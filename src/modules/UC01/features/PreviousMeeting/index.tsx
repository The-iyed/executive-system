import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutList, LayoutGrid, Inbox, AlertCircle } from 'lucide-react';
import { DataTable, Pagination, ViewType, CardsGrid, cn } from '@/modules/shared';
import { Icon } from '@iconify/react';
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
    <div className="flex flex-col w-full min-h-0" dir="rtl">
      {/* PAGE HEADER */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Right: Title area */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[var(--color-primary-50)]">
              <Icon icon="solar:calendar-bold" width={22} height={22} className="text-[var(--color-primary-500)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-gray-900)]">الاجتماعات السابقة</h1>
              <p className="text-xs text-[var(--color-text-gray-500)] mt-0.5">الاطلاع على الاجتماعات السابقة</p>
            </div>
          </div>

          {/* Left: Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-gray-500)]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="بحث..."
                className="h-10 pr-10 pl-4 rounded-xl bg-white border border-[var(--color-base-gray-200)] text-sm text-[var(--color-text-gray-700)] placeholder:text-[var(--color-text-gray-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)]/20 transition-all w-[220px]"
              />
            </div>

            {/* View switcher */}
            <div className="flex items-center bg-white rounded-xl border border-[var(--color-base-gray-200)] p-1 gap-0.5">
              <button
                onClick={() => setView('cards')}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                  view === 'cards' ? 'bg-[var(--color-primary-500)] text-white shadow-sm' : 'text-[var(--color-text-gray-500)] hover:bg-[var(--color-base-gray-50)]'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all',
                  view === 'table' ? 'bg-[var(--color-primary-500)] text-white shadow-sm' : 'text-[var(--color-text-gray-500)] hover:bg-[var(--color-base-gray-50)]'
                )}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[var(--color-text-gray-600)]">جاري التحميل...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>حدث خطأ أثناء تحميل البيانات</span>
            </div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-base-gray-100)] flex items-center justify-center">
              <Inbox className="w-7 h-7 text-[var(--color-text-gray-500)]" />
            </div>
            <p className="text-sm text-[var(--color-text-gray-500)]">لا توجد بيانات</p>
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
    </div>
  );
};

export default PreviousMeeting;
