import { useInfiniteQuery } from "@tanstack/react-query";
import { searchUsersByEmail, type UserSearchResult } from "../../api";

export interface ManagerOption {
  value: string;
  label: string;
  subtitle: string;
  user: UserSearchResult;
}

function toOption(user: UserSearchResult): ManagerOption {
  return {
    value: user.objectGUID || user.mail || user.cn || '',
    label: user.displayName || user.mail,
    subtitle: user.mail,
    user,
  };
}

export function useManagerSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["managers", search],
    queryFn: async ({ pageParam = 0 }) => {
      return await searchUsersByEmail(search, pageParam);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 30_000,
    select: (data) => ({
      options: data.pages.flatMap((p) => p.items.map(toOption)),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}