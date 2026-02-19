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
import { MeetingChannelLabels, getMeetingClassificationLabel } from '@shared/types';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye, CalendarDays, MapPin, User, Hash, Layers, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';
import {
  getAssignedContentConsultationRequests,
  GetContentConsultationRequestsParams,
  ContentConsultationRequestApiResponse,
} from '../data/contentConsultantApi';
import {
  mapContentConsultationRequestToCardData,
} from '../utils/contentConsultantMapper';

const ITEMS_PER_PAGE = 10;

const fontStyle = { fontFamily: "'Almarai', sans-serif" } as const;

const pillStyle = {
  borderRadius: '12px',
  background: '#FFFFFF',
  boxShadow: '0px 3.79px 18.75px 0px rgba(0, 0, 0, 0.08)',
} as const;

const iconCircleStyle = {
  background: '#FFFFFF',
  border: '1px solid #EAECF0',
  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
} as const;

const CardTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-right z-50">
        <p className="whitespace-pre-wrap break-words text-[12px]">{text}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

const getLocationLabel = (value?: string): string | undefined => {
  if (!value) return undefined;
  return MeetingChannelLabels[value] || value;
};

const formatCardDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
};

// Custom Card Component matching unified design
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
  const handleCardClick = () => {
    if (onDetails) {
      onDetails();
    }
  };

  const cardData = mapContentConsultationRequestToCardData(request);
  const meetingCategory = getMeetingClassificationLabel(request.meeting_classification);
  const location = getLocationLabel(request.meeting_channel);
  const meetingDate = formatCardDate(request.scheduled_at);

  return (
    <div
      className="group relative flex flex-col bg-white w-full overflow-hidden cursor-pointer hover:shadow-[0px_4px_16px_rgba(16,24,40,0.12)] transition-all duration-200 border-[1.5px] border-[rgba(230,236,245,1)]"
      style={{
        borderRadius: '16px',
        boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
      }}
      dir="rtl"
      onClick={handleCardClick}
    >
      {/* Card Body */}
      <div className="flex flex-col gap-4 p-5" style={fontStyle}>
        {/* Row 1: Title + Status + Data Complete */}
        <div className="flex flex-row items-start justify-between gap-3">
          <CardTooltip text={cardData.title}>
            <h3
              className="text-right flex-1 text-[#101828] font-bold leading-6 line-clamp-2"
              style={{ ...fontStyle, fontSize: '15px' }}
            >
              {cardData.title}
            </h3>
          </CardTooltip>
          <div className="flex flex-row items-center gap-1.5 flex-shrink-0">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium whitespace-nowrap"
              style={{
                background: request.is_data_complete ? 'rgba(4, 143, 134, 0.08)' : 'rgba(255, 162, 162, 0.12)',
                color: request.is_data_complete ? '#048F86' : '#D13C3C',
                ...fontStyle,
              }}
            >
              {request.is_data_complete ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {request.is_data_complete ? 'مكتمل' : 'غير مكتمل'}
            </span>
            <StatusBadge status={cardData.status} label={cardData.statusLabel} />
          </div>
        </div>

        {/* Row 2: Submitter */}
        {cardData.coordinator && (
          <CardTooltip text={cardData.coordinator}>
            <div className="flex flex-row items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#F2F4F7] border-2 border-[rgba(217,217,217,1)]">
                <User className="h-4 w-4 text-[#98A2B3]" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-[#344054] leading-5 truncate">{cardData.coordinator}</span>
            </div>
          </CardTooltip>
        )}

        {/* Pills: single vertical stack */}
        <div className="flex flex-col items-stretch gap-2.5 w-full">
          {request.request_number && (
            <CardTooltip text={request.request_number}>
              <div className="flex flex-row items-center gap-2.5 px-3 py-2 w-full" style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <Hash className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-[#98A2B3] leading-3">رقم الطلب</span>
                  <span className="text-[12px] text-[#344054] leading-4">{request.request_number}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          <CardTooltip text={cardData.date}>
            <div className="flex flex-row items-center gap-2.5 px-3 py-2 w-full" style={pillStyle}>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] text-[#98A2B3] leading-3">التاريخ</span>
                <span className="text-[12px] text-[#344054] leading-4">{cardData.date}</span>
              </div>
            </div>
          </CardTooltip>
          {meetingCategory !== '-' && (
            <CardTooltip text={meetingCategory}>
              <div className="flex flex-row items-center gap-2.5 px-3 py-2 w-full" style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <Layers className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-[#98A2B3] leading-3">فئة الاجتماع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{meetingCategory}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          {location && (
            <CardTooltip text={location}>
              <div className="flex flex-row items-center gap-2.5 px-3 py-2 w-full" style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <MapPin className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-[#98A2B3] leading-3">الموقع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{location}</span>
                </div>
              </div>
            </CardTooltip>
          )}
          {request.scheduled_at && (
            <CardTooltip text={meetingDate}>
              <div className="flex flex-row items-center gap-2.5 px-3 py-2 w-full" style={pillStyle}>
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={iconCircleStyle}>
                  <CalendarDays className="h-4 w-4 text-[#667085]" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-[#98A2B3] leading-3">تاريخ الاجتماع</span>
                  <span className="text-[12px] text-[#344054] leading-4">{meetingDate}</span>
                </div>
              </div>
            </CardTooltip>
          )}
        </div>
      </div>

      {/* Hover Action Bar - glass overlay from left */}
      <div
        className="absolute top-0 left-0 z-10 flex w-12 h-full items-center justify-center -translate-x-full transition-transform duration-200 ease-in-out group-hover:translate-x-0"
        style={{ background: 'rgba(159, 183, 167, 0.1)', backdropFilter: 'blur(16.62px)' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onView ? onView() : handleCardClick(); }}
          className="flex items-center justify-center rounded-full w-8 h-8 bg-white shadow-md hover:bg-[#F2F4F7] transition-colors"
        >
          <Eye className="w-[18px] h-[18px] text-[#475467]" strokeWidth={1.67} />
        </button>
      </div>
    </div>
  );
};

const ContentConsultationRequests: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('cards');
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
      header: '#',
      width: 'w-32',
      align: 'center',
      render: (row) => {
        // Get sequential number from original data
        const originalRequest = originalRequests.find((r) => r.id === row.id);
        const sequentialNumber = originalRequest?.sequential_number
          ? originalRequest.sequential_number.toString()
          : '-';
        return (
          <div className="w-full flex justify-center">
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
      <div className="px-6 pt-6 pb-2 flex-shrink-0" dir="rtl">
        <div className="flex flex-row items-start justify-between gap-6">
          {/* Right side - Title and Description */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2 text-right">الطلبات التي تتطلب تقديم استشارة المحتوى</h2>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على الطلبات التي تتطلب إضافة إفادات
            </p>
          </div>

          {/* Left side - Search and View Switcher (bar styled to match table area) */}
          <div className="flex flex-col items-end gap-4 flex-shrink-0">
            <div
              className="flex flex-row items-center gap-4 px-4 py-3 rounded-[10px]"
              dir="rtl"
            >
              <ViewSwitcher view={view} onViewChange={setView} />
              <div className="w-px h-8 bg-gray-300 flex-shrink-0" aria-hidden />
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder="بحث"
                variant="default"
                className="w-[280px] min-w-0 rounded-full bg-white border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              />
            </div>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 min-[1440px]:grid-cols-3 gap-4 w-full">
                  {originalRequests.map((request) => (
                    <ContentConsultationCard
                      key={request.id}
                      request={request}
                      onView={() => {
                        navigate(`/content-consultation-request/${request.id}`);
                      }}
                      onDetails={() => {
                        navigate(`/content-consultation-request/${request.id}`);
                      }}
                    />
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

