import type { ChartSegment } from "@gl/types/meeting-detail";

interface SectorBarChartProps {
  data: ChartSegment[];
}

function SectorBarChart({ data }: SectorBarChartProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0) || 1;
  const hasData = data.length > 0 && total > 0;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <h3 className="mb-6 text-center text-sm font-bold text-foreground">
        توزيع الاجتماعات حسب القطاع
      </h3>

      {!hasData ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          لا توجد بيانات
        </div>
      ) : (
        <>
          {/* Top labels + dashed lines */}
          <div className="flex">
            {data.map((segment, i) => (
              <div
                key={`top-${i}`}
                className="flex flex-col items-center"
                style={{ width: `${(segment.value / total) * 100}%` }}
              >
                {i % 2 === 0 ? (
                  <>
                    <span className="mb-1 whitespace-nowrap text-[10px] text-muted-foreground">
                      {segment.label} {segment.value}
                    </span>
                    <div className="h-4 w-px border-r border-dashed border-gray-300" />
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            ))}
          </div>

          {/* Bar */}
          <div className="flex h-10 gap-1">
            {data.map((segment, i) => (
              <div
                key={i}
                className="h-full rounded"
                style={{
                  width: `${(segment.value / total) * 100}%`,
                  backgroundColor: segment.color,
                  boxShadow: `0 4px 12px ${segment.color}66`,
                }}
              />
            ))}
          </div>

          {/* Bottom dashed lines + labels */}
          <div className="flex">
            {data.map((segment, i) => (
              <div
                key={`bottom-${i}`}
                className="flex flex-col items-center"
                style={{ width: `${(segment.value / total) * 100}%` }}
              >
                {i % 2 !== 0 ? (
                  <>
                    <div className="h-4 w-px border-r border-dashed border-gray-300" />
                    <span className="mt-1 whitespace-nowrap text-[10px] text-muted-foreground">
                      {segment.label} {segment.value}
                    </span>
                  </>
                ) : (
                  <div className="h-full" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { SectorBarChart };
