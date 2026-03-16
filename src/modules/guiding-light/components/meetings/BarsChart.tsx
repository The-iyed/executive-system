import type { DailyBarEntry } from "@gl/types/meeting-detail";

interface BarsChartProps {
  data: DailyBarEntry[];
  title?: string;
}

const CHART_HEIGHT = 150;
const BAR_WIDTH = 32;
const BAR_GAP = 14;       // gap between bars (days)
const SEGMENT_GAP = 3;    // gap between segments within a bar
const LABEL_HEIGHT = 22;
const CORNER_RADIUS = 5;

function BarsChart({ data, title = "عدد الاجتماعات يومياً" }: BarsChartProps) {
  const maxTotal = Math.max(
    ...data.map((d) => d.segments.reduce((s, seg) => s + seg.value, 0)),
    1,
  );

  const svgWidth = data.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
  const svgHeight = CHART_HEIGHT + LABEL_HEIGHT;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-center text-sm font-bold text-foreground">
        {title}
      </h3>
      <div className="flex justify-center">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block overflow-visible"
        >
          {data.map((entry, i) => {
            const dayTotal = entry.segments.reduce((s, seg) => s + seg.value, 0);
            const barHeight = (dayTotal / maxTotal) * CHART_HEIGHT;
            const totalSegmentGaps = (entry.segments.length - 1) * SEGMENT_GAP;
            const availableForSegments = barHeight - totalSegmentGaps;
            const x = i * (BAR_WIDTH + BAR_GAP);

            // Build segment rects from bottom to top
            let currentY = CHART_HEIGHT;
            const segmentRects = entry.segments.map((seg, j) => {
              const segH = Math.max(
                (seg.value / dayTotal) * availableForSegments,
                4,
              );
              currentY -= segH;
              const rect = { y: currentY, height: segH, color: seg.color, key: j };
              currentY -= SEGMENT_GAP;
              return rect;
            });

            return (
              <g key={i}>
                {segmentRects.map((rect) => (
                  <rect
                    key={rect.key}
                    x={x}
                    y={rect.y}
                    width={BAR_WIDTH}
                    height={rect.height}
                    rx={CORNER_RADIUS}
                    ry={CORNER_RADIUS}
                    fill={rect.color}
                  />
                ))}

                {/* Day label */}
                <text
                  x={x + BAR_WIDTH / 2}
                  y={CHART_HEIGHT + LABEL_HEIGHT - 4}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                >
                  {entry.dayName}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export { BarsChart };
