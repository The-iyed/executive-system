import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DataTable,
  ViewSwitcher,
  SearchInput,
  MeetingCardData,
  ViewType,
  TableColumn,
  StatusBadge,
  Pagination,
} from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getAssignedContentConsultationRequests,
  GetContentConsultationRequestsParams,
  ContentConsultationRequestApiResponse,
  Attachment,
} from '../data/contentConsultantApi';
import {
  mapContentConsultationRequestToCardData,
} from '../utils/contentConsultantMapper';
import pdfIcon from '../../shared/assets/pdf.svg';

const ITEMS_PER_PAGE = 10;

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round(bytes / (1024 * 1024))} MB`;
};

// Custom Card Component with Attachments Carousel
interface ContentConsultationCardProps {
  request: ContentConsultationRequestApiResponse;
  onView?: () => void;
  onDetails?: () => void;
}

const ContentConsultationCard: React.FC<ContentConsultationCardProps> = ({
  request,
  onView,
  onDetails,
}) => {
  const navigate = useNavigate();
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);
  const attachments = request.attachments || [];

  const handleCardClick = () => {
    if (onDetails) {
      onDetails();
    }
  };

  const cardData = mapContentConsultationRequestToCardData(request);

  const nextAttachment = () => {
    if (attachments.length > 0) {
      setCurrentAttachmentIndex((prev) => (prev + 1) % attachments.length);
    }
  };

  const prevAttachment = () => {
    if (attachments.length > 0) {
      setCurrentAttachmentIndex((prev) => (prev - 1 + attachments.length) % attachments.length);
    }
  };

  return (
    <div
      className="box-border flex flex-col items-start bg-white rounded-[11.36px] w-full p-1 gap-2 shadow-[0px_2.52357px_20.8195px_rgba(58,168,124,0.25)] cursor-pointer hover:shadow-[0px_4px_24px_rgba(58,168,124,0.35)] transition-shadow"
      dir="rtl"
      onClick={handleCardClick}
    >
      {/* Card Content Frame */}
      <div className="flex flex-col items-start p-0 w-full gap-1.5">
        {/* Main Content Area */}
        <div className="relative bg-white rounded-lg overflow-hidden w-full h-36">
          {/* Background Blur Effect */}
          <div
            className="absolute rounded-full bg-[#A6D8C1]"
            style={{
              width: '194px',
              height: '182px',
              left: '-35px',
              top: '4px',
              filter: 'blur(54px)',
              transform: 'rotate(-90deg)',
            }}
          />

          {/* Content Frame - Centered */}
          <div className="absolute flex flex-col items-end p-0 w-[calc(100%-22px)] max-w-[338px] h-[110px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
            {/* Title, Date, and Coordinator */}
            <div className="flex flex-col items-end p-0 w-full gap-2.5">
              {/* Title and Status Badge - Same row */}
              <div className="flex flex-row justify-between items-center p-0 w-full gap-3">
                <h3
                  className="text-right flex-1 text-black font-semibold leading-7"
                  style={{
                    fontFamily: "'Somar Sans', sans-serif",
                    fontSize: '18px',
                  }}
                >
                  {cardData.title}
                </h3>
                {/* Status Badge - Right aligned */}
                <div className="flex flex-row justify-center items-center px-2.5 py-0.5 h-5 rounded-[77px] bg-[rgba(255,162,162,0.12)] flex-shrink-0">
                  <span className="text-xs font-medium text-[#D13C3C] leading-4" style={{ fontFamily: "'Somar Sans', sans-serif" }}>
                    {cardData.statusLabel}
                  </span>
                </div>
              </div>
              {/* Date */}
              <div className="flex flex-col items-start p-0 w-full">
                <p
                  className="text-right w-full text-[#2C2C2C] font-normal text-xs leading-[19px]"
                  style={{
                    fontFamily: "'Ping AR + LT', sans-serif",
                  }}
                >
                  {cardData.date}
                </p>
              </div>

              {/* Coordinator - Right aligned, no avatar */}
              {cardData.coordinator && (
                <div className="flex flex-row items-center justify-start w-full">
                  <span
                    className="text-right text-sm font-medium text-[#344054] leading-5"
                    style={{
                      fontFamily: "'Somar Sans', sans-serif",
                    }}
                  >
                    {cardData.coordinator}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attachments Carousel - Under the user card */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-2 w-full px-2">
            <div className="flex flex-row items-center justify-between w-full">
              <h4
                className="text-sm font-medium text-gray-700"
                style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
              >
                المرفقات ({attachments.length})
              </h4>
              {attachments.length > 1 && (
                <div className="flex flex-row items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevAttachment();
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentAttachmentIndex + 1} / {attachments.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextAttachment();
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-row items-center gap-3 px-2 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {attachments[currentAttachmentIndex] && (
                <>
                  <div className="flex flex-row items-center justify-between flex-shrink-0">
                    {attachments[currentAttachmentIndex].file_type?.toLowerCase() === 'pdf' ? (
                      <img src={pdfIcon} alt="pdf" className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="flex items-center justify-center w-10 h-10 bg-[#E2E5E7] rounded-md text-xs font-semibold text-[#B04135]">
                        {attachments[currentAttachmentIndex].file_type?.toUpperCase() || ''}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end flex-1 min-w-0">
                    <span
                      className="text-sm font-medium text-[#344054] text-right truncate w-full"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                      title={attachments[currentAttachmentIndex].file_name}
                    >
                      {attachments[currentAttachmentIndex].file_name}
                    </span>
                    <span
                      className="text-xs text-[#475467] text-right"
                      style={{ fontFamily: "'Ping AR + LT', sans-serif" }}
                    >
                      {formatFileSize(attachments[currentAttachmentIndex].file_size)}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(attachments[currentAttachmentIndex].blob_url, '_blank');
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-200 transition-colors"
                      title="عرض"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <a
                      href={attachments[currentAttachmentIndex].blob_url}
                      download={attachments[currentAttachmentIndex].file_name}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-200 transition-colors"
                      title="تحميل"
                    >
                      <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="box-border flex flex-col justify-center items-center bg-white border border-[#EDEDED] rounded-lg w-full h-9 p-1.5 gap-1.5 shadow-[0px_2.52357px_11.4192px_rgba(0,0,0,0.1)]">
          <div className="flex flex-row justify-between items-center p-0 w-full h-7 gap-1.5">
            {/* Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="flex flex-row items-center gap-1.5 p-0 hover:opacity-80 transition-opacity"
            >
              <span
                className="text-right text-sm font-normal text-[#344054] leading-4"
                style={{
                  fontFamily: "'Ping AR + LT', sans-serif",
                }}
              >
                تفاصيل
              </span>
              <ChevronLeft className="w-[15px] h-[15px] text-[#344054]" />
            </button>
            {/* Eye Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onView) {
                  onView();
                } else {
                  handleCardClick();
                }
              }}
              className="flex flex-row justify-center items-center rounded-md hover:bg-gray-200 transition-colors w-7 h-7 bg-[#F6F6F6]"
            >
              <Eye className="w-5 h-5 text-[#475467]" strokeWidth={1.67} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentConsultationRequests: React.FC = () => {
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

  // Fetch content consultation requests from API
  const { data: requestsResponse, isLoading, error } = useQuery({
    queryKey: ['content-consultation-requests', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetContentConsultationRequestsParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      // Only add search if it's not empty
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return getAssignedContentConsultationRequests(params);
    },
  });

  // Store original API response items for table columns
  const originalRequests = requestsResponse?.items || [];

  // Map API response to MeetingCardData (for table view)
  const requests: MeetingCardData[] = useMemo(() => {
    if (!requestsResponse?.items) return [];
    return requestsResponse.items.map(mapContentConsultationRequestToCardData);
  }, [requestsResponse]);

  // Calculate total pages from API response
  const totalItems = requestsResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Define table columns - order is from right to left (RTL)
  // Columns: رقم البند, رقم الطلب, عنوان الاجتماع, مقدم الطلب, تاريخ الإرسال, الحالة
  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'sequentialNumber',
      header: 'رقم البند',
      width: 'w-32',
      align: 'end',
      render: (row) => {
        // Get sequential number from original data
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const sequentialNumber = originalRequest?.sequential_number
          ? originalRequest.sequential_number.toString()
          : '-';
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {sequentialNumber}
            </span>
          </div>
        );
      },
    },
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-48',
      align: 'end',
      render: (row) => {
        // Get request number from original data
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const requestNumber = originalRequest?.request_number || row.id;
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {requestNumber}
            </span>
          </div>
        );
      },
    },
    {
      id: 'title',
      header: 'عنوان الاجتماع',
      width: 'flex-1',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {row.coordinator || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-72',
      align: 'end',
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-3 w-full min-w-0">
          <span className="text-base font-medium text-right text-gray-900 leading-5 whitespace-nowrap overflow-visible">
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
        <div className="w-full flex justify-end">
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
              navigate(`/content-consultation-request/${row.id}`);
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
        {/* Page Title, Description, Search/Filter Bar, and View Switcher */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          {/* Right side - Title and Description */}
          <div className="flex-1">
           
            <h2 className="text-xl font-semibold mb-2 text-right">الطلبات التي تتطلب تقديم استشارة المحتوى</h2>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الطلبات التي تتطلب إضافة إفادات
            </p>
          </div>

          {/* Left side - Search and View Switcher */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0" dir="ltr">
            <div className="flex flex-row items-center gap-9">
              <ViewSwitcher view={view} onViewChange={setView} />
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="بحث"
                variant="default"
                className="w-[300px]"
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
          ) : requests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <DataTable
                  columns={tableColumns}
                  data={requests}
                  onRowClick={(row) => {
                    navigate(`/content-consultation-request/${row.id}`);
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {originalRequests.map((request) => (
                    <div key={request.id} className="w-full flex justify-center">
                      <ContentConsultationCard
                        request={request}
                        onView={() => {
                          navigate(`/content-consultation-request/${request.id}`);
                        }}
                        onDetails={() => {
                          navigate(`/content-consultation-request/${request.id}`);
                        }}
                      />
                    </div>
                  ))}
                </div>
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

export default ContentConsultationRequests;

