import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, Input, Badge, Loader } from '@sanad-ai/ui';
import EyeIcon from '../../assets/eye.svg';
import SearchIcon from '../../assets/search-lg.svg';
import { PdfCard, Pagination } from '../../components';
import { Case } from './mockCases';
import { useNavigate } from 'react-router-dom';
import { PATH } from '../../routes/path';
import { useCases } from '../../hooks/use-cases';
import { useUrlParams } from '../../hooks/use-url-params';
import { useDebounce } from '../../hooks/use-debounce';


const CaseCard: React.FC<{ case: Case }> = ({ case: caseItem }) => {
  const navigate = useNavigate();
  const isAnalyzing = caseItem.status === 'analyzing';

  const handleViewCaseFiles = () => {
    navigate(PATH.CASE_FILES.replace(':conversation_id', caseItem.conversation_id));
  };

  return (
    <Card
      className={`relative overflow-hidden border-[1.239px] rounded-[15px] bg-white box-shadow-[0_1.239px_3.718px_0_rgba(16,24,40,0.10),_0_1.239px_2.479px_0_rgba(16,24,40,0.06)] ${
        isAnalyzing
          ? 'border-[#027A48]'
          : 'border-[#EAECF0]'
      }`}
    >
      <CardContent className="p-6">
        {/* Status Badge/Icon */}
        <div className="absolute top-4 left-4 z-10">
          {isAnalyzing ? (
            <Badge
              className="bg-[#ECFDF3] text-[#027A48] border-0 rounded-[16px] px-3 py-1.5 text-xs font-semibold"
              
            >
              بصدد التحليل
            </Badge>
          ) : (
            <button
              className="flex items-center justify-center w-[45px] h-[45px] rounded-md bg-gradient-to-b from-[#077371] to-[#044241]"
              onClick={handleViewCaseFiles}
            >
              <img src={EyeIcon} alt="عرض"/>
            </button>
          )}
        </div>

        <h3
          className="text-lg font-bold text-right mb-2 pr-0 mt-0 text-[#1A1A1A]"
          
        >
          {caseItem.title}
        </h3>

        <p
          className="text-sm text-[#666] text-right mb-4 leading-relaxed"
          
        >
          {caseItem.description}
        </p>

        <div className="flex flex-row overflow-x-auto gap-[25px] pdf-scroll-container">
          {caseItem.documents.map((doc, index) => (
            <PdfCard
              key={index}
              name={doc.name}
              size={doc.size}
            />
          ))}
        </div>
        <style>{`
          .pdf-scroll-container {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
          .pdf-scroll-container::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mt-4 h-[8px] w-full bg-[#F5F5F5] rounded-[67px] relative">
              <div
                className="h-full bg-[#00A79D] rounded-[67px] transition-all duration-300"
                style={{ width: `${caseItem.progress || 0}%` }}
              />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Cases: React.FC = () => {
  const urlParams = useUrlParams();
  const limit = 4; // Number of cases per page

  // Get values from URL params
  const currentPage = urlParams.getNumberParam('page', 1);
  const searchQuery = urlParams.getParam('search', '');
  const skip = (currentPage - 1) * limit;

  // Local state for search input (for immediate UI feedback)
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Debounce search query (500ms delay)
  const debouncedSearch = useDebounce(searchInput, 500);

  // Sync local search input with URL param on mount
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      urlParams.setParams({
        search: debouncedSearch || null,
        page: debouncedSearch !== searchQuery ? 1 : currentPage, // Reset to page 1 when search changes
      });
    }
  }, [debouncedSearch, searchQuery, currentPage, urlParams]);

  // Fetch and manage cases with pagination and backend search
  const {
    cases,
    pagination,
    isLoading,
    isError,
    error,
  } = useCases({
    skip,
    limit,
    sort_by: 'created_at',
    sort_order: -1,
    search: debouncedSearch,
  });

  const handlePageChange = useCallback((page: number) => {
    urlParams.setParam('page', page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [urlParams]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    // Note: URL will be updated automatically via debounce effect
  }, []);

  return (
    <div className="w-full min-h-full px-12 pt-8 pb-8" dir="rtl">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h1
            className="text-3xl font-bold text-right mb-2 text-[#1A1A1A]"
            
          >
            القضايا
          </h1>
          <p
            className="text-base text-[#666] text-right leading-relaxed"
            
          >
            يمكنك الاطلاع على قائمة القضايا المحفوظة في النظام.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mr-8 flex-shrink-0 search-input-wrapper w-[460px]">
          <img
            src={SearchIcon}
            alt="بحث"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none z-10 search-icon"
          />
          <Input
            type="text"
            placeholder="بحث"
            value={searchInput}
            onChange={handleSearchChange}
            className="flex pr-10 pl-4 bg-white text-right text-base focus-visible:ring-2 focus-visible:ring-[#00A79D] focus-visible:ring-offset-2 search-input w-[460px] h-[46px] rounded-[10.217px] border-[1.277px] border-[#D0D5DD] box-shadow-[0_1.277px_2.554px_0_rgba(16,24,40,0.05)] placeholder:text-[#667085]"
            
          />
          <style>{`
            .search-input-wrapper .search-icon {
              filter: brightness(0) saturate(100%) invert(42%) sepia(8%) saturate(1018%) hue-rotate(187deg) brightness(95%) contrast(88%);
            }
          `}</style>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 min-h-[400px]">
          <Loader size={32} className="mb-4 text-[#00A79D]" />
          <p className="text-[#666]">
            جاري التحميل...
          </p>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12 min-h-[400px]">
          <div className="p-4 bg-red-50 border border-red-200 rounded-[8px] text-center max-w-md">
            <p className="text-[14px] text-red-600">
              خطأ: {error?.message || 'حدث خطأ أثناء تحميل القضايا'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {cases.length === 0 ? (
            <div className="flex items-center justify-center py-12 min-h-[400px]">
              <p className="text-[#666] text-center">
                {debouncedSearch.trim() ? 'لا توجد نتائج للبحث' : 'لا توجد قضايا متاحة'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6 mb-8">
                {cases.map((caseItem: Case) => (
                  <CaseCard key={caseItem.id} case={caseItem} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Cases;
