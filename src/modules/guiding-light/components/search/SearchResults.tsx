import { useMemo } from "react";
import { Search } from "lucide-react";
import { MOCK_SEARCH_RESULTS } from "@gl/data/mock-search";

interface SearchResultsProps {
  query: string;
}

function SearchResults({ query }: SearchResultsProps) {
  const filteredResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return MOCK_SEARCH_RESULTS;
    return MOCK_SEARCH_RESULTS.filter(
      (result) =>
        result.title.includes(trimmed) ||
        result.category.includes(trimmed),
    );
  }, [query]);

  return (
    <div className="scrollbar-hide min-h-0 flex-1 space-y-2 overflow-y-auto">
      {filteredResults.length > 0 ? (
        filteredResults.map((result) => (
          <button
            key={result.id}
            className="flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-start transition-colors hover:bg-white/10"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">{result.title}</p>
              <p className="mt-0.5 text-xs text-white/40">{result.category}</p>
            </div>
            <Search className="size-4 shrink-0 text-white/30" />
          </button>
        ))
      ) : (
        <div className="flex flex-col items-center py-10">
          <svg className="size-20 mb-3" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="92" cy="88" r="36" className="fill-white/5 stroke-white/10" strokeWidth="2.5" />
            <circle cx="92" cy="88" r="24" className="stroke-white/[0.07]" strokeWidth="2" fill="none" />
            <line x1="118" y1="114" x2="148" y2="144" className="stroke-white/10" strokeWidth="6" strokeLinecap="round" />
            <path d="M87 80 q0-8 5-8 q6 0 6 6 q0 5-5 7 v4" className="stroke-white/15" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <circle cx="93" cy="97" r="1.5" className="fill-white/15" />
          </svg>
          <p className="text-sm text-white/40">لا توجد نتائج للبحث</p>
        </div>
      )}
    </div>
  );
}

export { SearchResults };
