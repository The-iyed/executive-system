import { useEffect } from "react";
import { Button } from "@gl/components/ui/button";
import { useAuth } from "@gl/contexts/AuthContext";
import { ProductTour, useProductTour } from "@gl/components/tour/ProductTour";
import { dashboardTourSteps } from "@gl/components/tour/tourSteps";
import { useTourStore } from "@gl/stores/tour-store";

function DashboardPage() {
  const { logout } = useAuth();
  const dashboardTour = useProductTour("dashboard");
  const setOpenTour = useTourStore((s) => s.setOpenTour);

  useEffect(() => {
    setOpenTour(dashboardTour.open);
    return () => setOpenTour(null);
  }, [dashboardTour.open, setOpenTour]);

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
