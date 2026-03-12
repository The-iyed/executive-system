import { useInfiniteQuery } from "@tanstack/react-query";
import { getUsers } from "../../api";
import { MeetingOwnerType } from "@/modules/shared/types";

const PAGE_SIZE = 10;

export interface UserApiResponse {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  phone_number?: string | null;
  role_ids?: string[];
  permission_ids?: string[];
  is_active?: boolean;
  [key: string]: unknown;
}

export interface UsersListResponse {
  items: UserApiResponse[];
  total: number;
  skip: number;
  limit: number;
  has_next?: boolean;
  has_previous?: boolean;
}

export interface ManagerOption {
  value: string;
  label: string;
  subtitle: string;
}

function toOption(user: UserApiResponse): ManagerOption {
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  return {
    value: user?.id,
    label: user?.username|| name || user?.email,
    subtitle: user?.email ?? "",
  };
}

export function useManagerSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["managers", search],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await getUsers({
        search: search || undefined,
        skip: pageParam * PAGE_SIZE,
        limit: PAGE_SIZE,
        role_code: MeetingOwnerType.SUBMITTER
      });
      return res;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_next ? allPages.length : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 30_000,
    select: (data) => ({
      options: data.pages.flatMap((p) => p.items.map(toOption)),
      hasMore: data.pages[data.pages.length - 1]?.has_next ?? false,
    }),
  });
}