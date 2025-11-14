import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axiosMerchant from "@/axios";
import { useTranslation } from "react-i18next";
import { hasRole } from "@/utils/helpers";
import { useNavigate } from "react-router-dom";

const MyPickupTask = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchPickupTasks = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`pickup_tasks`);
      setTasks(response.data.data);
      console.log("data", response.data.data);
    } catch (error) {
      console.error(t("Error fetching pickup tasks:"), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickupTasks(page);
  }, [page]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const navigate = useNavigate()

  const canAccess = hasRole("Driver")

  if (!canAccess) {
    return navigate("/unauthorized");
  }



  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">{t("Pickup Tasks")}</h2>

      {loading ? (
        <Skeleton className="h-10 w-full mb-4" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("ID")}</TableHead>
              <TableHead isFixed>{t("Merchant")}</TableHead>
              <TableHead>{t("Email")}</TableHead>
              <TableHead>{t("Shipments")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Created At")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length > 0 ? (
              tasks.map((task, key) => (
                <TableRow key={task.id}>
                  <TableCell>{key + 1}</TableCell>
                  <TableCell isFixed>{task.merchant.name}</TableCell>
                  <TableCell>{task.merchant.email}</TableCell>
                  <TableCell>{task.no_of_shipments}</TableCell>
                  <TableCell>
                    <Badge
                      className={`capitalize ${getStatusColor(task.status)}`}
                    >
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(task.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="6" className="text-center">
                  {t("No Pickup Tasks Found")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
    </div>
  );
};

export default MyPickupTask;
