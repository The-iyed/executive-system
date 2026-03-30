import { useState, useCallback, useEffect, useRef } from "react";
import type { ChartSegment } from "@gl/types/meeting-detail";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ClassificationOption = "استراتيجي" | "تشغيلي" | "خاص";
export type TypeOption = "داخلي" | "خارجي";

export const MEETING_CATEGORY_OPTIONS = [
  { value: "COUNCILS_AND_COMMITTEES", label: "المجالس واللجان" },
  { value: "EVENTS_AND_VISITS", label: "الفعاليات والزيارات" },
  { value: "BILATERAL_MEETING", label: "لقاء ثنائي" },
  { value: "PRIVATE_MEETING", label: "لقاء خاص" },
  { value: "BUSINESS", label: "أعمال" },
  { value: "GOVERNMENT_CENTER_TOPICS", label: "مواضيع مركز الحكومة" },
] as const;

export type MeetingCategoryValue = (typeof MEETING_CATEGORY_OPTIONS)[number]["value"];

interface DonutChartProps {
  categoryData?: ChartSegment[];
  typeData?: ChartSegment[];
  categorySegmentData?: ChartSegment[];
  sectorData?: ChartSegment[];
  data?: ChartSegment[];
  total: number;
  title?: string;
}

const GAP_ANGLE = 4;
const OUTER_RADIUS = 100;
const INNER_RADIUS = 66;
const HOVER_OUTER = 106;
const CHART_PADDING = 44;
const SIZE = (HOVER_OUTER + CHART_PADDING) * 2;
const CENTER = SIZE / 2;

/** Vibrant, colorful palette */
export const DONUT_COLORFUL_PALETTE = [
  "#2563eb", // vivid blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#f97316", // orange
  "#6366f1", // indigo
  "#84cc16", // lime
  "#e11d48", // rose
  "#0ea5e9", // sky
  "#a855f7", // purple
  "#eab308", // yellow
  "#14b8a6", // teal
  "#d946ef", // fuchsia
  "#0891b2", // dark cyan
];

function polarToCartesian(cx: number, cy: number, angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  startAngle: number,
  endAngle: number,
  outerR: number = OUTER_RADIUS,
  innerR: number = INNER_RADIUS,
) {
  const outerStart = polarToCartesian(cx, cy, startAngle, outerR);
  const outerEnd = polarToCartesian(cx, cy, endAngle, outerR);
  const innerStart = polarToCartesian(cx, cy, startAngle, innerR);
  const innerEnd = polarToCartesian(cx, cy, endAngle, innerR);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function DonutChart({
  categoryData,
  typeData,
  categorySegmentData,
  sectorData,
  data: legacyData,
  total,
  title: titleProp,
}: DonutChartProps) {
  type GroupBy = "classification" | "type" | "category" | "sector";
  const hasSector = (sectorData?.length ?? 0) > 0;
  const GROUP_BY_ORDER: GroupBy[] = hasSector
    ? ["classification", "type", "category", "sector"]
    : ["classification", "type", "category"];
  const [groupBy, setGroupBy] = useState<GroupBy>("type");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasGroupBySelect =
    (categoryData != null && typeData != null) ||
    (hasSector && (categoryData != null || typeData != null || (categorySegmentData?.length ?? 0) > 0));

  const classificationSegments = categoryData ?? [];
  const typeSegments = typeData ?? [];
  const categorySegments = categorySegmentData ?? legacyData ?? [];
  const sectorSegments = sectorData ?? [];

  const rawData = hasGroupBySelect
    ? groupBy === "classification"
      ? classificationSegments
      : groupBy === "type"
        ? typeSegments
        : groupBy === "category"
          ? categorySegments
          : sectorSegments
    : (legacyData ?? []);

  const data = rawData.filter((seg) => seg.value > 0);
  const displayedTotal = data.reduce((sum, seg) => sum + seg.value, 0);
  const safeTotal = displayedTotal || 1;
  const totalGap = GAP_ANGLE * data.length;
  const available = 360 - totalGap;
  const hasSegments = data.length > 0;

  const groupByLabels: Record<GroupBy, string> = {
    classification: "التصنيف",
    type: "النوع",
    category: "الفئة",
    sector: "القطاع",
  };
  const displayLabel = groupByLabels[groupBy];

  const goPrev = useCallback(() => {
    const i = GROUP_BY_ORDER.indexOf(groupBy);
    setGroupBy(GROUP_BY_ORDER[(i - 1 + GROUP_BY_ORDER.length) % GROUP_BY_ORDER.length]);
    setHoveredIndex(null);
  }, [groupBy, GROUP_BY_ORDER]);

  const goNext = useCallback(() => {
    const i = GROUP_BY_ORDER.indexOf(groupBy);
    setGroupBy(GROUP_BY_ORDER[(i + 1) % GROUP_BY_ORDER.length]);
    setHoveredIndex(null);
  }, [groupBy, GROUP_BY_ORDER]);

  // Auto-slide every 4s
  useEffect(() => {
    if (!hasGroupBySelect || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(() => {
      setGroupBy((prev) => {
        const i = GROUP_BY_ORDER.indexOf(prev);
        return GROUP_BY_ORDER[(i + 1) % GROUP_BY_ORDER.length];
      });
      setHoveredIndex(null);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hasGroupBySelect, isPaused, GROUP_BY_ORDER]);

  const pauseAutoSlide = useCallback(() => setIsPaused(true), []);
  const resumeAutoSlide = useCallback(() => setIsPaused(false), []);

  const segments = data.reduce<
    Array<(typeof data)[0] & { startAngle: number; endAngle: number; percent: number }>
  >(
    (acc, segment) => {
      const startAngle = acc.length === 0 ? 0 : acc[acc.length - 1].endAngle + GAP_ANGLE;
      const sweep = (segment.value / safeTotal) * available;
      const endAngle = startAngle + sweep;
      const colorIndex = acc.length % DONUT_COLORFUL_PALETTE.length;
      acc.push({
        ...segment,
        color: DONUT_COLORFUL_PALETTE[colorIndex],
        startAngle,
        endAngle,
        percent: Math.round((segment.value / safeTotal) * 100),
      });
      return acc;
    },
    [],
  );

  const hoveredSeg = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div data-tour="schedule-donut" className="rounded-2xl border border-border/40 bg-card p-5 animate-fade-in" onMouseEnter={pauseAutoSlide} onMouseLeave={resumeAutoSlide}>
      {/* Group-by pill selector */}
      {hasGroupBySelect && (
        <div data-tour="schedule-charts" className="mb-3 flex items-center justify-center gap-1.5">
          <button
            type="button"
            aria-label="السابق"
            onClick={goPrev}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground active:scale-90"
          >
            <ChevronRight className="size-3.5" />
          </button>
          <span
            className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-semibold text-foreground select-none"
            style={{ fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
          >
            {titleProp ?? displayLabel}
          </span>
          <button
            type="button"
            aria-label="التالي"
            onClick={goNext}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/50 transition-all hover:bg-muted hover:text-foreground active:scale-90"
          >
            <ChevronLeft className="size-3.5" />
          </button>
        </div>
      )}


      {/* Chart */}
      <div className="flex items-center justify-center">
        <div className="relative flex justify-center">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="block h-auto w-full max-w-[240px]">
            {/* Subtle background ring */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={(OUTER_RADIUS + INNER_RADIUS) / 2}
              fill="none"
              stroke="currentColor"
              strokeWidth={OUTER_RADIUS - INNER_RADIUS}
              className="text-muted/20"
            />

            {hasSegments ? (
              segments.map((seg, i) => {
                const isHovered = hoveredIndex === i;
                const isOtherHovered = hoveredIndex !== null && hoveredIndex !== i;
                return (
                  <path
                    key={i}
                    d={arcPath(
                      CENTER,
                      CENTER,
                      seg.startAngle,
                      seg.endAngle,
                      isHovered ? HOVER_OUTER : OUTER_RADIUS,
                      INNER_RADIUS,
                    )}
                    fill={seg.color}
                    opacity={isOtherHovered ? 0.35 : 1}
                    className="cursor-pointer"
                    style={{
                      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      filter: isHovered
                        ? `drop-shadow(0 4px 12px ${seg.color}40)`
                        : "none",
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })
            ) : (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={(OUTER_RADIUS + INNER_RADIUS) / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={OUTER_RADIUS - INNER_RADIUS}
                className="text-muted/30"
                strokeDasharray="6 4"
              />
            )}

            {/* Center content */}
            {hoveredSeg ? (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-bold"
                  style={{ fontSize: 26, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {hoveredSeg.percent}%
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 11, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {hoveredSeg.label}
                </text>
              </>
            ) : (
              <>
                <text
                  x={CENTER}
                  y={CENTER - 8}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground font-bold"
                  style={{ fontSize: 28, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {total}
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground"
                  style={{ fontSize: 11, fontFamily: "'IBM Plex Sans Arabic', 'Frutiger LT Arabic', sans-serif" }}
                >
                  {total === 1 ? "اجتماع" : "اجتماعات"}
                </text>
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Legend */}
      {hasSegments && data.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {segments.map((seg, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <button
                key={i}
                type="button"
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-all duration-200"
                style={{
                  backgroundColor: isHovered ? `${seg.color}15` : "transparent",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <span
                  className="size-2 shrink-0 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: seg.color,
                    transform: isHovered ? "scale(1.4)" : "scale(1)",
                    boxShadow: isHovered ? `0 0 6px ${seg.color}60` : "none",
                  }}
                />
                <span
                  className="text-[11px] transition-colors duration-200"
                  style={{
                    color: isHovered ? seg.color : undefined,
                    fontWeight: isHovered ? 600 : 400,
                  }}
                >
                  {seg.label}{" "}
                  <span className="font-semibold">({seg.value})</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Slide dots */}
      {hasGroupBySelect && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {GROUP_BY_ORDER.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => { setGroupBy(g); setHoveredIndex(null); }}
              aria-label={groupByLabels[g]}
              className="p-0.5"
            >
              <span
                className="block rounded-full transition-all duration-300"
                style={{
                  width: g === groupBy ? 10 : 6,
                  height: g === groupBy ? 10 : 6,
                  backgroundColor: g === groupBy
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground) / 0.2)",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { DonutChart };
