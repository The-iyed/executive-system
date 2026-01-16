import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMeetingById } from '../../../UC02/data/meetingsApi';
import { GoBackHeader, EditButton } from '../../components';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { PATH } from '../../routes/paths';
import { Tabs } from '@shared';
import { MEETING_PREVIEW_TABS, MeetingPreviewTabs } from './constants';
import { MeetingPreviewTab, NotesTab } from './tabs';

const PreviewMeeting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(MeetingPreviewTabs.MEETING_PREVIEW);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch meeting data using React Query
  const { data: meeting, isLoading, error } = useQuery({
    queryKey: ['meeting', id, 'preview'],
    queryFn: () => getMeetingById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">حدث خطأ في تحميل البيانات</div>
      </div>
    );
  }

  // Get status label
  const statusLabel = MeetingStatusLabels[meeting.status as MeetingStatus] || meeting.status;

  // Handle navigation back to meetings list
  const handleBack = () => {
    navigate(PATH.MEETINGS);
  };

  // Handle edit button click
  const handleEdit = () => {
    navigate(PATH.MEETING_DETAIL.replace(':id', id!));
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case MeetingPreviewTabs.MEETING_PREVIEW:
        return <MeetingPreviewTab meeting={meeting} />;
      case MeetingPreviewTabs.NOTES:
        return <NotesTab meeting={meeting} />;
      default:
        return <MeetingPreviewTab meeting={meeting} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 schedule-review-scroll pb-15">
        <div className="w-full flex items-center justify-between mb-8">
          <GoBackHeader
            title={`عرض الطلب (${meeting?.request_number ?? ''})`}
            status={meeting.status}
            statusLabel={statusLabel}
            onBack={handleBack}
          />
          <EditButton onClick={handleEdit} />
        </div>
        <div className="flex flex-row items-center justify-start mb-8">
          <Tabs
            items={MEETING_PREVIEW_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default PreviewMeeting;