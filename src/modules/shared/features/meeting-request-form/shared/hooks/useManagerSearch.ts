import { useInfiniteQuery } from "@tanstack/react-query";
import { searchUsersByEmail, type UserSearchResult } from "../../api";

export interface ManagerOption {
  value: string;
  label: string;
  subtitle: string;
  user: UserSearchResult;
}

export function getUserId(user: UserSearchResult): string {
  return user.id || user.objectGUID || user.mail || user.email
    || user.cn || user.displayName || user.givenName
    || `user-${user.sn || ''}-${user.mobile || ''}`;
}

export function getUserLabel(user: UserSearchResult): string {
  return user.displayNameAR || user.ar_name
    || user.displayName || user.name
    || user.displayNameEN
    || user.givenName || user.username
    || [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    || user.mail || user.email || '—';
}

function toOption(user: UserSearchResult): ManagerOption {
  return {
    value: getUserId(user),
    label: getUserLabel(user),
    subtitle: user.mail || user.title || '—',
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
      options: data.pages.flatMap((p) => p.items.map(toOption)).filter((o) => o.value),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  });
}
