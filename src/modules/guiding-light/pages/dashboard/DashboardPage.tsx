import { useEffect, useState } from "react";
import { Button } from "@gl/components/ui/button";
import { useAuth } from "@gl/contexts/AuthContext";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { dashboardTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";
import { Skeleton } from "@gl/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-12">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-5 w-64 rounded-md" />
      <Skeleton className="h-10 w-32 rounded-md" />
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
