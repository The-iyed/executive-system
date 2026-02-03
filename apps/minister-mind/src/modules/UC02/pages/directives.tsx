import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable, ViewSwitcher, SearchInput, MeetingCardData, ViewType, TableColumn, Pagination, Tabs } from '@shared';
import { MeetingClassification, MeetingClassificationLabels } from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { MoreVertical, X, ChevronLeft } from 'lucide-react';
import { getDirectives, getPreviousDirectives, GetDirectivesParams, Directive, closeDirective, cancelDirective, getMeetingById, MeetingApiResponse } from '../data/meetingsApi';
import { mapDirectiveToCardData } from '../utils/directiveMapper';

const ITEMS_PER_PAGE = 10;

// Custom Directives Cards Grid Component with Actions
interface DirectivesCardsGridProps {
  directives: MeetingCardData[];
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  dropdownRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onCloseDirective: (directiveId: string, directiveText: string, relatedMeeting: string) => void | Promise<void>;
}

const DirectivesCardsGrid: React.FC<DirectivesCardsGridProps & { refetch: () => Promise<any> }> = ({
  directives,
  openDropdownId,
  setOpenDropdownId,
  dropdownRefs,
  refetch,
  onCloseDirective,
}) => {
  const renderActionsDropdown = (directive: MeetingCardData) => {
    const isOpen = openDropdownId === directive.id;
    return (
      <div className="relative" ref={(el) => (dropdownRefs.current[directive.id] = el)} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpenDropdownId(isOpen ? null : directive.id);
          }}
          className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-200 transition-colors bg-[#F6F6F6]"
        >
          <MoreVertical className="w-5 h-5 text-[#475467]" strokeWidth={1.67} />
        </button>
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 z-[100] bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 w-[140px]" dir="rtl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await cancelDirective(directive.id);
                  setOpenDropdownId(null);
                  await refetch();
                } catch (error) {
                  console.error('Error cancelling directive:', error);
                  setOpenDropdownId(null);
                }
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs mb-1.5 transition-all hover:scale-105 active:scale-95"
              style={{
                background: '#F59E0B',
                boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
              }}
            >
              <span>إلغاء التوجيه</span>
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await onCloseDirective(directive.id, directive.title || '', directive.coordinator || '');
                setOpenDropdownId(null);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
              style={{
                background: '#DC2626',
                boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
              }}
            >
              <span>إغلاق التوجيه</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {directives.map((directive) => (
        <div key={directive.id} className="w-full flex justify-center">
          <div
            className="box-border flex flex-col items-start bg-white rounded-[11.36px] w-full max-w-[432.79px] p-1 gap-2 shadow-[0px_2.52357px_20.8195px_rgba(58,168,124,0.25)] cursor-pointer hover:shadow-[0px_4px_24px_rgba(58,168,124,0.35)] transition-shadow"
            dir="rtl"
          >
            <div className="flex flex-col items-start p-0 w-full gap-1.5">
              <div className="relative bg-white rounded-lg overflow-hidden w-full h-36">
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
                <div className="absolute flex flex-col items-end p-0 w-[calc(100%-22px)] max-w-[338px] h-[110px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-4">
                  <div className="flex flex-col items-end p-0 w-full gap-2.5">
                    <div className="flex flex-row justify-between items-center p-0 w-full gap-3">
                      <h3 className="text-right flex-1 text-black font-semibold leading-7" style={{ fontFamily: "'Somar Sans', sans-serif", fontSize: '18px' }}>
                        {directive.title}
                      </h3>
                      <div className="flex flex-row justify-center items-center px-2.5 py-0.5 h-5 rounded-[77px] bg-[rgba(255,162,162,0.12)] flex-shrink-0">
                        <span className="text-xs font-medium text-[#D13C3C] leading-4" style={{ fontFamily: "'Somar Sans', sans-serif" }}>
                          {directive.statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start p-0 w-full">
                      <p className="text-right w-full text-[#2C2C2C] font-normal text-xs leading-[19px]" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                        {directive.date}
                      </p>
                    </div>
                    {directive.coordinator && (
                      <div className="flex flex-row items-center justify-start w-full">
                        <span className="text-right text-sm font-medium text-[#344054] leading-5" style={{ fontFamily: "'Somar Sans', sans-serif" }}>
                          {directive.coordinator}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="box-border flex flex-col justify-center items-center bg-white border border-[#EDEDED] rounded-lg w-full h-9 p-1.5 gap-1.5 shadow-[0px_2.52357px_11.4192px_rgba(0,0,0,0.1)]">
                <div className="flex flex-row justify-between items-center p-0 w-full h-7 gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex flex-row items-center gap-1.5 p-0 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-right text-sm font-normal text-[#344054] leading-4" style={{ fontFamily: "'Ping AR + LT', sans-serif" }}>
                      تفاصيل
                    </span>
                    <ChevronLeft className="w-[15px] h-[15px] text-[#344054]" />
                  </button>
                  {renderActionsDropdown(directive)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Directives: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; right: number; bottom: number } | null>(null);
  const [directivesSubTab, setDirectivesSubTab] = useState<'current' | 'previous'>('current');

  const handleCloseDirectiveNavigate = async (directiveId: string, directiveText: string, relatedMeeting: string) => {
    await closeDirective(directiveId);
    navigate(
      `/uc08/meetings/new?directive_id=${encodeURIComponent(directiveId)}&directive_text=${encodeURIComponent(directiveText)}&related_meeting=${encodeURIComponent(relatedMeeting)}`
    );
  };

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        const dropdown = dropdownRefs.current[openDropdownId];
        const target = event.target as Node;
        if (dropdown && !dropdown.contains(target)) {
          // Check if click is on the portal dropdown
          const portalDropdown = document.querySelector('[style*="z-index: 9999"]');
          if (!portalDropdown || !portalDropdown.contains(target)) {
            setOpenDropdownId(null);
            setDropdownPosition(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Close dropdown when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true); // Use capture phase to catch all scroll events
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId]);

  // Calculate pagination values
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch directives from API
  const { data: directivesResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['directives', debouncedSearch.trim(), currentPage],
    queryFn: () => {
      const params: GetDirectivesParams = {
        skip: skip,
        limit: ITEMS_PER_PAGE,
      };
      return getDirectives(params);
    },
  });

  // Store original API response items for table columns
  const originalDirectives: Directive[] = directivesResponse?.items || [];

  // Fetch previous directives (التوجيهات السابقة)
  const { data: previousDirectivesResponse, isLoading: isLoadingPrevious, error: errorPrevious } = useQuery({
    queryKey: ['directives-previous', 0, 100],
    queryFn: () => getPreviousDirectives({ skip: 0, limit: 100 }),
    enabled: directivesSubTab === 'previous',
  });
  const originalPreviousDirectives: Directive[] = previousDirectivesResponse?.items || [];
  const previousDirectives: MeetingCardData[] = useMemo(() => {
    if (!previousDirectivesResponse?.items) return [];
    return previousDirectivesResponse.items.map(mapDirectiveToCardData);
  }, [previousDirectivesResponse]);

  // Fetch related meeting data for directives that have related_meeting_request_id
  const meetingIds = useMemo(() => {
    return originalDirectives
      .filter(d => d.related_meeting_request_id)
      .map(d => d.related_meeting_request_id!)
      .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
  }, [originalDirectives]);

  const previousMeetingIds = useMemo(() => {
    return originalPreviousDirectives
      .filter(d => d.related_meeting_request_id)
      .map(d => d.related_meeting_request_id!)
      .filter((id, index, self) => self.indexOf(id) === index);
  }, [originalPreviousDirectives]);

  // Fetch meetings data for current directives
  const { data: meetingsData } = useQuery({
    queryKey: ['directives-meetings', meetingIds],
    queryFn: async () => {
      const meetings: Record<string, MeetingApiResponse> = {};
      await Promise.all(
        meetingIds.map(async (id) => {
          try {
            const meeting = await getMeetingById(id);
            meetings[id] = meeting;
          } catch (error) {
            console.error(`Error fetching meeting ${id}:`, error);
          }
        })
      );
      return meetings;
    },
    enabled: meetingIds.length > 0,
  });

  // Fetch meetings data for previous directives
  const { data: meetingsDataForPrevious } = useQuery({
    queryKey: ['directives-previous-meetings', previousMeetingIds],
    queryFn: async () => {
      const meetings: Record<string, MeetingApiResponse> = {};
      await Promise.all(
        previousMeetingIds.map(async (id) => {
          try {
            const meeting = await getMeetingById(id);
            meetings[id] = meeting;
          } catch (error) {
            console.error(`Error fetching meeting ${id}:`, error);
          }
        })
      );
      return meetings;
    },
    enabled: directivesSubTab === 'previous' && previousMeetingIds.length > 0,
  });

  // Map API response to MeetingCardData
  const directives: MeetingCardData[] = useMemo(() => {
    if (!directivesResponse?.items) return [];
    
    let mapped = directivesResponse.items.map(mapDirectiveToCardData);
    
    // Client-side search filtering
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.trim().toLowerCase();
      mapped = mapped.filter((directive) => {
        return (
          directive.title?.toLowerCase().includes(searchLower) ||
          directive.coordinator?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return mapped;
  }, [directivesResponse, debouncedSearch]);

  // Calculate total pages from API response
  const totalItems = directivesResponse?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Format date helper
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Get classification label
  const getClassificationLabel = (classification: string | null): string => {
    if (!classification) return '-';
    return MeetingClassificationLabels[classification as MeetingClassification] || classification;
  };

  // Build table columns for a given directives list and meetings data
  const buildTableColumns = (
    originalList: Directive[],
    meetingsMap: Record<string, MeetingApiResponse> | undefined,
    pageOffset: number
  ): TableColumn<MeetingCardData>[] => [
    {
      id: 'item_number',
      header: 'رقم البند',
      width: 'w-32',
      align: 'end',
      render: (_row, index) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
            {index + 1 + pageOffset}
          </span>
        </div>
      ),
    },
    {
      id: 'directive_date',
      header: 'تاريخ التوجيه',
      width: 'w-40',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(originalDirective?.directive_date || null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'directive_text',
      header: 'التوجيه',
      width: 'w-[500px]',
      align: 'end',
      render: (row) => (
        <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
          {row.title}
        </span>
      ),
    },
    {
      id: 'meeting_nature',
      header: 'طبيعة الاجتماع',
      width: 'w-56',
      align: 'end',
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
            {row.coordinator || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'meeting_subject',
      header: 'موضوع الاجتماع',
      width: 'w-56',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.related_meeting_request_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
              {meeting?.meeting_subject || '-'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'meeting_classification',
      header: 'فئة الاجتماع',
      width: 'w-56',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.related_meeting_request_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
              {getClassificationLabel(meeting?.meeting_classification || null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'meeting_date',
      header: 'تاريخ الاجتماع',
      width: 'w-40',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const meetingId = originalDirective?.related_meeting_request_id;
        const meeting: MeetingApiResponse | undefined = meetingId && meetingsMap ? meetingsMap[meetingId] : undefined;
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 whitespace-nowrap">
              {formatDate(meeting?.scheduled_at || null)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'responsible_person',
      header: 'الشخص المسؤول',
      width: 'w-56',
      align: 'end',
      render: (row) => {
        const originalDirective = originalList.find((d) => d.id === row.id);
        const responsiblePersons = originalDirective?.responsible_persons || [];
        const firstPerson = responsiblePersons.length > 0 ? responsiblePersons[0] : null;
        const displayName = firstPerson?.name ?? '-';
        return (
          <div className="w-full flex justify-end">
            <span className="text-base font-normal text-right text-gray-600 leading-5 block w-full">
              {displayName}
            </span>
          </div>
        );
      },
    },
  ];

  const tableColumns = useMemo(() => {
    const base = buildTableColumns(originalDirectives, meetingsData, (currentPage - 1) * ITEMS_PER_PAGE);
    return [
      ...base,
      {
        id: 'actions',
        header: '',
        width: 'w-20',
        align: 'center' as const,
        render: (row: MeetingCardData) => (
          <div
            ref={(el) => {
              dropdownRefs.current[row.id] = el;
            }}
            className="flex justify-center w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setOpenDropdownId(row.id);
                setDropdownPosition({ top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom });
              }}
              className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-200 transition-colors bg-[#F6F6F6]"
            >
              <MoreVertical className="w-5 h-5 text-[#475467]" strokeWidth={1.67} />
            </button>
          </div>
        ),
      },
    ];
  }, [originalDirectives, meetingsData, currentPage]);
  const previousTableColumns = useMemo(
    () => buildTableColumns(originalPreviousDirectives, meetingsDataForPrevious, 0),
    [originalPreviousDirectives, meetingsDataForPrevious]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll">
        {/* Page Title, Description, Search/Filter Bar, and View Switcher */}
        <div className="flex flex-row items-start justify-between mb-6 gap-6" dir="rtl">
          {/* Right side - Title and Description */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2 text-right">توجيهات الجدولة</h1>
            <p className="text-base text-gray-600 text-right">
              يمكنك الاطلاع على توجيهات الجدولة الحالية والسابقة
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

        {/* Dropdown Portal */}
        {openDropdownId && dropdownPosition && (() => {
          const pos = dropdownPosition;
          const dropdownHeight = 100;
          const gap = 4;
          // Position above the button so it stays on screen; align right edge with button (RTL)
          const top = Math.max(8, pos.top - dropdownHeight - gap);
          const right = window.innerWidth - pos.right;
          return createPortal(
            <div 
              className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 w-[140px]" 
              dir="rtl" 
              onClick={(e) => e.stopPropagation()}
              style={{ 
                zIndex: 9999,
                top: `${top}px`,
                right: `${Math.min(right, window.innerWidth - 150)}px`,
                left: 'auto',
              }}
            >
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (openDropdownId) {
                    try {
                      await cancelDirective(openDropdownId);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                      await refetch();
                    } catch (error) {
                      console.error('Error cancelling directive:', error);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs mb-1.5 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: '#F59E0B',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                }}
              >
                <span>إلغاء التوجيه</span>
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (openDropdownId) {
                    const d = originalDirectives.find((x) => x.id === openDropdownId);
                    if (d) {
                      try {
                        await closeDirective(d.id);
                        navigate(
                          `/uc08/meetings/new?directive_id=${encodeURIComponent(d.id)}&directive_text=${encodeURIComponent(d.directive_text)}&related_meeting=${encodeURIComponent(d.related_meeting || '')}`
                        );
                      } catch (err) {
                        console.error('Error closing directive:', err);
                      }
                    }
                    setOpenDropdownId(null);
                    setDropdownPosition(null);
                  }
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
                style={{
                  background: '#DC2626',
                  boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
                }}
              >
                <span>إغلاق التوجيه</span>
                <X className="w-4 h-4" />
              </button>
            </div>,
            document.body
          );
        })()}

        {/* Sub-tabs: التوجيهات السابقة / التوجيهات الحالية */}
        <div className="flex justify-center my-4">
          <Tabs
            items={[
              { id: 'previous', label: 'التوجيهات السابقة' },
              { id: 'current', label: 'التوجيهات الحالية' },
            ]}
            activeTab={directivesSubTab}
            onTabChange={(id) => setDirectivesSubTab(id as 'current' | 'previous')}
          />
        </div>

        {/* Content - Table or Cards */}
        <div className="mt-4">
          {directivesSubTab === 'previous' ? (
            isLoadingPrevious ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">جاري التحميل...</div>
              </div>
            ) : errorPrevious ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
              </div>
            ) : previousDirectives.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center text-gray-600">لا توجد توجيهات سابقة</div>
              </div>
            ) : (
              <div style={{ overflow: 'visible' }}>
                <DataTable
                  columns={previousTableColumns}
                  data={previousDirectives}
                  rowPadding="py-2"
                />
              </div>
            )
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">جاري التحميل...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-600">حدث خطأ أثناء تحميل البيانات</div>
            </div>
          ) : directives.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">لا توجد بيانات</div>
            </div>
          ) : (
            <>
              {view === 'table' ? (
                <div style={{ overflow: 'visible' }}>
                  <DataTable
                    columns={tableColumns}
                    data={directives}
                    rowPadding="py-2"
                    onRowClick={() => {
                      // Row click can be used for navigation if needed
                    }}
                  />
                </div>
              ) : (
                <DirectivesCardsGrid
                  directives={directives}
                  openDropdownId={openDropdownId}
                  setOpenDropdownId={setOpenDropdownId}
                  dropdownRefs={dropdownRefs}
                  refetch={refetch}
                  onCloseDirective={handleCloseDirectiveNavigate}
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

export default Directives;

