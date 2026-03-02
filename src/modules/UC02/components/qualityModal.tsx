import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/ui';
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
  arcEndAngle: number; // degrees from left (180) to right (0) for solid segment end
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
    [MeetingQualityStatus.GOOD]: { label: 'قوي', position: '28%', arcEndAngle: 45 },
    [MeetingQualityStatus.AVERAGE]: { label: 'متوسط', position: '50%', arcEndAngle: 90 },
    [MeetingQualityStatus.BAD]: { label: 'ضعيف', position: '78%', arcEndAngle: 135 },
  };
  return statusConfigMap[status];
};

/* Semi-circle donut: Figma 241×241 ellipse, inner/outer radius, gap between segments */
const FIGMA_ELLIPSE_SIZE = 241;
const FIGMA_GRAPH_LEFT = 70;
const GAUGE_R_OUTER = FIGMA_ELLIPSE_SIZE / 2;
const GAUGE_R_INNER = GAUGE_R_OUTER - 28;
const GAUGE_CX = FIGMA_GRAPH_LEFT + GAUGE_R_OUTER;
const GAUGE_CY = 73.91 + GAUGE_R_OUTER;
const GAUGE_VIEW_WIDTH = 350;
const GAUGE_VIEW_HEIGHT = 220;
const SEGMENT_GAP_DEG = 2;
const RIGHT_SEGMENT_COUNT = 22;

/* Figma card styles */
const GAUGE_COLORS = {
  dark: '#044D4E',
  medium: 'rgba(25, 132, 133, 0.9)',
  light: 'rgba(146, 220, 221, 0.9)',
  lightest: 'rgba(205, 243, 244, 0.9)',
} as const;

function angleToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function getSegmentColor(index: number, total: number): string {
  const t = index / (total - 1 || 1);
  if (t <= 0.33) return GAUGE_COLORS.medium;
  if (t <= 0.66) return GAUGE_COLORS.light;
  return GAUGE_COLORS.lightest;
}

/** Path for one donut segment: outer arc → inner arc, filled (sweep 1 = clockwise) */
function donutSegmentPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number
): string {
  const startOut = angleToXY(cx, cy, rOut, startDeg);
  const endOut = angleToXY(cx, cy, rOut, endDeg);
  const endIn = angleToXY(cx, cy, rIn, endDeg);
  const startIn = angleToXY(cx, cy, rIn, startDeg);
  return (
    `M ${startOut.x} ${startOut.y} ` +
    `A ${rOut} ${rOut} 0 0 1 ${endOut.x} ${endOut.y} ` +
    `L ${endIn.x} ${endIn.y} ` +
    `A ${rIn} ${rIn} 0 0 0 ${startIn.x} ${startIn.y} ` +
    'Z'
  );
}

function QualityGaugeCurve({ arcEndAngle }: { arcEndAngle: number }) {
  const cx = GAUGE_CX;
  const cy = GAUGE_CY;
  const rOut = GAUGE_R_OUTER;
  const rIn = GAUGE_R_INNER;

  /* Solid segment (left): one donut slice 180° → arcEndAngle, dark */
  const solidPath = donutSegmentPath(cx, cy, rOut, rIn, 180, arcEndAngle);

  /* Right side: multiple donut segments from arcEndAngle to 0° with gap between cards */
  const gapTotal = (RIGHT_SEGMENT_COUNT - 1) * SEGMENT_GAP_DEG;
  const segmentDeg = (arcEndAngle - gapTotal) / RIGHT_SEGMENT_COUNT;
  const rightSegments: { startAngle: number; endAngle: number; color: string }[] = [];
  for (let i = 0; i < RIGHT_SEGMENT_COUNT; i++) {
    const endAngle = arcEndAngle - i * (segmentDeg + SEGMENT_GAP_DEG);
    const startAngle = endAngle - segmentDeg;
    if (startAngle < 0) break;
    rightSegments.push({
      startAngle,
      endAngle,
      color: getSegmentColor(i, RIGHT_SEGMENT_COUNT),
    });
  }

  return (
    <svg
      viewBox={`0 0 ${GAUGE_VIEW_WIDTH} ${GAUGE_VIEW_HEIGHT}`}
      className="w-full max-w-[350px] h-[220px] shrink-0"
      style={{ overflow: 'visible' }}
    >
      {/* Solid donut segment: card dark #044D4E */}
      <path d={solidPath} fill={GAUGE_COLORS.dark} />
      {/* Right donut segments with space between cards */}
      {rightSegments.map((seg, i) => (
        <path
          key={i}
          d={donutSegmentPath(cx, cy, rOut, rIn, seg.startAngle, seg.endAngle)}
          fill={seg.color}
        />
      ))}
    </svg>
  );
}

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
      <DialogContent className="w-full max-w-[560px] sm:max-w-[560px] bg-[#FFFFFF] gap-0" dir="rtl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-right text-[18px] font-semibold text-[#101828]">
            مؤشر جودة الاجتماع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 h-[420px] flex flex-col">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              {renderCenteredMessage('جاري التحميل...')}
            </div>
          ) : !hasStatus ? (
            <div className="h-full flex items-center justify-center">
              {renderCenteredMessage('لا يوجد تقييم بعد', true)}
            </div>
          ) : (
            <div className="h-full flex flex-col min-h-0">
                {/* Content: Figma 350px, gauge 241×241 at left 70, label centered below arc */}
                <div className="flex flex-col items-center w-full shrink-0" style={{ minHeight: 200 }}>
                  <div className="relative w-full flex justify-center" style={{ minHeight: 200 }}>
                    <QualityGaugeCurve arcEndAngle={statusConfig.arcEndAngle} />
                    {/* Completed value label: centered below semicircle (Figma: Almarai, black) */}
                    <div
                      className="absolute flex flex-col items-center gap-1"
                      style={{
                        left: '54%',
                        transform: 'translateX(-50%)',
                        bottom: 12,
                      }}
                    >
                      <span className="font-normal text-[19px] leading-[120%] text-[#000000] whitespace-nowrap">
                        {statusConfig.label}
                      </span>
                      <div className="w-[4px] h-[8px] bg-white rounded-sm shrink-0" />
                    </div>
                  </div>
                </div>

              {/* Reasons */}
              <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <h3 className="flex items-center gap-2 text-[21px] font-semibold text-black">
                    <MeetingQualityIcon />
                    <span>الأسباب</span>
                  </h3>
                </div>

                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto p-4 bg-[#FCFCFD] border border-[#D0D5DD] rounded-[12px] text-[#475467]">
                  {meetingQualityReasons.length > 0 ? (
                    meetingQualityReasons.map((reason, index) => (
                      <p
                        key={index}
                        className="text-[#475467] text-[12px]"
                      >
                        {index + 1}.{' '}{reason}
                      </p>
                    ))
                  ) : (
                    <div className="text-[#475467] text-[12px]">
                      لا توجد أسباب متاحة
                    </div>
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
