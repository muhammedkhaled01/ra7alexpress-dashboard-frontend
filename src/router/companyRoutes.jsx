import CompanyDashboard from "@/components/company/CompanyDashboard";
import CompanyNotifications from "@/components/company/CompanyNotifications";
import NotFound from "@/Error/NotFound";

const companyRoutes = [
  {
    name: "companyDashboard",
    path: "dashboard",
    element: <CompanyDashboard />,
  },
  {
    name: "shipments",
    path: "shipments",
    element: <CompanyNotifications />,
  },
  {
    name: "not-found",
    path: "*",
    element: <NotFound />,
  },
];

export default companyRoutes;
