import axiosMerchant from "@/axios";
import {
  Package,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Activity,
  RefreshCw,
  Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "./Layouts/PageTitle";
import AnalyticsCard from "./AnalyticsCard";
import { Button } from "@/components/ui/button";
import Loader from "../Loader";
import { useSelector } from "react-redux";
import { formatDecimalValue } from "@/utils/helpers";

export const MerchantSummary = () => {
  const { t } = useTranslation();
  const [kpiStats, setKpiStats] = useState({});
  const [chartStats, setChartStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { decimalPrecision } = useSelector((state) => state.setting);
  const user = useSelector(store => store.auth.user);

  useEffect(() => {
    fetchMerchantStats();
  }, []);
  useEffect(() => {
    if (Object.keys(kpiStats).length > 0) {
      const updatedKpiStats = { ...kpiStats };
      if (updatedKpiStats.total_revenue) {
        updatedKpiStats.total_revenue = parseFloat(updatedKpiStats.total_revenue);
      }
      if (updatedKpiStats.total_cod) {
        updatedKpiStats.total_cod = parseFloat(updatedKpiStats.total_cod);
      }
      if (updatedKpiStats.avg_shipment_value) {
        updatedKpiStats.avg_shipment_value = parseFloat(updatedKpiStats.avg_shipment_value);
      }
      setKpiStats(updatedKpiStats);
    }
  }, [decimalPrecision]);

  const fetchMerchantStats = async () => {
    try {
      setLoading(true);
      const [kpiRes, chartsRes] = await Promise.all([
        axiosMerchant.get("/merchant/dashboard/kpi-summary"),
        axiosMerchant.get("/merchant/dashboard/charts")
      ]);
      setKpiStats(kpiRes.data.data);
      setChartStats(chartsRes.data.data);
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
      totalShipments: kpiStats?.total_shipments || 0,
      totalValue: formatDecimalValue(kpiStats?.total_revenue, decimalPrecision) || formatDecimalValue(0, decimalPrecision),
      activeTasks: kpiStats?.pending_shipments || 0
    };
  };

  // Shipment Statistics Data
  const shipmentsData = [
    { title: t("Total Shipments"), value: kpiStats?.total_shipments || 0, icon: <Boxes className="w-6 h-6 text-primary" /> },
    { title: t("Delivered Shipments"), value: kpiStats?.delivered_shipments || 0, icon: <CheckCircle className="" /> },
    { title: t("Pending Shipments"), value: kpiStats?.pending_shipments || 0, icon: <Clock className="" /> },
    { title: t("Success Rate"), value: `${kpiStats?.success_rate || 0}%`, icon: <TrendingUp className="" /> },
  ];

  // Financial Data
  const financialData = [
    { title: t("Total COD"), value: `$${formatDecimalValue(kpiStats?.total_cod, decimalPrecision) || formatDecimalValue(0, decimalPrecision)}`, icon: <DollarSign className="" /> },
    { title: t("Total Revenue"), value: `$${formatDecimalValue(kpiStats?.total_revenue, decimalPrecision) || formatDecimalValue(0, decimalPrecision)}`, icon: <DollarSign className="" /> },
    { title: t("Avg Shipment Value"), value: `$${formatDecimalValue(kpiStats?.avg_shipment_value, decimalPrecision) || formatDecimalValue(0, decimalPrecision)}`, icon: <TrendingUp className="" /> },
  ];

  // Performance Data
  const performanceData = [
    { title: t("Delivery Rate"), value: `${kpiStats?.delivery_rate || 0}%`, icon: <TrendingUp className="" /> },
    { title: t("Delivered Shipments"), value: kpiStats?.delivered_shipments || 0, icon: <CheckCircle className="" /> },
  ];

  // Chart Data
  const shipmentTrendsData = chartStats?.shipment_trends?.map(item => ({ title: item.label, value: item.count })) || [];
  const statusDistributionData = chartStats?.status_distribution?.map(item => ({ title: item.status_group, value: item.count })) || [];
  const paymentBreakdownData = chartStats?.payment_breakdown?.map(item => ({ title: item.payment_type, value: item.count })) || [];
  const monthlyPerformanceData = chartStats?.monthly_performance?.map(item => ({ title: item.label, value: item.total_shipments })) || [];

  // Recent Activity Data (unused)

  const tabs = [t('Overview'), t('Analytics')];
  const [activeTab, setActiveTab] = useState(tabs[0]);

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ` +
                (activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')
              }
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === t('Overview') ? (
        <>
          {/* Welcome Banner */}
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
                  <p className="text-muted-foreground">{t("Total Revenue")}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{getTotalMetrics().activeTasks}</h3>
                  <p className="text-muted-foreground">{t("Pending Shipments")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnalyticsCard
              data={shipmentsData}
              title={t("Shipment Statistics")}
              chartType={['line', 'pie']}
              icon={<Package className="w-6 h-6 text-primary" />}
            />
            <AnalyticsCard
              data={financialData}
              title={t("Financial Overview")}
              chartType={['bar']}
              icon={<DollarSign className="w-6 h-6 text-primary" />}
            />
            <AnalyticsCard
              data={performanceData}
              title={t("Performance Metrics")}
              chartType={['bar']}
              icon={<TrendingUp className="w-6 h-6 text-primary" />}
            />
          </div>
        </>
      ) : (
        <>
          {/* Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsCard
              data={shipmentTrendsData}
              title={t("Shipment Trends")}
              chartType={['line']}
              icon={<TrendingUp className="w-6 h-6 text-primary" />}
            />
            <AnalyticsCard
              data={statusDistributionData}
              title={t("Status Distribution")}
              chartType={['pie']}
              icon={<Activity className="w-6 h-6 text-primary" />}
            />
            <AnalyticsCard
              data={paymentBreakdownData}
              title={t("Payment Breakdown")}
              chartType={['bar']}
              icon={<DollarSign className="w-6 h-6 text-primary" />}
            />
            <AnalyticsCard
              data={monthlyPerformanceData}
              title={t("Monthly Performance")}
              chartType={['bar']}
              icon={<Calendar className="w-6 h-6 text-primary" />}
            />
          </div>
        </>
      )}
    </div>
  );
};