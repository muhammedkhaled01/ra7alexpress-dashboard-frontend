import { Login } from "@/components/Login";
import NotFound from "@/Error/NotFound";

const guestRoutes = [
  {
    name: "login",
    path: "/login",
    element: <Login />,
  },
  {
    name: "not-found",
    path: "*",
    element: <NotFound />,
  },
];

export default guestRoutes;
