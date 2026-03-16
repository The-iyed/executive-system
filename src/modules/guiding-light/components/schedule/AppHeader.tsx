import { Avatar, AvatarFallback } from "@gl/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@gl/components/ui/popover";
import { useAuth } from "@gl/contexts/AuthContext";
import { useModalStore } from "@gl/stores/modal-store";
import { useTourStore } from "@gl/stores/tour-store";
import searchIcon from "@gl/assets/icons/search.svg";
import { LogOut, Settings, HelpCircle } from "lucide-react";
import { HeaderNavTabs } from "./HeaderNavTabs";

function AppHeader() {
  const { logout } = useAuth();
  const openModal = useModalStore((s) => s.openModal);
  const openTour = useTourStore((s) => s.openTour);

  return (
    <header className="shrink-0 px-3 pt-3 pb-1">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Avatar + Actions */}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button className="cursor-pointer group relative">
                <Avatar className="size-10 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-bold">
                    م
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-primary ring-2 ring-background" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" sideOffset={8} className="w-44 p-1.5">
              <button
                onClick={logout}
                className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                <span>تسجيل الخروج</span>
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Center: Nav Tabs */}
        <HeaderNavTabs />

        {/* Right: Brand */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="text-left">
            <p className="text-[13px] font-bold text-foreground leading-tight">المنصة الموحّدة</p>
            <p className="text-[10px] text-muted-foreground/50 leading-tight">للمكتب التنفيذي</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md shadow-primary/20">
            <Settings className="size-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
}

export { AppHeader };
