import { Skeleton } from "@gl/components/ui/skeleton";

function SchedulePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar charts */}
      <div className="flex flex-col gap-4 lg:w-[320px] lg:shrink-0">
        {/* Donut chart skeleton */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col items-center gap-4">
          <Skeleton className="size-40 rounded-full" />
          <div className="w-full space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
        {/* Bar chart skeleton */}
        <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-end gap-2 h-24">
            {[60, 80, 45, 90, 55, 70, 40].map((h, i) => (
              <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Meeting cards */}
      <div className="flex-1 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SchedulePageSkeleton };
