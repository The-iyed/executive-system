import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ClipboardList, Clock, CheckCircle2, Plus } from "lucide-react";
import { Calendar } from "@gl/components/calendar/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@gl/components/ui/popover";
import { DirectiveCard } from "@gl/components/requests/DirectiveCard";
import { CreateDirectiveModal } from "@gl/components/requests/CreateDirectiveModal";
import { listMinisterDirectives } from "@gl/api/minister-directives";
import { queryKeys } from "@gl/api/queryKeys";
import { RequestsPageSkeleton } from "@gl/components/skeletons/RequestsPageSkeleton";
import { EmptyState, EmptyRequestsSVG } from "@gl/components/ui/empty-states";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { requestsTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";
import { cn } from "@gl/lib/utils";

type RequestTab = "pending" | "scheduled";

function RequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>("pending");
  const [showCreate, setShowCreate] = useState(false);
  const requestsTour = useProductTour("requests");
  const setOpenTour = useTourStore((s) => s.setOpenTour);

  useEffect(() => {
    setOpenTour(requestsTour.open);
    return () => setOpenTour(null);
  }, [requestsTour.open, setOpenTour]);

  const { data: directives = [], isLoading } = useQuery({
    queryKey: queryKeys.ministerDirectives(),
    queryFn: () => listMinisterDirectives({ limit: 200 }),
  });

  const pendingDirectives = directives.filter((d) => d.scheduling_officer_status === "OPEN");
  const scheduledDirectives = directives.filter((d) => d.scheduling_officer_status === "CLOSED");
  const currentList = activeTab === "pending" ? pendingDirectives : scheduledDirectives;

  const tabs = [
    {
      id: "pending" as const,
      label: "قيد المتابعة",
      count: pendingDirectives.length,
      icon: Clock,
    },
    {
      id: "scheduled" as const,
      label: "مُنجزة",
      count: scheduledDirectives.length,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      {/* Header */}
      <div data-tour="requests-header" className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">التوجيهات الوزارية</h1>
            <p className="text-[11px] text-muted-foreground">
              {directives.length} توجيه • {pendingDirectives.length} قيد المتابعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Plus className="size-4" />
            توجيه جديد
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-card text-muted-foreground transition-colors hover:bg-muted">
                <CalendarIcon className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} collisionPadding={16} className="w-auto p-0">
              <Calendar className="max-w-[320px]" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Status tabs */}
      <div data-tour="requests-tabs" className="flex items-center gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div data-tour="requests-list" className="max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <RequestsPageSkeleton />
        ) : currentList.length === 0 ? (
          <EmptyState
            icon={<EmptyRequestsSVG />}
            title={activeTab === "pending" ? "لا توجد توجيهات قيد الانتظار" : "لا توجد توجيهات مُنجزة"}
            description={activeTab === "pending" ? "ستظهر هنا التوجيهات الجديدة عند ورودها" : "ستظهر هنا التوجيهات التي تم جدولتها"}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentList.map((directive) => (
              <DirectiveCard key={directive.id} directive={directive} />
            ))}
          </div>
        )}
      </div>

      <CreateDirectiveModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ProductTour tourId="requests" steps={requestsTourSteps} isOpen={requestsTour.isOpen} onClose={requestsTour.close} />
    </div>
  );
}

export { RequestsPage };
