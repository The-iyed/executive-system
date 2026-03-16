import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@gl/components/ui/avatar";
import { Button } from "@gl/components/ui/button";
import { Input } from "@gl/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@gl/components/ui/popover";
import { getMeetingRequestUsers, type MeetingRequestUser } from "@gl/api/unified/client";
import { cn } from "@gl/lib/utils";
import { ChevronDownIcon, Loader2Icon } from "lucide-react";

function displayName(user: MeetingRequestUser): string {
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  }
  if (user.username) return user.username;
  if (user.email) return user.email;
  return user.id;
}

interface DelegateeSelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
}

function DelegateeSelect({ value, onValueChange }: DelegateeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [items, setItems] = useState<MeetingRequestUser[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MeetingRequestUser | null>(null);
  const limit = 20;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(
    async (searchTerm: string, skipOffset: number, append: boolean) => {
      setLoading(true);
      try {
        const res = await getMeetingRequestUsers({
          search: searchTerm || undefined,
          skip: skipOffset,
          limit,
        });
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
        setTotal(res.total);
        setSkip(res.skip);
        setHasNext(res.has_next);
      } catch {
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search: when popover opens or search input changes
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      fetchUsers(searchInput, 0, false);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, searchInput, fetchUsers]);

  // When opening, reset search and clear list so debounce effect fetches fresh first page
  useEffect(() => {
    if (open) {
      setSearchInput("");
      setSearch("");
      setItems([]);
    }
  }, [open]);

  const loadMore = useCallback(() => {
    if (loading || !hasNext) return;
    fetchUsers(search, skip + limit, true);
  }, [loading, hasNext, skip, search, fetchUsers]);

  const handleSelect = useCallback(
    (user: MeetingRequestUser) => {
      setSelectedUser(user);
      onValueChange(user.id);
      setOpen(false);
    },
    [onValueChange]
  );

  // When value is cleared from parent (e.g. modal reset), clear selected user
  useEffect(() => {
    if (value === undefined) setSelectedUser(null);
  }, [value]);

  const selectedDisplay = selectedUser && value === selectedUser.id
    ? selectedUser
    : items.find((u) => u.id === value) ?? selectedUser;

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full flex-row-reverse justify-between"
          >
            {selectedDisplay ? (
              <div className="flex items-center gap-2">
                <Avatar size="sm">
                  <AvatarImage src={selectedDisplay.avatar} alt={displayName(selectedDisplay)} />
                  <AvatarFallback>{displayName(selectedDisplay)[0]}</AvatarFallback>
                </Avatar>
                <span>{displayName(selectedDisplay)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">اختر المفوّض له</span>
            )}
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b p-2">
            <Input
              placeholder="بحث بالاسم أو البريد..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>
          <div
            ref={scrollRef}
            className="max-h-64 overflow-y-auto p-1"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40 && hasNext && !loading) {
                loadMore();
              }
            }}
          >
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                <span>جاري التحميل...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                لا يوجد مستخدمون
              </div>
            ) : (
              items.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-accent",
                    value === user.id && "bg-accent"
                  )}
                  onClick={() => handleSelect(user)}
                >
                  <Avatar size="sm">
                    <AvatarImage src={user.avatar} alt={displayName(user)} />
                    <AvatarFallback>{displayName(user)[0]}</AvatarFallback>
                  </Avatar>
                  <span>{displayName(user)}</span>
                </button>
              ))
            )}
            {loading && items.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
              </div>
            )}
            {hasNext && !loading && items.length > 0 && (
              <div className="py-2 text-center">
                <Button variant="ghost" size="sm" onClick={loadMore}>
                  تحميل المزيد
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export { DelegateeSelect };
