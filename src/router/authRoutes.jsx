import CheckRole from "@/components/CheckRole";
import adminRoutes from "./adminRoutes";
import { AdminLayout } from "@/components/admin/AdminLayout";
import UnAuthorized from "@/components/UnAuthorized";
import NotFound from "@/Error/NotFound";
import { LanguageProvider } from "@/contexts/LanguageProvider";
import LocationTest from "@/components/LocationTest";
import merchantRoutes from "./merchantRoutes";

const authRoutes = [
  {
    name: "adminLayout",
    path: "/",
    element: (
      <>
        <LanguageProvider>
          <AdminLayout />
        </LanguageProvider>
      </>
    ),
    children: [...adminRoutes, ...merchantRoutes]
  },
  {
    name: "unauthorized",
    path: "/unauthorized",
    element: <UnAuthorized />,
  },
  {
    name: "not-found",
    path: "*",
    element: <NotFound />,
  },
  {
    name: "location-test",
    path: "location-test/:tracking_no",
    element: <LocationTest />,
  },
];

export default authRoutes;
