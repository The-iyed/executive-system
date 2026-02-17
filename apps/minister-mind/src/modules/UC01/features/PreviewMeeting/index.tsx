import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@sanad-ai/ui';
import { getMeetingById } from '../../../UC02/data/meetingsApi';
import { GoBackHeader, EditButton } from '../../components';
import { MeetingStatus, MeetingStatusLabels } from '@shared/types';
import { PATH } from '../../routes/paths';
import { Tabs } from '@shared';
import { MEETING_PREVIEW_TABS, MeetingPreviewTabs } from './constants';
import { MeetingPreviewTab, InviteesTab, ContentTab, NotesTab, RequestInfoTab } from './tabs';
import { useMeetingFormDrawer } from '../MeetingForm/hooks/useMeetingFormDrawer';

const PreviewMeeting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(MeetingPreviewTabs.REQUEST_INFO);
  const {
    openEditDrawer,
  } = useMeetingFormDrawer();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  const statusLabel = MeetingStatusLabels[meeting.status as MeetingStatus] || meeting.status;

  const handleBack = () => {
    navigate(PATH.MEETINGS);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case MeetingPreviewTabs.MEETING_PREVIEW:
        return <MeetingPreviewTab meeting={meeting} />;
      case MeetingPreviewTabs.REQUEST_INFO:
        return <RequestInfoTab meeting={meeting} />;
      case MeetingPreviewTabs.INVITEES:
        return <InviteesTab meeting={meeting} />;
      case MeetingPreviewTabs.CONTENT:
        return <ContentTab meeting={meeting} />;
      case MeetingPreviewTabs.NOTES:
        return <NotesTab meeting={meeting} />;
      default:
        return <MeetingPreviewTab meeting={meeting} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" dir="rtl">
      <div className="flex-1 min-h-0 flex flex-col gap-8 pr-5">
        <div className="flex flex-col flex-shrink-0 pb-3">
          <div className="w-full flex flex-col pr-6 pl-6 py-6 gap-6 rounded-2xl bg-white">
            <div className="flex flex-row justify-between items-center gap-2.5 w-full">
              <GoBackHeader
                title={`عرض الطلب (${meeting?.request_number ?? ''})`}
                status={meeting.status}
                statusLabel={statusLabel}
                onBack={handleBack}
              />
              {[
                MeetingStatus.DRAFT,
                MeetingStatus.SCHEDULED_UPDATE_CONTENT,
                MeetingStatus.SCHEDULED_ADDITIONAL_INFO,
                MeetingStatus.SCHEDULED_DELAYED,
                MeetingStatus.RETURNED_FROM_SCHEDULING,
                MeetingStatus.RETURNED_FROM_CONTENT,
              ].includes(meeting.status as MeetingStatus) && (
                <EditButton onClick={() => openEditDrawer(meeting.id)} />
              )}
            </div>
            <div className="flex flex-row items-center w-full gap-2.5">
              <div className="flex-1 flex min-w-0 justify-center">
                <Tabs
                  items={MEETING_PREVIEW_TABS}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  variant="underline"
                  className="gap-2.5"
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center w-6 h-6 text-[#020617] hover:opacity-80 flex-shrink-0 rounded-full"
                      aria-label="مساعدة"
                    >
                      <HelpCircle className="w-4 h-4" strokeWidth={1.33} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] text-right">
                    <p className="font-semibold text-gray-900 mb-1">عرض تفاصيل طلب الاجتماع.</p>
                    <p className="text-sm text-gray-600">يمكنك الاطلاع على معلومات الطلب والاجتماع والمحتوى والمدعوين والملاحظات.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div
          className="w-full flex-1 min-h-0 flex flex-col overflow-y-auto pr-6 pl-6 py-6 gap-6 rounded-2xl bg-white"
          style={{ boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.06)' }}
        >
          <div className="flex flex-col w-full min-h-0 flex-1 mt-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewMeeting;