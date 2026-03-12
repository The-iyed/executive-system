import { useInfiniteQuery } from "@tanstack/react-query";
import { searchDirectives, type DirectiveSearchResult } from "../../api";

export interface DirectiveOption {
  value: string;
  label: string;
  actionNumber?: string;
  status?: string;
}

const PAGE_SIZE = 10;

function toOption(d: DirectiveSearchResult): DirectiveOption {
  const label = d.title || d.directive_text || d.id;
  return {
    value: String(d.id),
    label: typeof label === "string" ? label : String(label),
    actionNumber: d.action_number,
    status: d.status,
  };
}

export function useDirectiveSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["directives", search],
    queryFn: ({ pageParam = 0 }) => searchDirectives(pageParam * PAGE_SIZE, PAGE_SIZE),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 30_000,
    select: (data) => {
      const allOptions = data.pages.flatMap((p) => p.items.map(toOption));
      const filtered = search
        ? allOptions.filter((o) =>
            o.label.includes(search) || (o.actionNumber?.includes(search) ?? false)
          )
        : allOptions;
      return {
        options: filtered,
        hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
      };
    },
  });
}
