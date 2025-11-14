import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import NoRecordFound from "../../NoRecordFound";
import { Button } from "@/components/ui/button";
import PageTitle from "../Layouts/PageTitle";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import Select from "@/components/misc/Select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { can, handleError } from "@/utils/helpers";
import {
  EditIcon,

  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Create from "./Create";
import Edit from "./Edit";
import Status from "./Status";

const PickupTasksIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Pickup Task access");
  const createAbility = can("Pickup Task create");
  const updateAbility = can("Pickup Task update");
  const deleteAbility = can("Pickup Task delete");

  // DELETE ALERT
  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const openEditDialog = (record) => {
    setselectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setselectedRecord(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Edit & Delete & Pagination Logic - End

  const fetchTasks = useCallback(async (pageNumber, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNumber,
        per_page: itemsPerPage,
        query: search || '',
      });

      // Remove empty parameters
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      const response = await axiosMerchant.get(`pickup_tasks?${params.toString()}`);
      setTasks(response.data.data.data.data || []);
      console.log(response.data.data.data,'response.data.data.data')
      setLinks(response.data.data.data.links || []);
      setTotalItems(response.data.data.currentPage || 0);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
  }, [accessAbility, navigate]);

  useEffect(() => {
    fetchTasks(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchTasks, itemsPerPage]);

  const handleRefresh = () => {
    setSearch("");
    setItemsPerPage(10);
    setCurrentPage(1);
    if (debouncedSearch === "") {
      fetchTasks(1, "");
    }
  };


  const handleSubmitSuccess = () => {
    fetchTasks(currentPage, debouncedSearch);
  };

  // DIALOG STATUS
  const openStatusDialog = (record) => {
    setselectedRecord(record);
    setStatusDialog(true);
  };

  const closeStatusDialog = () => {
    setselectedRecord(null);
    setStatusDialog(false);
  };

  const statuses = {
    to_pickup: "to_pickup",
    pickup_completed: "completed",
    cancelled: "cancelled",
    picked: "picked",
    pending: "pending",
  };
  const statusColors = {
    [statuses.to_pickup]: {
      backgroundColor: "hsl(210, 70%, 90%)",
      color: "hsl(210, 80%, 30%)",
    },
    [statuses.pickup_completed]: {
      // A clean, vibrant green
      backgroundColor: "hsl(145, 60%, 70%)",
      color: "hsl(145, 80%, 25%)",
    },
    [statuses.cancelled]: {
      backgroundColor: "hsl(0, 80%, 90%)",
      color: "hsl(0, 90%, 40%)",
    },
    [statuses.picked]: {
      backgroundColor: "hsl(30, 80%, 85%)",
      color: "hsl(30, 90%, 30%)",
    },
    [statuses.pending]: {
      backgroundColor: "hsl(240, 50%, 90%)",
      color: "hsl(240, 60%, 40%)",
    },
  };
  return (
    <div>
      <PageTitle title={t("Pickup Tasks")} />
      <div className="flex flex-col md:flex-row gap-2 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-center mt-2">
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              id="search"
              placeholder={t("Search By Note...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                search && (
                  <RefreshCcw
                    className="w-4 h-4 cursor-pointer"
                    onClick={handleRefresh}
                  />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('Show')}:
            </span>
            <Select
              className="w-20"
              value={{ value: itemsPerPage, label: itemsPerPage }}
              onChange={(selected) => {
                setItemsPerPage(selected.value);
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: '5' },
                { value: 8, label: '8' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead isFixed>{t("Merchant")}</TableHead>
              <TableHead>{t("Assigned To")}</TableHead>
              <TableHead>{t("No of Shipments")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Note")}</TableHead>
              <TableHead className="text-right">{t("Actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : tasks && tasks.length > 0 ? (
              tasks.map((task, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell isFixed>{task?.merchant?.name || ""}</TableCell>
                  <TableCell>{task?.driver?.name || ""}</TableCell>
                  <TableCell>{task?.no_of_shipments || ""}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        // onClick={() => openStatusDialog(task)}
                        className="capitalize flex items-center gap-3"
                        style={{
                          margin: "2px 2px",
                          backgroundColor: statusColors[task?.status]?.backgroundColor,
                          color: statusColors[task?.status]?.color,
                        }}
                      >
                        {statuses[task?.status]}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{task?.note || ""}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="h-8">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {updateAbility && (
                          <DropdownMenuItem
                            onClick={() => openEditDialog(task)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(task)}
                          >
                            <Trash2Icon className="w-4 h-4 mr-2" />
                            {t("Delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination links={links} onPageChange={handlePageChange} />
      </div>

      {statusDialog && (
        <Status
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeStatusDialog}
        />
      )}

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"pickup_tasks/delete"}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
        />
      )}
    </div>
  );
};

export default PickupTasksIndex;
