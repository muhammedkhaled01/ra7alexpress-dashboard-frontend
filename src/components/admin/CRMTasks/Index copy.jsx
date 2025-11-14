import axiosMerchant from "@/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import NoRecordFound from "../../NoRecordFound";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
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
  Filter,
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

const CRMTasksIndex = () => {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);

  // Edit & Delete & Pagination Logic - Start
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("CRM Task access");
  const createAbility = can("CRM Task create");
  const updateAbility = can("CRM Task update");
  const deleteAbility = can("CRM Task delete");

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

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchTasks(currentPage);
  }, [currentPage]);

  const fetchTasks = async (pageNumber) => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get(`crm_tasks?page=${pageNumber}`);
      setLinks(response.data.data.links);
      setTasks(response.data.data.data);
      console.log(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search || search.trim() === "") {
      return;
    }
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`crm_tasks?query=${search}`);
      setTasks(response.data.data);
      setLinks([]);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchTasks();
  };

  const handleSubmitSuccess = () => {
    fetchTasks(currentPage);
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
    pending: "Pending",
    in_progress: "InProgress",
    completed: "Completed",
    escalated: "Escalated",
  };

  return (
    <div>
      <PageTitle title={t("Tasks")} />
      <div className="flex justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <form action="" onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              id="search"
              placeholder={t("Search")}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="filter" type="submit">
              <Filter />
            </Button>
            {refreshBtn && (
              <Button type="button" variant="refresh" onClick={handleRefresh}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">#</TableHead>
              <TableHead>{t("Complaint")}</TableHead>
              <TableHead>{t("Task Name")}</TableHead>
              <TableHead>{t("Description")}</TableHead>
              <TableHead>{t("Assigned To")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
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
                  <TableCell>{task?.crm_complaint_id || ""}</TableCell>
                  <TableCell>{task?.task_name || ""}</TableCell>
                  <TableCell>{task?.description || ""}</TableCell>
                  <TableCell>{task?.user?.name || ""}</TableCell>
                  <TableCell onClick={() => openStatusDialog(task)}>
                    <Badge style={{ margin: "2px 2px" }}>
                      {statuses[task?.status]}
                    </Badge>
                  </TableCell>

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
          api={"crm_tasks/delete"}
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

export default CRMTasksIndex;
