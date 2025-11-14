import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
  EditIcon,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCcw,
  Trash2Icon,
} from "lucide-react";
import Edit from "./Edit";
import Create from "./Create";
import { can, handleError, isAuthorized } from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import NoRecordFound from "@/components/NoRecordFound";
import PageTitle from "../Layouts/PageTitle";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import moment from "moment";
import { DateTimeRangePicker } from "@/components/misc/DateTimeRangePicker";

const ShelfShipmentsIndex = () => {
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [shelfShipments, setShelfShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Filter states
  const [categories, setCategories] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedShelf, setSelectedShelf] = useState("");
  const [selectedAssignedBy, setSelectedAssignedBy] = useState("");
  const today = moment().format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState({
    from: today,
    to: today,
    from_time: "00:00",
    to_time: "23:59",
  });

  // New filter states
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [selectedExceptionType, setSelectedExceptionType] = useState('');
  const [futureDateRange, setFutureDateRange] = useState({
    from: '',
    to: '',
  });

  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const accessAbility = can("Shelf access");
  const createAbility = can("Shelf create");
  const updateAbility = can("Shelf update");
  const deleteAbility = can("Shelf delete");

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

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchCategories();
    fetchShelves();
    fetchUsers();
    fetchStatuses();
  }, [shelfShipments]);

  useEffect(() => {
    fetchShelfShipments(currentPage);
    // eslint-disable-next-line
  }, [
    currentPage,
    itemsPerPage,
    selectedCategory,
    selectedShelf,
    selectedAssignedBy,
    dateRange,
    search,
    selectedStatus,
    selectedExceptionType,
    futureDateRange
  ]);

  // Filter users to only those present in shelfShipments
  useEffect(() => {
    if (!allUsers.length || !shelfShipments.length) {
      setUsers([]);
      return;
    }
    const shelfShipmentUserIds = new Set(shelfShipments.map(shipment => shipment.assigned_by?.id).filter(Boolean));
    setUsers(allUsers.filter(user => shelfShipmentUserIds.has(user.id)));
  }, [allUsers, shelfShipments]);

  const fetchCategories = async () => {
    try {
      const res = await axiosMerchant.get(`shelf-categories/all`);
      setCategories(res.data.data);
    } catch { 
      //
    }
  };
  const fetchShelves = async () => {
    try {
      const res = await axiosMerchant.get("shelves");
      setShelves(res.data.data.data);
    } catch { 
      //
    }
  };
  const fetchUsers = async () => {
    try {
      const res = await axiosMerchant.get("users/all?role=ShelfAssigner");
      setAllUsers(res.data.data);
    } catch { 
      //
    }
  };

  const fetchStatuses = async () => {
    if (shelfShipments.length > 0) {
      const uniqueExceptions = [...new Set(shelfShipments
        .map(shipment => shipment.shipment?.core_exception?.type)
        .filter(Boolean)
      )];

      const exceptionStatuses = uniqueExceptions.map(exception => ({
        value: exception,
        label: exception
      }));

      setStatuses(exceptionStatuses);
    }
  };

  const fetchShelfShipments = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const params = {
        page: pageNumber,
        per_page: itemsPerPage,
        search: search || undefined,
        category_id: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
        shelf_barcode: selectedShelf && selectedShelf !== 'all' ? selectedShelf : undefined,
        assigned_by: selectedAssignedBy && selectedAssignedBy !== 'all' ? selectedAssignedBy : undefined,
        from: `${dateRange?.from} ${dateRange?.from_time}`,
        to: `${dateRange?.to} ${dateRange?.to_time}`,
        status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
        exception_type: selectedExceptionType && selectedExceptionType !== 'all' ? selectedExceptionType : undefined,
        future_date_start: futureDateRange.from || undefined,
        future_date_end: futureDateRange.to || undefined,
      };

      const query = Object.entries(params)
        ?.filter(([, v]) => v !== undefined && v !== "")
        ?.map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
      const response = await axiosMerchant.get(`shelves/shipments?${query}`);
      setLinks(response.data.data.links);
      setShelfShipments(response.data.data.data);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  const handleRefresh = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedShelf("");
    setSelectedAssignedBy("");
    setSelectedExceptionType("");
    setDateRange({
      from: today,
      to: today,
      from_time: "00:00",
      to_time: "23:59",
    });
    setFutureDateRange({
      from: '',
      to: '',
    });
    setRefreshBtn(false);
    fetchShelfShipments();
  };


  const handleSubmitSuccess = () => {
    fetchShelfShipments(currentPage);
  };

  const [selectAll, setSelectAll] = useState(false);

  const [selectedRows, setSelectedRows] = useState([]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedTasks = shelfShipments?.map((task) => ({
      ...task,
      checked: newSelectAll,
    }));

    setShelfShipments(updatedTasks);

    const updatedSelectedRows = newSelectAll
      ? updatedTasks?.map((task) => task.tracking_no)
      : [];

    setSelectedRows(updatedSelectedRows);
  };

  const handleTaskCheckboxChange = (id) => {
    const updatedTasks = shelfShipments?.map((task) => {
      if (task.id === id) {
        return { ...task, checked: !task.checked };
      }
      return task;
    });

    setShelfShipments(updatedTasks);

    const updatedSelectedRows = updatedTasks
      ?.filter((task) => task.checked)
      ?.map((task) => task.tracking_no);

    setSelectedRows(updatedSelectedRows);
    setSelectAll(updatedTasks.every((task) => task.checked));
  };

  // Copy tracking number
  const handleCopy = async (trackingNo) => {
    await navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(trackingNo);
    setTimeout(() => setCopiedTrackingNo(null), 2000);
  };

  const createStockoutTask = async (e) => {
    e.preventDefault()
    setBtnLoading(true);
    try {
      const response = await axiosMerchant.post(`stockout_tasks/store`, {
        shipments: selectedRows,
      });
      toast.success(response.data.message)
      fetchShelfShipments()
      setLinks([]);
      setSelectedRows([])
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading(false);
    }
  }

  const canAccess = can("Shelf access")

  if (!canAccess) {
    return navigate("/unauthorized");
  }

  const handleDateRangeChange = (key, value) => setDateRange((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="flex flex-col gap-4 mt-2">
        <PageTitle title={t("Shelf Shipments")} />
        {/* Filter Card */}
        <div className="bg-white dark:bg-muted shadow-md rounded-lg p-4 flex flex-col gap-y-4">
          <div className="mb-2 flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t("Filter Shelf Shipments")}</h2>
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Search Field */}
            <div className="flex flex-col gap-1 input-container col-span-1">
              <Label htmlFor="search">{t("Search")}</Label>
              <Input
                id="search"
                type="text"
                className="w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t("e.g. PE040525590507")}
              />
            </div>
            {/* Status Filter */}
            {/* <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="status">{t("Status")}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t("Select status...")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">{t("Pending")}</SelectItem>
                  <SelectItem value="IN_TRANSIT">{t("In Transit")}</SelectItem>
                  <SelectItem value="DELIVERED">{t("Delivered")}</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            {/* Exception Type Filter */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="exceptionType">{t("Exception Type")}</Label>
              <Select value={selectedExceptionType} onValueChange={setSelectedExceptionType}>
                <SelectTrigger id="exceptionType">
                  <SelectValue placeholder={t("Select exception type...")} />
                </SelectTrigger>
                <SelectContent>
                  {shelfShipments?.length > 0 ? statuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>{t(status.label)}</SelectItem>
                  )) : [{ value: 1, label: 'No Answer' }, { value: 2, label: 'Uncorrect Number' }]?.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{t(status.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Appointment Date Range */}
            {selectedExceptionType === 'FUTURE_DELIVERY' && (
              <div className="flex flex-col gap-1 input-container md:col-span-2">
                <Label htmlFor="deliveryAppointmentRange">{t("Future Date Range")}</Label>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <Input
                    type="date"
                    id="deliveryAppointmentFrom"
                    className="w-full h-[40px]"
                    value={futureDateRange.from}
                    onChange={e => setFutureDateRange(prev => ({ ...prev, from: e.target.value }))}
                    placeholder={t("From")}
                  />
                  <span className="text-gray-500 text-center">{t("To")}</span>
                  <Input
                    type="date"
                    id="deliveryAppointmentTo"
                    className="w-full h-[40px]"
                    value={futureDateRange.to}
                    onChange={e => setFutureDateRange(prev => ({ ...prev, to: e.target.value }))}
                    placeholder={t("To")}
                  />
                </div>
              </div>
            )}
            {/* Category */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="category">{t("Category")}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t("Select category...")} />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Shelf */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="shelf">{t("Shelf")}</Label>
              <Select value={selectedShelf} onValueChange={setSelectedShelf}>
                <SelectTrigger id="shelf">
                  <SelectValue placeholder={t("Select shelf...")} />
                </SelectTrigger>
                <SelectContent>
                  {shelves?.map(shelf => (
                    <SelectItem key={shelf.barcode} value={String(shelf.barcode)}>{shelf.location || shelf.barcode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Assigned By */}
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="assignedBy">{t("Assigned By")}</Label>
              <Select value={selectedAssignedBy} onValueChange={setSelectedAssignedBy}>
                <SelectTrigger id="assignedBy">
                  <SelectValue placeholder={t("Select assigner...")} />
                </SelectTrigger>
                <SelectContent>
                  {shelfShipments?.length > 0 ? users?.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                  )) : allUsers?.map(user => (
                    <SelectItem key={user.id} value={String(user.id)}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="dateRange">{t("Assigned Date Range")}</Label>
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <DateTimeRangePicker
                  filters={{
                    from: dateRange.from,
                    to: dateRange.to,
                    from_time: dateRange.from_time,
                    to_time: dateRange.to_time,
                  }}
                  onChange={handleDateRangeChange}
                  t={t}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 input-container">
              <Label htmlFor="exceptionType">{t("Show")}</Label>
              <Select value={itemsPerPage} onValueChange={setItemsPerPage}>
                <SelectTrigger id="exceptionType">
                  <SelectValue placeholder={t("Show")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={5} value={5}>5</SelectItem>
                  <SelectItem key={8} value={8}>8</SelectItem>
                  <SelectItem key={15} value={15}>15</SelectItem>
                  <SelectItem key={25} value={25}>25</SelectItem>
                  <SelectItem key={50} value={50}>50</SelectItem>
                  <SelectItem key={100} value={100}>100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {/* End Filter Card */}
        <div className="flex flex-row gap-x-2">
          <div className="flex items-center space-x-2">
            {selectedRows.length === 0 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button type="submit" disabled>
                      {t("Create Stock Out Task")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>{t('shelfShipmentsStatusNote')}</TooltipContent>
              </Tooltip>
            ) : (
              <Button type="submit" onClick={createStockoutTask} disabled={btnLoading}>
                {btnLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("Create Stock Out Task")
                )}
              </Button>
            )}
          </div>
        </div>
      </div>


      <div className="shadow-md py-4 mt-2 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead isFixed>{t("Assigned by")}</TableHead>
              <TableHead>{t("Shelf")}</TableHead>
              <TableHead>{t("Shipment")}</TableHead>
              <TableHead>{t("Exception")}</TableHead>
              <TableHead>{t("Assigned at")}</TableHead>
              {/* <TableHead className="text-right">{t("Actions")}</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            ) : shelfShipments && shelfShipments.length > 0 ? (
              shelfShipments?.map((shelfShipment, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      id={shelfShipment.id.toString()}
                      name="shelfShipment_ids[]"
                      value={shelfShipment.id}
                      checked={selectAll || shelfShipment.checked}
                      onCheckedChange={() => handleTaskCheckboxChange(shelfShipment.id)}
                    />
                  </TableCell>
                  <TableCell isFixed>{shelfShipment.assigned_by?.name}</TableCell>
                  <TableCell>{shelfShipment.shelf?.location}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-x-2">
                      <button
                        onClick={() => handleCopy(shelfShipment.shipment?.tracking_no)}
                        className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                        aria-label="Copy tracking number"
                        disabled={!shelfShipment.shipment?.tracking_no}
                        type="button"
                      >
                        {copiedTrackingNo === shelfShipment.shipment?.tracking_no ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2} /><rect x="3" y="3" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={2} /></svg>
                        )}
                      </button>
                      <span className="font-medium">{shelfShipment.shipment?.tracking_no}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={shelfShipment.shipment?.crm_task?.status == "closed" ? "secondary" : "destructive"}>{shelfShipment.shipment?.crm_task?.status == "closed" ? shelfShipment.shipment?.status : shelfShipment.shipment?.core_exception?.type}</Badge></TableCell>

                  <TableCell>{new Date(shelfShipment.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  <NoRecordFound />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          onSubmitSuccess={handleSubmitSuccess}
          record={selectedRecord}
          onClose={closeDeleteAlert}
          api={"shelfShipments/delete"}
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

export default ShelfShipmentsIndex;
