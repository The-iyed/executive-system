import { Clock } from "lucide-react";
import { cn } from "@gl/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@gl/components/ui/avatar";
import { MOCK_SEARCH_OPTIONS } from "@gl/data/mock-search";
import type { MeetingSnippet } from "@gl/types/search";

function SnippetCard({ snippet }: { snippet: MeetingSnippet }) {
  const badgeColors: Record<string, string> = {
    default: "bg-teal text-white",
    success: "bg-teal text-white",
    warning: "bg-amber-500 text-white",
  };

  return (
    <div className="rounded-lg bg-white p-3 text-gray-900">
      {snippet.badge && (
        <span
          className={cn(
            "mb-2 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium",
            badgeColors[snippet.badgeVariant ?? "default"],
          )}
        >
          {snippet.badge}
        </span>
      )}

      <p className="text-xs font-semibold leading-relaxed">{snippet.title}</p>

      {snippet.subtitle && (
        <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
          {snippet.subtitle}
        </p>
      )}

      {(snippet.time || snippet.avatarUrl) && (
        <div className="mt-2 flex items-center justify-between">
          {snippet.time && (
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Clock className="size-3" />
              <span>{snippet.time}</span>
            </div>
          )}
          {snippet.avatarUrl && (
            <div className="flex items-center gap-1">
              <Avatar size="sm" className="size-5">
                <AvatarImage src={snippet.avatarUrl} alt={snippet.avatarName} />
                <AvatarFallback className="text-[8px]">
                  {snippet.avatarName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {snippet.avatarName && (
                <span className="text-[10px] text-gray-500">
                  {snippet.avatarName}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchOptions() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">خيارات البحث</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {MOCK_SEARCH_OPTIONS.map((option) => (
          <div
            key={option.id}
            className="space-y-2 rounded-xl bg-white/5 p-3"
          >
            <p className="text-xs font-medium text-white/70">{option.label}</p>
            <SnippetCard snippet={option.snippet} />
          </div>
        ))}
      </div>
    </div>
  );
}

export { SearchOptions };
