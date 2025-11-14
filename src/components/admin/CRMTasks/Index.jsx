import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState, useCallback } from "react";
import NoRecordFound from "../../NoRecordFound";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import Loader from "@/components/Loader";
import Select from "@/components/misc/Select";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Eye, Loader2, Pencil, RefreshCcw } from "lucide-react";
import EditTask from "./Edit";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { can, handleError } from "@/utils/helpers";
import axiosMerchant from "@/axios";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import View from "./View";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";
import moment from "@/utils/moment";
import { useSelector } from "react-redux";

/* ====================== Helpers ====================== */

const typeToLabel = (fqcn) => {
  if (!fqcn) return null;
  const last = String(fqcn).split("\\").pop();
  switch (last) {
    case "Hub":
      return "Hub";
    case "Station":
      return "Station";
    case "Branch":
      return "Branch";
    default:
      return "Workspace";
  }
};

const getFirstHistory = (shipment) => {
  const hs = shipment?.shipment_histories ?? shipment?.shipmentHistories ?? [];
  return Array.isArray(hs) && hs.length ? hs[0] : null;
};

const pickName = (obj, keys) => {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj?.[k];
    if (v) return v;
  }
  return null;
};

function getHubOrStationFromShipment(shipment) {
  const history0 = getFirstHistory(shipment);

  const facilityType = history0?.facility_type || null;
  if (facilityType) {
    const label = typeToLabel(facilityType) || "Workspace";
    const valueFromHistory = pickName(history0, [
      "operation_hub_name",
      "operation_station_name",
      "operation_owner_name",
      "owner_name",
      "operation_facility_name",
      "facility_name",
      "operation_name",
    ]);

    const value =
      valueFromHistory ||
      pickName(shipment?.core_status, [
        "operation_hub_name",
        "operation_station_name",
      ]) ||
      shipment?.station_name ||
      shipment?.destination_owner?.name ||
      "N/A";

    return { label, value };
  }

  const destType =
    shipment?.destination_owner_type ||
    shipment?.destinationOwner?.model_type ||
    null;
  const destName =
    shipment?.destination_owner?.name || shipment?.destinationOwner?.name || null;

  if (destType || destName) {
    return {
      label: typeToLabel(destType) || "Workspace",
      value: destName || "N/A",
    };
  }

  const coreHub = shipment?.core_status?.operation_hub_name || null;
  const coreStation = shipment?.core_status?.operation_station_name || null;
  if (coreHub) return { label: "Hub", value: coreHub };
  if (coreStation) return { label: "Station", value: coreStation };

  if (shipment?.station_name)
    return { label: "Station", value: shipment.station_name };

  return { label: "Workspace", value: "N/A" };
}

const formatPhonePair = (cc1, p1, cc2, p2, t) => {
  const main = (cc1 ? String(cc1) : "") + (p1 ? String(p1) : "");
  const alt = (cc2 ? String(cc2) : "") + (p2 ? String(p2) : "");
  if (main && alt) return `${main} / ${alt}`;
  if (main) return main;
  if (alt) return alt;
  return t ? t("N/A") : "N/A";
};

/* ============================================================================================ */

const CRMTasksIndex = () => {
  const [loading, setLoading] = useState(false);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("created");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Workspace filter
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceValue, setWorkspaceValue] = useState(null);
  const authUser = useSelector((store) => store.auth.user);

  const getPath = (obj, path) => {
    if (!obj || !path) return undefined;
    return path
      .split(".")
      .reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  const getAssignedDriverUserId = (shipment) =>
    getPath(shipment, "current_driver.user_id") ??
    getPath(shipment, "driver_id") ??
    getPath(shipment, "driver.user_id");

  const getHistoryOperatorId = (h) =>
    h?.operator_id ??
    h?.operatorId ??
    h?.operatorID ??
    getPath(h, "operator.id");

  const getNoAnswerCountFromShipment = (shipment) => {
    if (!shipment) return 0;
    if (typeof shipment.no_answer_count === "number") return shipment.no_answer_count;

    const assignedId = getAssignedDriverUserId(shipment);
    if (!assignedId) return 0;

    const hs = shipment.shipment_histories ?? shipment.shipmentHistories ?? [];
    if (!Array.isArray(hs) || !hs.length) return 0;

    return hs.filter((h) => {
      const typ = String(h?.type || h?.name || "").toUpperCase();
      const stOk = h?.status
        ? String(h.status).toUpperCase() === "DELIVERY_EXCEPTION"
        : true;
      const opId = getHistoryOperatorId(h);
      return stOk && typ === "NO_ANSWER" && Number(opId) === Number(assignedId);
    }).length;
  };

  const NoAnswerBadge = ({ shipment, show }) => {
    if (!show) return null;
    const c = getNoAnswerCountFromShipment(shipment);
    return c > 0 ? (
      <Badge variant="secondary" className="ml-2">
        ×{c}
      </Badge>
    ) : null;
  };

  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const [filters, setFilters] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
    workspace_key: null,
    workspace_type: null,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleCopy = async (trackingNumber) => {
    if (!trackingNumber) return;
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setCopiedTrackingNo(trackingNumber);
      setTimeout(() => setCopiedTrackingNo(null), 2000);
    } catch (err) {
      console.error("Failed to copy tracking number", err);
    }
  };

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("CRM Task access");
  useEffect(() => {
    if (!accessAbility) {
      navigate("unauthorized");
    }
  }, [accessAbility, navigate]);

  // ✅ Load workspaces from authUser
  useEffect(() => {
    const workspaceData = authUser?.workspaces || [];
    const mapped = workspaceData.map((ws) => {
      const typeName = String(ws?.type || "")
        .split("\\")
        .pop();
      return {
        value: ws.id,
        label: `${ws.name || `Workspace #${ws.id}`} ${
          typeName ? `(${typeName})` : ""
        }`,
        type: ws.type,
      };
    });
    setWorkspaces(mapped);
  }, [authUser]);

  const statusMapping = {
    Created: "created",
    "To Call": "to_call",
    Hold: "hold",
    Closed: "closed",
  };
  const reverseStatusMapping = Object.fromEntries(
    Object.entries(statusMapping).map(([k, v]) => [v, k])
  );

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      params.set("per_page", String(itemsPerPage));
      params.set("page", String(currentPage));

      if (search?.trim()) params.set("query", search.trim());
      if (selectedStatus) params.set("status", selectedStatus);

      params.set("date_filter", "1");
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.from_time) params.set("from_time", filters.from_time);
      if (filters.to_time) params.set("to_time", filters.to_time);

      // ✅ Workspace filter
      if (filters.workspace_key)
        params.set("workspace_key", filters.workspace_key);
      if (filters.workspace_type)
        params.set("workspace_type", filters.workspace_type);

      const response = await axiosMerchant.get(`crm_tasks?${params.toString()}`);

      setTasks(response?.data?.data?.data ?? []);
      setLinks(response?.data?.data?.links ?? []);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, currentPage, search, selectedStatus, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshBtn(!!search.trim());
      setCurrentPage(1);
      fetchTasks();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchTasks]);

  const handleView = (task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };
  const handleEdit = (task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleRefresh = () => {
    setSearch("");
    setItemsPerPage(8);
    setCurrentPage(1);
    setWorkspaceValue(null);
    setFilters({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
      workspace_key: null,
      workspace_type: null,
    });
    fetchTasks();
  };

  const statuses = [
    { value: "created", label: "Created" },
    { value: "to_call", label: "To Call" },
    { value: "hold", label: "Hold" },
    { value: "closed", label: "Closed" },
  ];

  const statusColors = {
    created:
      "bg-muted text-foreground hover:bg-muted/80 dark:bg-gray-900/70 dark:text-foreground dark:hover:bg-gray-900",
    to_call:
      "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800",
    hold: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800",
    closed:
      "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-800 dark:text-rose-100 dark:hover:bg-rose-800",
  };

  const statusCounts = useMemo(
    () =>
      statuses.reduce((acc, s) => {
        acc[s.value] = tasks?.filter((task) => task.status === s.value).length;
        return acc;
      }, {}),
    [tasks]
  );

  const [isLoading, setIsLoading] = useState(false);
  const filteredTasks = useMemo(
    () => tasks?.filter((task) => task.status === selectedStatus),
    [tasks, selectedStatus]
  );

  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    const updatedTasks = tasks?.map((task) =>
      task.status === selectedStatus ? { ...task, checked: newSelectAll } : task
    );
    setTasks(updatedTasks);
    setSelectedRows(
      newSelectAll
        ? updatedTasks
            ?.filter((t) => t.status === selectedStatus)
            .map((t) => t.id)
        : []
    );
  };

  const handleTaskCheckboxChange = (id) => {
    const updatedTasks = tasks?.map((task) =>
      task.id === id ? { ...task, checked: !task.checked } : task
    );
    setTasks(updatedTasks);
    const updatedSelectedRows = updatedTasks
      .filter((t) => t.checked)
      .map((t) => t.id);
    setSelectedRows(updatedSelectedRows);
    setSelectAll(updatedTasks?.every((t) => t.checked));
  };

  const updateTaskStatus = async (event) => {
    event.preventDefault();
    if (!selectedRows.length) return;
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const newStatus = String(formData.get("status") ?? "");

    try {
      const response = await axiosMerchant.post("/crm_tasks/change_status", {
        task_ids: selectedRows,
        status: newStatus,
      });
      toast.success(response.data.message);

      setSelectedRows([]);
      setSelectAll(false);
      setTasks((prev) => prev.map((t) => ({ ...t, checked: false })));
      fetchTasks();
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canAccess = can("CRM Task access");
  if (!canAccess) return navigate("/unauthorized");

  return (
    <div>
      <PageTitle title={t("Tasks")} />

      {/* FILTERS BAR */}
      <div className="flex flex-wrap items-end justify-between bg-white dark:bg-gray-800 shadow rounded p-4 my-4 gap-4">
        {/* Status Pills */}
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <Button
              key={s.value}
              variant={selectedStatus === s.value ? "default" : "outline"}
              className={`capitalize w-[47%] md:w-fit shadow-none ${
                statusColors[s.value]
              } px-4 py-2`}
              onClick={() => {
                setSelectedStatus(s.value);
                setCurrentPage(1);
              }}
            >
              {t(s.label)}
              <span className="ml-1 text-sm">
                ({statusCounts[s.value] || 0})
              </span>
            </Button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex flex-col md:flex-row gap-3 items-end md:items-center ml-auto">
          {/* ✅ Workspace Filter */}
          <div className="w-[220px]">
            <Label>{t("Workspace")}</Label>
            <Select
              placeholder={t("All Workspaces")}
              options={workspaces}
              value={workspaceValue}
              onChange={(opt) => {
                setWorkspaceValue(opt);
                handleFilterChange("workspace_key", opt ? opt.value : null);
                handleFilterChange("workspace_type", opt ? opt.type : null);
              }}
              isClearable
              className="mt-1"
            />
          </div>

          {/* Date & Time Range */}
          <div className="flex flex-col">
            <DateTimeRangePicker
              filters={filters}
              onChange={(k, v) => handleFilterChange(k, v)}
              t={t}
            />
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <Input
              name="search"
              type="text"
              className="w-[220px]"
              value={search}
              id="search"
              placeholder={t("Search By Tracking Number...")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && (
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

          {/* Per page */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">
              {t("Show")}
            </label>
            <Select
              value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
              onChange={(selectedOption) => {
                setItemsPerPage(Number(selectedOption.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 5, label: "5" },
                { value: 8, label: "8" },
                { value: 15, label: "15" },
                { value: 25, label: "25" },
                { value: 50, label: "50" },
                { value: 100, label: "100" },
              ]}
              className="w-20 text-sm"
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between bg-white dark:bg-gray-800 shadow rounded p-4 mb-4">
          <div className="flex items-center gap-x-2">
            <form
              onSubmit={updateTaskStatus}
              className="flex items-center gap-x-2"
            >
              <Label>{t("Task Status")}</Label>
              <Select
                name="status"
                options={[
                  { value: "to_call", label: t("To Call") },
                  { value: "hold", label: t("Hold") },
                  { value: "closed", label: t("Closed") },
                ]}
                className="basic-multi-select w-[200px]"
                classNamePrefix="select"
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Update")
                )}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="shadow-md p-4 rounded-lg">
        {!loading && filteredTasks?.length > 0 && selectedRows.length === 0 && (
          <div className="mt-4 bg-yellow-100 dark:bg-yellow-900 mb-2 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-md text-sm">
            {t("taskStatusNote")}
          </div>
        )}

        {loading ? (
          <Table>
            <TableRow>
              <TableCell colSpan={13} className="text-center">
                <Loader />
              </TableCell>
            </TableRow>
          </Table>
        ) : filteredTasks?.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>{t("Issue")}</TableHead>
                  <TableHead isFixed>{t("Tracking #")}</TableHead>
                  <TableHead>{t("Recipient")}</TableHead>
                  <TableHead>{t("Numbers")}</TableHead>
                  <TableHead>{t("Merchant")}</TableHead>
                  <TableHead>{t("Workspace")}</TableHead>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task, index) => {
                  const wsInfo = getHubOrStationFromShipment(task?.shipment);

                  return (
                    <TableRow key={task.id ?? index}>
                      <TableCell>
                        <input
                          type="checkbox"
                          id={String(task.id)}
                          checked={selectAll || !!task.checked}
                          onChange={() => handleTaskCheckboxChange(task.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <span>{task.title ?? t("N/A")}</span>
                        {(() => {
                          const titleUpper = String(
                            task?.title || ""
                          ).toUpperCase();
                          const shipmentTypeUpper = String(
                            task?.shipment?.core_exception?.type || ""
                          ).toUpperCase();
                          const isNoAnswer =
                            titleUpper === "NO_ANSWER" ||
                            shipmentTypeUpper === "NO_ANSWER";
                          return (
                            <NoAnswerBadge
                              shipment={task?.shipment}
                              show={isNoAnswer}
                            />
                          );
                        })()}
                      </TableCell>

                      <TableCell isFixed className="font-medium">
                        <div className="flex items-center justify-center gap-x-2">
                          {task?.shipment?.tracking_no ? (
                            <>
                              <button
                                onClick={() =>
                                  handleCopy(task?.shipment?.tracking_no)
                                }
                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                aria-label="Copy tracking number"
                              >
                                {copiedTrackingNo ===
                                task?.shipment?.tracking_no ? (
                                  <Check size={18} className="text-green-500" />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                              <span className="font-medium">
                                {task?.shipment?.tracking_no}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              {t("N/A")}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {task.shipment?.consignee?.name ?? t("N/A")}
                      </TableCell>

                      <TableCell>
                        {formatPhonePair(
                          task?.shipment?.consignee?.country_key_cellphone,
                          task?.shipment?.consignee?.cellphone,
                          task?.shipment?.consignee?.country_key_alternatePhone,
                          task?.shipment?.consignee?.alternatePhone,
                          t
                        )}
                      </TableCell>

                      <TableCell>
                        {task.shipment?.is_walkin ? (
                          <div>
                            {task.shipment?.customer_name}
                            <br />
                            {task.shipment?.customer_phone}
                          </div>
                        ) : (
                          <div>
                            {task.shipment?.merchant?.name}
                            <br />
                            {task.shipment?.merchant?.country_code}
                            {task.shipment?.merchant?.phone}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {task?.shipment?.warehouse?.name ||
                          task?.shipment?.workspace?.name ||
                          wsInfo?.value ||
                          t("N/A")}
                      </TableCell>

                      <TableCell>
                        {task?.created_at
                          ? moment(task.created_at).format("YYYY-MM-DD HH:mm")
                          : t("N/A")}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`cursor-pointer ${
                            statusColors[task.status] || ""
                          }`}
                        >
                          {t(
                            reverseStatusMapping[task?.status] ?? task?.status
                          )}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-center items-center gap-2">
                          <Button
                            onClick={() => handleEdit(task)}
                            type="button"
                            variant="edit"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            onClick={() => handleView(task)}
                            size="icon"
                            variant="show"
                          >
                            <Eye />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Pagination
              links={links}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <NoRecordFound />
        )}

        {/* Modals */}
        <View
          task={selectedTask}
          isOpen={isViewModalOpen}
          setIsOpen={setIsViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedTask(null);
          }}
        />
        <EditTask
          task={selectedTask}
          isOpen={isEditModalOpen}
          setIsOpen={setIsEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTask(null);
          }}
          onSubmitSuccess={() => handleRefresh()}
        />
      </div>
    </div>
  );
};

export default CRMTasksIndex;
