import { Skeleton } from "@gl/components/ui/skeleton";

function ChatMessagesSkeleton() {
  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-5 px-5 py-6">
      {/* User message */}
      <div className="flex justify-start">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      {/* Assistant message */}
      <div className="flex justify-start">
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {/* User message */}
      <div className="flex justify-start">
        <Skeleton className="h-10 w-36 rounded-2xl" />
      </div>
      {/* Assistant message */}
      <div className="flex justify-start">
        <div className="space-y-2 max-w-lg">
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-3 pt-2 px-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3.5">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

export { ChatMessagesSkeleton, ConversationListSkeleton };
