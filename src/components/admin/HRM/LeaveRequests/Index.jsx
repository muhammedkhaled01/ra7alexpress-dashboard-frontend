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
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../Layouts/PageTitle";
import { Button } from "@/components/ui/button";
import Create from "./Create";
import Edit from "./Edit";
import { Input } from "@/components/ui/input";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { handleError } from "@/utils/helpers";
import NoRecordFound from "@/components/NoRecordFound";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, Filter, MoreHorizontal, Trash2Icon, RefreshCcw, Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { can } from "@/utils/helpers";

const LeaveRequestIndex = () => {
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useSelector(store => store.auth.user)

  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const accessAbility = can("Leave Request access");
  const createAbility = can("Leave Request create");
  const updateAbility = can("Leave Request update");
  const deleteAbility = can("Leave Request delete");

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
    }
    fetchLeaveRequests();
  }, [accessAbility, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.get("/leave_requests");
      setLeaveRequests(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    setLoading(true);
    setRefreshBtn(true);
    try {
      const response = await axiosMerchant.get(`/leave_requests?query=${search}`);
      setLeaveRequests(response.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setSearch("");
    setRefreshBtn(false);
    fetchLeaveRequests();
  };

  const handleSubmitSuccess = () => {
    fetchLeaveRequests();
  };

  const openDeleteAlert = (record) => {
    setSelectedRecord(record);
    setDeleteAlert(true);
  };

  const openEditDialog = (record) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setSelectedRecord(null);
    setEditDialogOpen(false);
  };

  const closeDeleteAlert = () => {
    setSelectedRecord(null);
    setDeleteAlert(false);
  };


  const handleApprove = async (id) => {
    try {
      const response = await axiosMerchant.post(`/leave_requests/approve`, {
        leave_id: id,
        approver_id: authUser.id,
      });

      toast.success(response.data.message || "Leave request approved successfully!");

      fetchLeaveRequests(); // Refresh the list
    } catch (error) {
      console.error("Error approving leave request", error);
      toast.error(error.response?.data?.message || "Failed to approve leave request.");
    }
  };


  const handleReject = async (id) => {
    try {
      await axiosMerchant.post(`/leave_requests/reject`, {
        parms: {
          leave_id: id,
          approver_id: authUser.id
        }
      });
      fetchLeaveRequests();
    } catch (error) {
      console.error("Error rejecting leave request", error);
    }
  };

  return (
    <div>
      <PageTitle title={t("Leave Requests")} />
      <div className="flex flex-col md:flex-row gap-3 justify-between mt-2">
        <div>
          {createAbility && <Create onSubmitSuccess={handleSubmitSuccess} />}
        </div>

        <form onSubmit={handleSearch}>
          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-[200px]"
              value={search}
              placeholder={t("Search Leave Request...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && search.trim() !== "" && (
                  <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                )
              }
            />
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
      <div className="shadow-md py-4 mt-2 rounded-lg">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableHeader>
          </Table>
        ) : leaveRequests && leaveRequests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ID")}</TableHead>
                <TableHead>{t("Employee Name")}</TableHead>
                <TableHead>{t("Leave Type")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Start Date")}</TableHead>
                <TableHead>{t("End Date")}</TableHead>
                <TableHead>{t("Proof File")}</TableHead>
                {/* <TableHead>{t("Action")}</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>
                    {request.user.name}
                    <div className="flex gap-x-2 mt-2">
                      {updateAbility && (
                        <Button onClick={() => openEditDialog(request)} variant="edit" size="xs">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {deleteAbility && (
                        <Button onClick={() => openDeleteAlert(request)} variant="delete" size="xs">
                          <Trash2Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.leave_reason.name_en ??
                      request.leave_reason.name_ar}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${request.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : request.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {request.status}
                    </span>
                  </TableCell>

                  <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {request.proof_file ? (
                      <a
                        href={request.proof_file}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  {/* <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {updateAbility && (
                          <DropdownMenuItem onClick={() => openEditDialog(request)}>
                            <EditIcon className="p-1" /> {t("Edit")}
                          </DropdownMenuItem>
                        )}
                        {deleteAbility && (
                          <DropdownMenuItem
                            onClick={() => openDeleteAlert(request)}
                          >
                            <Trash2Icon className="w-4 h-4 mr-2 text-red-500" />{" "}
                            Delete
                          </DropdownMenuItem>
                        )}
                        {request.status?.toLowerCase() === "pending" && (
                          <DropdownMenuItem
                            onClick={() => handleApprove(request.id)}
                          >
                            Approve
                          </DropdownMenuItem>
                        )}
                        {request.status?.toLowerCase() === "approved" && (
                          <DropdownMenuItem>approved</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <NoRecordFound />
              </TableCell>
            </TableRow>
          </Table>
        )}
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={'leave_requests/delete'}
        />
      )}
      {editDialogOpen && (
        <Edit
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeEditDialog}
          feature={{
            baseEndpoint: '/leave_requests',
            editTitle: t('Edit Leave Request')
          }}
        />
      )}

    </div>
  );
};

export default LeaveRequestIndex;
