import { Skeleton } from "@gl/components/ui/skeleton";

function AgentsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <Skeleton className="h-0.5 w-full" />
          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            {/* Prompt area */}
            <div className="rounded-xl border border-border/20 p-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            {/* File badge */}
            <Skeleton className="h-6 w-16 rounded-lg" />
            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/20">
              <Skeleton className="flex-1 h-8 rounded-xl" />
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { AgentsPageSkeleton };
