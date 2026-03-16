import { Clock } from "lucide-react";
import { MOCK_RECENT_SEARCHES } from "@gl/data/mock-search";

function RecentSearches() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">
        عمليات البحث الأخيرة
      </h3>
      <div className="space-y-2">
        {MOCK_RECENT_SEARCHES.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
          >
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Clock className="size-4 text-white/50" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{item.query}</p>
              <p className="mt-0.5 text-xs text-white/40">{item.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { RecentSearches };
