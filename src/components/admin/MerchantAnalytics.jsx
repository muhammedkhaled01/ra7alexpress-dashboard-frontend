import axiosMerchant from "@/axios";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  Users,
  Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "./Layouts/PageTitle";
import AnalyticsCard from "./AnalyticsCard";
import { Button } from "@/components/ui/button";
import Loader from "../Loader";
import { useSelector } from "react-redux";

export const MerchantAnalytics = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const user = useSelector(store => store.auth.user);

  useEffect(() => {
    fetchMerchantStats();
  }, []);

  const fetchMerchantStats = async () => {
    try {
      setLoading(true);
      const response = await axiosMerchant.get("/merchant/dashboard");
      setStats(response.data.data);
    } catch (error) {
      console.error("Error fetching merchant stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMerchantStats();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTotalMetrics = () => {
    return {
      totalShipments: stats?.total_shipments || 0,
      totalValue: stats?.total_shipment_value || '0.00',
      activeTasks: stats?.active_tasks || 0
    };
  };

  // Shipment Statistics Data
  const shipmentsData = [
    { title: t("Total Shipments"), value: stats?.total_shipments || 0, icon: <Boxes className="w-6 h-6 text-primary" /> },
    { title: t("Today's Shipments"), value: stats?.today_shipments || 0, icon: <Package className="w-6 h-6 text-primary" /> },
    { title: t("Pending Pickup"), value: stats?.pending_pickup || 0, icon: <Clock className="" /> },
    { title: t("Picked Shipments"), value: stats?.picked_shipments || 0, icon: <Truck className="" /> },
    { title: t("Completed Tasks"), value: stats?.completed_tasks || 0, icon: <CheckCircle className="" /> },
  ];

  // Financial Data
  const financialData = [
    { title: t("Total Shipment Value"), value: `$${stats?.total_shipment_value || '0.00'}`, icon: <DollarSign className="" /> },
    { title: t("This Month"), value: `$${stats?.this_month_value || '0.00'}`, icon: <DollarSign className="" /> },
    { title: t("Average Shipment"), value: `$${stats?.avg_shipment_value || '0.00'}`, icon: <TrendingUp className="" /> },
    { title: t("Account Balance"), value: `$${stats?.account_balance || '0.00'}`, icon: <DollarSign className="" /> },
  ];

  // Performance Data
  const performanceData = [
    { title: t("Delivery Rate"), value: `${stats?.delivery_rate || 0}%`, icon: <TrendingUp className="" /> },
    { title: t("Delivered Shipments"), value: stats?.delivered_shipments || 0, icon: <CheckCircle className="" /> },
    { title: t("Active Tasks"), value: stats?.active_tasks || 0, icon: <Activity className="" /> },
  ];

  // Recent Activity Data
  const activityData = [
    { title: t("This Week"), value: stats?.summary?.shipments_this_week || 0, icon: <Calendar className="" /> },
    { title: t("This Month"), value: stats?.summary?.shipments_this_month || 0, icon: <Calendar className="" /> },
    { title: t("Pending Tasks"), value: stats?.summary?.pending_tasks || 0, icon: <Users className="" /> },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <PageTitle title={t("Merchant Dashboard")} />
        <div className="flex items-center gap-x-4">
          <Button
            variant="refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className=""
          >
            <RefreshCw />
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xl font-semibold">{t("Welcome")} {user?.name}</h2>
            <p className="text-muted-foreground">{t("Your shipment statistics at a glance")}</p>
          </div>
          <div className="flex gap-x-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{getTotalMetrics().totalShipments}</h3>
              <p className="text-muted-foreground">{t("Total Shipments")}</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">${getTotalMetrics().totalValue}</h3>
              <p className="text-muted-foreground">{t("Total Value")}</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{getTotalMetrics().activeTasks}</h3>
              <p className="text-muted-foreground">{t("Active Tasks")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard
          data={shipmentsData}
          title={t("Shipment Statistics")}
          chartType={['line', 'pie']}
          icon={<Package className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={financialData}
          title={t("Financial Overview")}
          chartType={['Vertical', 'Line']}
          icon={<DollarSign className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={performanceData}
          title={t("Performance Metrics")}
          chartType={['line', 'bar']}
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={activityData}
          title={t("Recent Activity")}
          chartType={['gauge', 'pie']}
          icon={<Activity className="w-6 h-6 text-primary" />}
        />
      </div>
    </div>
  );
}; 