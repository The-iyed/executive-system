import { useEffect, useState } from "react";
import { Button } from "@gl/components/ui/button";
import { useAuth } from "@gl/contexts/AuthContext";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { dashboardTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";
import { Skeleton } from "@gl/components/ui/skeleton";

function KpiCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card p-5">
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-3.5 w-24 rounded" />
        <Skeleton className="h-8 w-16 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

function ChartCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border/30 bg-card p-5 ${className}`}>
      <Skeleton className="h-5 w-32 rounded mb-6 ms-auto" />
      <div className="flex items-end gap-3 justify-center h-48">
        {[60, 40, 70, 30, 50].map((h, i) => (
          <Skeleton key={i} className="w-10 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5 flex flex-col items-center justify-center">
      <Skeleton className="h-5 w-28 rounded mb-6" />
      <Skeleton className="size-40 rounded-full" />
      <Skeleton className="h-3 w-24 rounded mt-4" />
    </div>
  );
}

function DistributionSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <Skeleton className="h-5 w-36 rounded mb-5 ms-auto" />
      <div className="flex gap-6">
        <Skeleton className="size-44 rounded-full shrink-0 hidden sm:block" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-8 rounded" />
              <div className="flex items-center gap-2 flex-1 justify-end">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="size-3 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border/30 bg-card p-5">
      <Skeleton className="h-5 w-28 rounded mb-5 ms-auto" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-20 rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full space-y-5 p-6" dir="rtl">
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DistributionSkeleton />
        <DonutSkeleton />
        <ChartCardSkeleton />
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}

function DashboardPage() {
  const { logout } = useAuth();
  const dashboardTour = useProductTour("dashboard");
  const setOpenTour = useTourStore((s) => s.setOpenTour);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setOpenTour(dashboardTour.open);
    return () => setOpenTour(null);
  }, [dashboardTour.open, setOpenTour]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-12">
      <h1 data-tour="dashboard-title" className="text-2xl font-bold">لوحة التحكم</h1>
      <p className="text-muted-foreground">مرحباً بك في المنصة الموحدة</p>
      <Button variant="outline" onClick={logout}>
        تسجيل الخروج
      </Button>
      <ProductTour tourId="dashboard" steps={dashboardTourSteps} isOpen={dashboardTour.isOpen} onClose={dashboardTour.close} />
    </div>
  );
}

export { DashboardPage };
