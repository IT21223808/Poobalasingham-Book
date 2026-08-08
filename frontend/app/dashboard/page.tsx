import DashboardCards from "@/components/dashboard/DashboardCards";
import SalesChart from "@/components/dashboard/SalesChart";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentSales from "@/components/dashboard/RecentSales";
import LowStock from "@/components/dashboard/LowStock";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
<div className="hidden md:block">
    <Breadcrumb />
  </div>
      <DashboardCards />

      <div className="grid gap-6 xl:grid-cols-3">

        <div className="space-y-6 xl:col-span-2">

          <SalesChart />

          <RecentSales />

        </div>

        <div className="space-y-6">

          <QuickActions />

          <LowStock />

        </div>

      </div>

    </div>
  );
}