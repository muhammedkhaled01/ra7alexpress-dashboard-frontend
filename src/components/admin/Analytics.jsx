import axiosMerchant from "@/axios";
import {
  Package,
  Clock,
  RefreshCw,
  Truck,
  CheckCircle,
  Users,
  Database,
  DollarSign,
  Shield,
  Bell,
  Gauge,
  Users2,
  Boxes,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PageTitle from "./Layouts/PageTitle";
import AnalyticsCard from "./AnalyticsCard";
import { useDispatch, useSelector } from "react-redux";
import { getDashboard } from "@/stores/features/dashboardFeature";
import Loader from "../Loader";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { can, hasRole, isAuthorized } from "@/utils/helpers";
import { MerchantAnalytics } from "./MerchantAnalytics";

export const Analytics = () => {
  const { dashboard, loading } = useSelector((state) => state.dashboard);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const user = useSelector((store) => store.auth.user);
  const isMerchant = hasRole("Merchant");

  const analyticsAccess = can("Analytics access");

  useEffect(() => {
    dispatch(getDashboard());
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    dispatch(getDashboard());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getTotalMetrics = () => {
    return {
      totalShipments: dashboard?.all_shipments || 0,
      totalDeliveries: dashboard?.delivered_shipments || 0,
      totalIssues: dashboard?.returns_shipments || 0,
    };
  };

  const shipmentsData = [
    {
      title: t("analytics.allShipments"),
      value: dashboard?.all_shipments,
      icon: <Boxes className="w-6 h-6 text-primary" />,
    },
    {
      title: t("analytics.todayShipments"),
      value: dashboard?.today_shipments,
      icon: <Package className="w-6 h-6 text-primary" />,
    },
    {
      title: t("analytics.shipmentsOutForDelivery"),
      value: dashboard?.ofd_shipments,
      icon: <Clock className="" />,
    },
    {
      title: t("analytics.returns"),
      value: dashboard?.returns_shipments,
      icon: <RefreshCw className="" />,
    },
    {
      title: t("analytics.completedShipments"),
      value: dashboard?.delivered_shipments,
      icon: <CheckCircle className="" />,
    },
  ];

  const driversData = [
    {
      title: t("analytics.activeDrivers"),
      value: dashboard?.active_drivers,
      icon: <Users className="" />,
    },
    {
      title: t("analytics.averageDeliveryTime"),
      value: "30",
      icon: <Clock className="" />,
      notAllowed: true,
    },
    {
      title: t("analytics.deliveryExceptions"),
      value: 3,
      icon: <Truck className="" />,
      notAllowed: true,
    },
  ];

  const warehouseData = [
    {
      title: t("analytics.readyToShip"),
      value: 150,
      icon: <Database className="" />,
      notAllowed: true,
    },
    {
      title: t("analytics.stockLevels"),
      value: "75",
      icon: <Gauge className="" />,
      notAllowed: true,
    },
    {
      title: t("analytics.stockAccess"),
      value: "90",
      icon: <Truck className="" />,
      notAllowed: true,
    },
  ];

  const financialData = [
    {
      title: t("analytics.collectedCodToday"),
      value: dashboard?.completed_cod,
      icon: <DollarSign className="" />,
    },
    {
      title: t("analytics.pendingMerchantInvoices"),
      value: dashboard?.pending_cod,
      icon: <DollarSign className="" />,
    },
  ];

  const operationalQualityData = [
    {
      title: t("analytics.openIssues"),
      value: 5,
      icon: <Shield className="" />,
    },
    {
      title: t("analytics.firstAttemptSuccessRate"),
      value: "95",
      icon: <CheckCircle className="" />,
      notAllowed: true,
    },
  ];

  const alertsData = [
    {
      title: t("analytics.openAlerts"),
      value: dashboard?.notifications,
      icon: <Bell className="" />,
    },
    {
      title: t("analytics.newComplaints"),
      value: 1,
      icon: <Bell className="" />,
      notAllowed: true,
    },
  ];

  if (isMerchant) {
    return <MerchantAnalytics />;
  }

  const navigate = useNavigate();

  // const canAccess = can("Dashboard access");

  // if (!canAccess) {
  //   return navigate("/unauthorized");
  // }

  // if (!analyticsAccess && canAccess) {
  //   return (
  //     <div className="">
  //       <PageTitle title={t("Dashboard")} />
  //       <br />
  //       <div>
  //         <h2 className="text-xl font-semibold">
  //           {t("Welcome ")} {user?.name}
  //         </h2>
  //       </div>
  //     </div>
  //   );
  // }

  return loading ? (
    <div className="flex min-h-screen justify-center items-center ">
      <Loader />
    </div>
  ) : (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <PageTitle title={t("Dashboard")} />
        <div className="flex items-center gap-x-4">
          <Button
            variant="refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className=""
          >
            <RefreshCw />
          </Button>
          <Button
            disabled={true}
            variant="secondary"
            // onClick={() => navigate("/shipment-reports")}
          >
            {t("View Detailed Reports")}
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xl font-semibold">{t("System Status")}</h2>
            <p className="text-muted-foreground">
              {t("System is running smoothly")}
            </p>
          </div>
          <div className="flex gap-x-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {getTotalMetrics().totalShipments}
              </h3>
              <p className="text-muted-foreground">{t("Total Shipments")}</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {getTotalMetrics().totalDeliveries}
              </h3>
              <p className="text-muted-foreground">{t("Total Deliveries")}</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {getTotalMetrics().totalIssues}
              </h3>
              <p className="text-muted-foreground">{t("Total Issues")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard
          data={shipmentsData}
          title={t("analytics.basicStatistics")}
          chartType={["line", "pie"]}
          icon={<Package className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={driversData}
          title={t("analytics.drivers")}
          chartType={["line", "bar"]}
          icon={<Users2 className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={warehouseData}
          title={t("analytics.warehouseInventory")}
          chartType={["gauge", "pie"]}
          icon={<Database className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={financialData}
          title={t("analytics.financials")}
          chartType={["Vertical", "Line"]}
          icon={<DollarSign className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={operationalQualityData}
          title={t("analytics.operationalQuality")}
          chartType={["Line"]}
          icon={<Shield className="w-6 h-6 text-primary" />}
        />
        <AnalyticsCard
          data={alertsData}
          title={t("analytics.alertsComplaints")}
          chartType={["Line"]}
          icon={<Bell className="w-6 h-6 text-primary" />}
        />
      </div>
    </div>
  )
};
