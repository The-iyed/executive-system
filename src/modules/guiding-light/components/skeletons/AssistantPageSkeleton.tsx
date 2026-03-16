import { Skeleton } from "@gl/components/ui/skeleton";

function AssistantPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
      {/* Neuron placeholder */}
      <Skeleton className="size-64 rounded-full" />
      {/* Title */}
      <Skeleton className="h-6 w-32 mt-2" />
      {/* Subtitle */}
      <Skeleton className="h-4 w-48" />
      {/* Input bar */}
      <div className="w-full max-w-lg mt-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export { AssistantPageSkeleton };
