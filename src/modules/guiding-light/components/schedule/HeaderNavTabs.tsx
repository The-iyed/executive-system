import { cn } from "@gl/lib/utils";
import { useAppStore, type HeaderTab } from "@gl/stores/app-store";
import { useUrlSync } from "@gl/hooks/useUrlSync";
import { Calendar, Brain, FileText, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import aounLogo from "@gl/assets/icons/aoun-logo.svg";

const NAV_ITEMS: { id: HeaderTab; label: string; Icon?: LucideIcon; customIcon?: string }[] = [
  { id: "aoun", label: "عون", customIcon: aounLogo },
  { id: "agents", label: "الوكلاء", Icon: Bot },
  { id: "request", label: "التوجيهات", Icon: FileText },
  { id: "assistant", label: "مساعد الجدولة", Icon: Brain },
  { id: "calendar", label: "التقويم", Icon: Calendar },
];

function HeaderNavTabs() {
  const activeTab = useAppStore((s) => s.activeHeaderTab);
  const { setTab } = useUrlSync();

  const handleTabClick = (id: HeaderTab) => {
    setTab(id);
    useAppStore.getState().setActiveHeaderTab(id);
  };

  return (
    <nav className="flex items-center gap-1 rounded-2xl bg-muted/70 border border-border/30 p-1 backdrop-blur-sm">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={cn(
              "relative flex items-center gap-2 rounded-xl px-4 py-2 text-[12.5px] font-semibold transition-all duration-300 cursor-pointer",
              isActive
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-card/50",
            )}
          >
            {item.customIcon ? (
              <img
                src={item.customIcon}
                alt=""
                className={cn(
                  "size-[15px] transition-all duration-300",
                  !isActive && "opacity-50",
                )}
              />
            ) : item.Icon ? (
              <item.Icon
                className={cn(
                  "size-[15px] transition-all duration-300",
                  isActive ? "text-primary" : "opacity-50",
                )}
              />
            ) : null}
            <span className="hidden md:inline">{item.label}</span>
            {isActive && item.id === "aoun" && (
              <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export { HeaderNavTabs };
