import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@sanad-ai/ui';
import { useQuery } from '@tanstack/react-query';
import { evaluateReadiness } from '../data/meetingsApi';
import MeetingQualityIcon from '../../shared/assets/MeetingQualityIcon.svg?react';

enum MeetingQualityStatus {
  GOOD = 'good',
  AVERAGE = 'average',
  BAD = 'bad',
}

interface StatusConfig {
  label: string;
  position: string;
}

interface QualityModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
}

const hasReadinessStatus = (readiness?: string): boolean =>
  !!readiness && readiness.trim().length > 0;

const mapReadinessToStatus = (readiness: string): MeetingQualityStatus => {
  if (readiness === 'قوي') return MeetingQualityStatus.GOOD;
  if (readiness === 'متوسط') return MeetingQualityStatus.AVERAGE;
  if (readiness === 'ضعيف') return MeetingQualityStatus.BAD;
  return MeetingQualityStatus.AVERAGE;
};

const getStatusConfig = (status: MeetingQualityStatus): StatusConfig => {
  const statusConfigMap: Record<MeetingQualityStatus, StatusConfig> = {
    [MeetingQualityStatus.GOOD]: { label: 'قوي', position: '28%' },
    [MeetingQualityStatus.AVERAGE]: { label: 'متوسط', position: '50%' },
    [MeetingQualityStatus.BAD]: { label: 'ضعيف', position: '78%' },
  };
  return statusConfigMap[status];
};

const renderCenteredMessage = (message: string, withCard = false) => {
  const content = (
    <div className="flex items-center justify-center py-8">
      <div className="text-[#475467]">{message}</div>
    </div>
  );

  if (!withCard) return content;

  return (
    <div className="rounded-[24px] p-6 shadow-[0_20px_45px_rgba(15,23,42,0.12)] border border-[#E5E7EB]">
      {content}
    </div>
  );
};

const QualityModal = ({ isOpen, onOpenChange, meetingId }: QualityModalProps) => {
  const { data: readinessData, isLoading } = useQuery({
    queryKey: ['meeting-readiness', meetingId],
    queryFn: () => evaluateReadiness(meetingId),
    enabled: isOpen && !!meetingId,
  });

  const hasStatus = hasReadinessStatus(readinessData?.readiness);
  const meetingQualityStatus: MeetingQualityStatus = hasStatus && readinessData
    ? mapReadinessToStatus(readinessData.readiness)
    : MeetingQualityStatus.AVERAGE;
  const meetingQualityReasons: string[] =
    hasStatus && readinessData ? readinessData.reasoning : [];

  const statusConfig = getStatusConfig(meetingQualityStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-[#F5F5F7]" dir="rtl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-right text-[18px] font-semibold text-[#101828]">
            مؤشر جودة الاجتماع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {isLoading ? (
            renderCenteredMessage('جاري التحميل...')
          ) : !hasStatus ? (
            renderCenteredMessage('لا يوجد تقييم بعد', true)
          ) : (
            <>
                <div className="relative rounded-full w-full shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                  <div className="p-[7px] bg-white border border-[#CBCBCB] rounded-[53px]">
                    <div
                      className="h-[30px] rounded-[53px]"
                      style={{
                        background:
                          'linear-gradient(90deg, #19BBB0 -1.74%, #3DF386 29.11%, #FCE000 52.93%, #FFB902 71.91%, #FC7008 87.24%, #F71818 109.48%)',
                      }}
                    />
                  </div>

                  <div
                    className="absolute top-[15%] -translate-y-1/2 flex flex-col items-center gap-1"
                    style={{ left: statusConfig.position }}
                  >
                    <div className="bg-[#000000] px-4 py-1 pb-2 text-xs font-medium text-[#FFFFFF] rounded-[38px] shadow-[0_4px_4px_rgba(0,0,0,0.25)] whitespace-nowrap">
                      {statusConfig.label}
                    </div>
                    <div className="w-[4px] h-8 bg-white rounded-full" />
                  </div>
                </div>

              {/* Reasons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-[21px] font-semibold text-black">
                    <MeetingQualityIcon />
                    <span>الأسباب</span>
                  </h3>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {meetingQualityReasons.length > 0 ? (
                    meetingQualityReasons.map((reason, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#FCFCFD] border border-[#D0D5DD] rounded-[12px] text-[#475467]"
                      >
                        {index + 1}. {reason}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-[#FCFCFD] border border-[#D0D5DD] rounded-[12px] text-[#475467]">
                      لا توجد أسباب متاحة
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QualityModal;
