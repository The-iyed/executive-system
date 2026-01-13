import React, { useState } from 'react';
import { Tabs, DataTable, CardsGrid, ViewSwitcher, SearchFilterBar, MeetingCardData, ViewType, TableColumn, StatusBadge } from '@shared';
import { MeetingStatus, MeetingStatusLabels } from '@shared';
import '@shared/styles'; // Import shared styles including scrollbar
import { Eye, Calendar } from 'lucide-react';

// Sample data matching Figma design
const sampleMeetings: MeetingCardData[] = [
  {
    id: 'MR260104100',
    title: 'المُنسّق',
    date: 'الاثنين، 23 شعبان 1447 هـ',
    coordinator: 'أحمد محمد',
    status: 'redirected' as any,
    statusLabel: 'معاد من التوجيه',
  },
  {
    id: 'MEQ1004101',
    title: 'مراجعة المراقبة',
    date: '2024-07-15',
    coordinator: 'أحمد محمد',
    status: MeetingStatus.UNDER_REVIEW,
    statusLabel: MeetingStatusLabels[MeetingStatus.UNDER_REVIEW],
  },
  {
    id: 'MEQ1004102',
    title: 'استماع للمشروع',
    date: '2024-07-12',
    coordinator: 'أحمد محمد',
    status: MeetingStatus.UNDER_REVIEW,
    statusLabel: MeetingStatusLabels[MeetingStatus.UNDER_REVIEW],
  },
  {
    id: 'MEQ1004103',
    title: 'اجتماع لمناقشة المشروع',
    date: '2024-07-10',
    coordinator: 'أحمد محمد',
    status: MeetingStatus.REJECTED,
    statusLabel: MeetingStatusLabels[MeetingStatus.REJECTED],
  },
  {
    id: 'MEQ1004104',
    title: 'اجتماع لمراجعة الأداء',
    date: '2024-07-08',
    coordinator: 'أحمد محمد',
    status: 'redirected' as any,
    statusLabel: 'معاد من التوجيه',
  },
  {
    id: 'MEQ1004105',
    title: 'اجتماع التنسيق',
    date: '2024-07-05',
    coordinator: 'أحمد محمد',
    status: MeetingStatus.UNDER_REVIEW,
    statusLabel: MeetingStatusLabels[MeetingStatus.UNDER_REVIEW],
  },
];

const ScheduleReview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('work-basket');
  const [view, setView] = useState<ViewType>('table');
  const [searchValue, setSearchValue] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'all'>('all');

  const tabs = [
    {
      id: 'scheduled-meetings',
      label: 'الاجتماعات المجدولة',
    },
    {
      id: 'work-basket',
      label: 'سلة العمل',
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Filter meetings based on search and status
  const filteredMeetings = sampleMeetings.filter((meeting) => {
    const matchesSearch = !searchValue || 
      meeting.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      meeting.id.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Define table columns - order is from left to right (will be displayed RTL)
  // First column will appear on the rightmost side in RTL layout

  // Define table columns - order is from right to left (RTL)
  // First column (requestNumber) will appear on the rightmost side
  const tableColumns: TableColumn<MeetingCardData>[] = [
    {
      id: 'requestNumber',
      header: 'رقم الطلب',
      width: 'w-48', // Fixed width for request number - rightmost in RTL
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5">
            {row.id}
          </span>
        </div>
      ),
    },
    {
      id: 'subject',
      header: 'الموضوع',
      width: 'flex-1', // Flexible width for subject
      render: (row) => (
        <div className="w-full flex justify-end">
          <span className="text-base font-normal text-right text-gray-600 leading-5">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      id: 'coordinator',
      header: 'مقدم الطلب',
      width: 'w-56', // Fixed width for coordinator
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-1.5">
          <span className="text-base font-normal text-right text-gray-600 leading-5">
            {row.coordinator || 'أحمد محمد'}
          </span>
          <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
        </div>
      ),
    },
    {
      id: 'date',
      header: 'تاريخ الإرسال',
      width: 'w-60', // Fixed width for date
      render: (row) => (
        <div className="flex flex-row justify-end items-center gap-3">
          <span className="text-base font-medium text-right text-gray-900 leading-5">
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
      width: 'w-52', // Fixed width for status
      render: (row) => (
        <div className="w-full flex justify-end">
          <StatusBadge status={row.status} label={row.statusLabel} />
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      width: 'w-28', // Fixed width for actions - leftmost in RTL
      render: () => (
        <div className="w-full flex justify-center">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors">
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
        {/* Tabs and View Switcher */}
        <div className="flex flex-row items-center justify-between mb-8" dir="ltr">
          <ViewSwitcher view={view} onViewChange={setView} />
          <Tabs
            items={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-right">
            {activeTab === 'work-basket' ? 'سلة العمل - طلبات قيد المراجعة' : 'الاجتماعات المجدولة'}
          </h1>
          <p className="text-base text-gray-600 text-right">
            {activeTab === 'work-basket' 
              ? 'الاطلاع على الطلبات قيد المراجعة' 
              : 'الاطلاع على الاجتماعات المجدولة'}
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6">
          <SearchFilterBar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onFilterClick={() => console.log('Filter clicked')}
            onExportClick={() => console.log('Export clicked')}
          />
        </div>

        {/* Content - Table or Cards */}
        <div className="mt-4">
          {view === 'table' ? (
            <DataTable
              columns={tableColumns}
              data={filteredMeetings}
              onRowClick={(row) => console.log('Row clicked:', row)}
            />
          ) : (
            <CardsGrid
              meetings={filteredMeetings}
              onView={(meeting) => console.log('View meeting:', meeting)}
              onDetails={(meeting) => console.log('Details:', meeting)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleReview;
