import { Dialog, DialogContent } from '@/lib/ui';
import { useQuery } from '@tanstack/react-query';
import { evaluateReadiness } from '../data/meetingsApi';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

enum MeetingQualityStatus {
  GOOD = 'good',
  AVERAGE = 'average',
  BAD = 'bad',
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

const STATUS_CONFIG: Record<MeetingQualityStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof TrendingUp;
  emoji: string;
}> = {
  [MeetingQualityStatus.GOOD]: {
    label: 'قوي',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    icon: TrendingUp,
    emoji: '🟢',
  },
  [MeetingQualityStatus.AVERAGE]: {
    label: 'متوسط',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    icon: Minus,
    emoji: '🟡',
  },
  [MeetingQualityStatus.BAD]: {
    label: 'ضعيف',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    icon: TrendingDown,
    emoji: '🔴',
  },
};

function CircularGauge({ percentage, color, label }: { percentage: number; color: string; label: string }) {
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;
  const trackColor = '#F3F4F6';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center gap-1">
        <span className="text-3xl font-bold" style={{ color }}>{percentage}%</span>
        <span className="text-sm font-semibold text-[#6B7280]">{label}</span>
      </div>
    </div>
  );
}

const QualityModal = ({ isOpen, onOpenChange, meetingId }: QualityModalProps) => {
  const { data: readinessData, isLoading } = useQuery({
    queryKey: ['meeting-readiness', meetingId, isOpen],
    queryFn: () => evaluateReadiness(meetingId),
    enabled: isOpen && !!meetingId,
    staleTime: 0,
    gcTime: 0,
  });

  const hasStatus = hasReadinessStatus(readinessData?.readiness);
  const meetingQualityStatus: MeetingQualityStatus = hasStatus && readinessData
    ? mapReadinessToStatus(readinessData.readiness)
    : MeetingQualityStatus.AVERAGE;
  const meetingQualityReasons: string[] =
    hasStatus && readinessData ? readinessData.reasoning : [];

  // Use the real percentage from the API response
  const readinessPercentage = readinessData?.readiness_percentage ?? 0;

  const config = STATUS_CONFIG[meetingQualityStatus];
  const StatusIcon = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[520px] sm:max-w-[520px] bg-white gap-0 p-0 rounded-2xl overflow-hidden border-0"
        dir="rtl"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}
            >
              <Sparkles className="w-5 h-5" style={{ color: config.color }} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#101828]">تقييم جاهزية الاجتماع</h2>
              <p className="text-[13px] text-[#667085] mt-0.5">تحليل ذكي لمستوى الجاهزية</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-10 h-10 rounded-full border-[3px] border-[#E5E7EB] border-t-[#048F86] animate-spin" />
              <p className="text-sm text-[#667085]">جاري التحليل...</p>
            </div>
          ) : !hasStatus ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#9CA3AF]" />
              </div>
              <p className="text-sm text-[#667085]">لا يوجد تقييم بعد</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Gauge + Status Card */}
              <div
                className="flex flex-col items-center gap-4 p-5 rounded-xl"
                style={{ backgroundColor: config.bgColor, border: `1px solid ${config.borderColor}` }}
              >
                <CircularGauge percentage={readinessPercentage} color={config.color} label={config.label} />
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" style={{ color: config.color }} />
                  <span className="text-sm font-semibold" style={{ color: config.color }}>
                    مستوى الجاهزية: {config.label}
                  </span>
                </div>
              </div>

              {/* Reasons */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[15px] font-bold text-[#101828] flex items-center gap-2">
                  <span>التفاصيل والأسباب</span>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#F3F4F6] text-[11px] font-semibold text-[#6B7280]">
                    {meetingQualityReasons.length}
                  </span>
                </h3>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {meetingQualityReasons.length > 0 ? (
                    meetingQualityReasons.map((reason, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#F9FAFB] border border-[#F3F4F6] hover:border-[#E5E7EB] transition-colors"
                      >
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-white border border-[#E5E7EB] flex items-center justify-center text-[11px] font-bold text-[#6B7280]">
                          {index + 1}
                        </span>
                        <p className="text-[13px] text-[#374151] leading-relaxed flex-1">
                          {reason}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[13px] text-[#9CA3AF] text-center py-4">لا توجد أسباب متاحة</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QualityModal;
