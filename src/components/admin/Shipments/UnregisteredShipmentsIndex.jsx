// src/components/shipments/UnregisteredShipmentsIndex.jsx
import axiosMerchant from "@/axios";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Link, useNavigate, useLocation } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";

import {
  Check,
  Container,
  Copy,
  Eye,
  Filter,
  Loader2,
  Plus,
  RefreshCcw,
  User,
  Pencil,
  PhoneCall,
  Phone,
  Trash2,
} from "lucide-react";

import {
  can,
  fileDownloader,
  formatDecimalValue,
  handleError,
  hasRole,
} from "@/utils/helpers";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import ExportDialog from "@/components/misc/ExportDialog";
// import { RefreshCcw } from "lucide-react";
import { toast } from "react-toastify";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ShipmentViewNew from "./ShipmentViewNew";
import TaskEditNew from "./EditNew";
import ShipmentImportDialog from "./Dialogs/ShipmentImportDialog";
import MerchantShipmentImportDialog from "./Dialogs/MerchantShipmentImportDialog";
import { useDispatch, useSelector } from "react-redux";
import { getFacilities } from "@/stores/features/ajaxFeature";
import {
  setShipmentPage,
  clearShipmentFilters,
} from "@/stores/features/shipmentFiltersFeature";
import { useLanguage } from "@/contexts/LanguageProvider";
import ShipmentFilters from "./ShipmentFilters";
import { useFilters } from "@/contexts/ShipmentFiltersContext";
import { getHubInformationByShipmentStatus } from "@/utils/shipmentsHub";

const UnregisteredShipmentsIndex = () => {
  const { filters, setCurrentPage } = useFilters();
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [btnLoading, setBtnLoading] = useState({});
  const [links, setLinks] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [copiedPreId, setCopiedPreId] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [shipmentImportDialog, setShipmentImportDialog] = useState(false);
  const [merchantShipmentImportDialog, setMerchantShipmentImportDialog] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { language } = useLanguage();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isMerchant = hasRole("Merchant");
  const facilities = useSelector((state) => state.ajax.facilities);

  const accessAbility = can("Shipment access");
  const createAbility = can("Shipment create");
  const updateAbility = can("Shipment update");
  const deleteAbility = can("Shipment delete");
  const importAbility = can("Shipment Import access");
  const importTemplateAbility = can("Shipment Import Template access");
  const exportAbility = can("Shipment Export access");

  const openDeleteAlert = (record) => {
    if (Array.isArray(record)) {
      setselectedRecord(Array.from(record));
    } else {
      setselectedRecord(record);
    }
    setDeleteAlert(true);
  };

  const mapToOptions = (arr) =>
    arr?.map((item) => ({
      value: item.id,
      label: item.name,
      type: item.type,
    })) || [];

  const facilityGroups = useMemo(
    () => [
      { label: "Hubs", options: mapToOptions(facilities?.hubs) },
      { label: "Stations", options: mapToOptions(facilities?.stations) },
      { label: "Branches", options: mapToOptions(facilities?.branches) },
    ],
    [facilities]
  );

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const closeEditDialog = () => {
    setSelectedShipment(null);
    setEditDialogOpen(false);
  };
  const [genLoading, setGenLoading] = useState({}); // { [shipmentId]: true/false }

  const handleGenerateTracking = async (shipment) => {
    if (!shipment?.id) return;

    setGenLoading((s) => ({ ...s, [shipment.id]: true }));
    try {
      const { data } = await axiosMerchant.post(
        `shipments/${shipment.id}/generate-tracking-no`
      );
      toast.success(`Tracking generated: ${data?.data?.tracking_no || ""}`);

      // بما إن الليستة دي بتعرض unregistered بس، اول ما يبقى فيه tracking_no
      // هنشيله من الظهور بدون ما نحتاج refetch
      setShipments((prev) => prev.filter((o) => o.id !== shipment.id));
    } catch (err) {
      handleError(err);
    } finally {
      setGenLoading((s) => ({ ...s, [shipment.id]: false }));
    }
  };

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const openShipmentImport = () => setShipmentImportDialog(true);
  const closeShipmentImport = () => setShipmentImportDialog(false);
  const openMerchantShipmentImport = () => setMerchantShipmentImportDialog(true);
  const closeMerchantShipmentImport = () => setMerchantShipmentImportDialog(false);
  const toArray = (maybeArray) => (Array.isArray(maybeArray) ? maybeArray : []);

  // Only unregistered (no tracking_no)
  const filteredShipments = useMemo(
    () => toArray(shipments).filter((o) => !o?.tracking_no),
    [shipments]
  );

  const { decimalPrecision } = useSelector((state) => state.setting);
  useEffect(() => {
    // console.log("Decimal precision updated to:", decimalPrecision);
  }, [decimalPrecision]);

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }

    const fetchData = async () => {
      if (!facilities) {
        await dispatch(getFacilities());
      }

      setLoading(true);
      try {
        const params = {
          per_page: itemsPerPage,
          page: filters?.currentPage,
          is_outsourced: 0,
          // Try a backend hint if supported; harmless if ignored:
          only_unregistered: 1,
          ...(filters.status && { status: filters.status["value"] }),
          ...(filters.facility && {
            facility_id: filters.facility["value"],
            facility_type: filters.facility["type"],
          }),
          ...(filters.consignee_country && {
            consignee_country_id: filters.consignee_country["value"],
          }),
          ...(filters.consignee_gov && {
            consignee_governorate_id: filters.consignee_gov["value"],
          }),
          ...(filters.consignee_state && {
            consignee_state_id: filters.consignee_state["value"],
          }),
          ...(filters.consignee_place && {
            consignee_place_id: filters.consignee_place["value"],
          }),
          ...(filters.sender_country && {
            sender_country_id: filters.sender_country["value"],
          }),
          ...(filters.sender_gov && {
            sender_governorate_id: filters.sender_gov["value"],
          }),
          ...(filters.sender_state && {
            sender_state_id: filters.sender_state["value"],
          }),
          ...(filters.sender_place && {
            sender_place_id: filters.sender_place["value"],
          }),
          ...(filters.exception_type && {
            exception_type: filters.exception_type["value"],
          }),
          ...(filters.consignee_name !== "" && {
            consignee_name: filters.consignee_name,
          }),
          ...(filters.consignee_email !== "" && {
            consignee_email: filters.consignee_email,
          }),
          ...(filters.consignee_phone !== "" && {
            consignee_phone: filters.consignee_phone,
          }),
          ...(filters.consignee_alt_phone !== "" && {
            consignee_alt_phone: filters.consignee_alt_phone,
          }),
          ...(filters.sender_name !== "" && {
            sender_name: filters.sender_name,
          }),
          ...(filters.sender_email !== "" && {
            sender_email: filters.sender_email,
          }),
          ...(filters.sender_phone !== "" && {
            sender_phone: filters.sender_phone,
          }),
          ...(filters.sender_alt_phone !== "" && {
            sender_alt_phone: filters.sender_alt_phone,
          }),
          ...(filters.exception_from !== "" && {
            exception_from: `${filters.exception_from} ${filters.exception_from_time}`,
          }),
          ...(filters.exception_to !== "" && {
            exception_to: `${filters.exception_to} ${filters.exception_to_time}`,
          }),
          ...(filters.created_to !== "" && {
            created_to: `${filters.created_to} ${filters.created_to_time}`,
          }),
          ...(filters.created_from !== "" && {
            created_from: `${filters.created_from} ${filters.created_from_time}`,
          }),
          ...(filters.from && { from: `${filters.from} ${filters.from_time}` }),
          ...(filters.to && { created_to: `${filters.to} ${filters.to_time}` }),
          ...(filters.delivered_to && {
            delivered_to: `${filters.delivered_to} ${filters.delivered_to_time}`,
          }),
          ...(filters.delivered_from && {
            delivered_from: `${filters.delivered_from} ${filters.delivered_from_time}`,
          }),
          ...(filters.to_future && {
            to_future: `${filters.to_future} ${filters.to_time_future}`,
          }),
          ...(filters.today && { today: filters.today }),
          ...(search && { query: search }), // will be treated as pre_id search on backend if supported
        };

        const response = await axiosMerchant.get("shipments", { params });

        const list = toArray(response?.data?.data?.shipments?.data);
        const nav = toArray(response?.data?.data?.shipments?.links);
        setShipments(list);
        setLinks(nav);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemsPerPage, filters]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: filters.status?.value,
        today: filters?.todayOnly,
        query: search, // intended for pre_id
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: `${filters?.from} ${filters?.from_time}`,
        to: `${filters?.to} ${filters?.to_time}`,
        is_outsourced: 0,
        only_unregistered: 1,
      };

      const response = await axiosMerchant.get("shipments", { params });

      const list = toArray(response?.data?.data?.shipments?.data);
      const nav = toArray(response?.data?.data?.shipments?.links);
      setShipments(list);
      setLinks(nav);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.from === "/shipments/create") {
      window.history.replaceState({}, document.title);
      handleRefresh();
    }
  }, [location.state, dispatch]);

  const handleRefresh = () => {
    setSearch("");
    dispatch(clearShipmentFilters());
    setLoading(true);

    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: filters.status?.value,
        today: filters?.todayOnly ? "true" : "false",
        is_outsourced: 0,
        only_unregistered: 1,
      };

      axiosMerchant
        .get("shipments", { params })
        .then((response) => {
          const list = toArray(response?.data?.data?.shipments?.data);
          const nav = toArray(response?.data?.data?.shipments?.links);
          setShipments(list);
          setLinks(nav);
        })
        .catch(handleError)
        .finally(() => setLoading(false));
    } catch (error) {
      handleError(error);
    }
  };

  // Selection (remember we work on filteredShipments)
  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = filteredShipments.map((o) => o.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, filteredShipments]);

  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [shipments]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size > 0) {
      openDeleteAlert(Array.from(selectedRows));
    }
  }, [selectedRows]);

  const handleSubmitSuccess = () => {
    handleRefresh();
  };

  const handleCopyPreId = async (preId) => {
    if (!preId) return;
    await navigator.clipboard.writeText(preId);
    setCopiedPreId(preId);
    setTimeout(() => setCopiedPreId(null), 2000);
  };

  const handleView = (shipment) => {
    setSelectedShipment(shipment);
    setIsViewModalOpen(true);
  };

  const handleEdit = (shipment) => {
    if (shipment) {
      setSelectedShipment(shipment);
      setEditDialogOpen(true);
    }
  };

  const handleTemplateDownload = async () => {
    setBtnLoading({ donwloadImportTemplate: true });
    try {
      await fileDownloader({
        url: "shipments/import_template",
        fileName: "shipments_import_template.xlsx",
      });
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading({ donwloadImportTemplate: false });
    }
  };

  const hubInfoByIndex = useMemo(() => {
    return toArray(filteredShipments).map((shipment) =>
      getHubInformationByShipmentStatus(shipment?.status, shipment?.shipment_histories)
    );
  }, [filteredShipments]);

  const getDisplayDeliveryFee = (shipment) => {
    const base = Number(shipment?.base_delivery_fee ?? NaN);
    const fee = Number(shipment?.delivery_fee ?? NaN);
    if (!Number.isNaN(base) && base > 0) return base;
    if (!Number.isNaN(fee)) return fee;
    return null;
  };

  const renderStatusBadge = (shipment) => {
    if (shipment?.shipment_histories?.[0]?.name === "SORT_OFD") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="inbounded">Inbounded</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>
                <span className="font-semibold">Description: </span>
                {shipment?.core_status?.description || "No description available"}
              </p>
              <p>
                <span className="font-semibold">Operator: </span>
                {shipment?.core_status?.operatorInfo || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Hub: </span>
                {shipment?.core_status?.operation_hub_name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Origin Action: </span>
                {shipment?.core_status?.originActionName || "N/A"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {shipment?.core_status?.time
                  ? new Date(shipment?.core_status.time).toLocaleString()
                  : ""}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    } else if (shipment?.status === "DELIVERY_EXCEPTION") {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="exception" className="cursor-pointer">
              {shipment?.status}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium text-red-600 dark:text-red-400">
                <span className="font-semibold">Type: </span>
                {shipment?.shipment_histories?.[0]?.type ||
                  "No description available"}
              </p>
              <p className="font-medium text-red-600 dark:text-red-400">
                {shipment?.shipment_histories?.[0]?.description ||
                  "No description available"}
              </p>
              <p>
                <span className="font-semibold">Operator: </span>
                {shipment?.shipment_histories?.[0]?.operatorInfo || "N/A"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(shipment?.shipment_histories?.[0]?.time).toLocaleString()}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    } else {
      return (
        <Badge
          variant={
            shipment?.status === "CREATED"
              ? "created"
              : shipment?.status === "DELIVERED"
              ? "delivered"
              : "outline"
          }
          className="cursor-pointer"
        >
          {shipment?.status}
        </Badge>
      );
    }
  };

  return (
    <div>
      <PageTitle title={t("Unregistered Shipments")} />

      {/* Bulk actions bar (no print here) */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"}{" "}
            selected
          </div>
          <div className="flex items-center gap-2">
            {deleteAbility && (
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {t("Delete Selected")}
              </Button>
            )}
          </div>
        </div>
      )}

      <div
        className={`flex flex-col md:flex-row md:justify-between md:items-center mt-2 gap-2 space-y-4 md:space-y-0 p-4 bg-white flex-wrap dark:bg-gray-800 shadow rounded ${
          selectedRows.size > 0 ? "rounded-t-none" : ""
        }`}
      >
        <div>
          {createAbility && (
            <div className="flex justify-between md:justify-normal gap-2">
              {isMerchant ? (
                <>
                  <Link to={"/merchant/shipments/create"}>
                    <Button
                      type="button"
                      variant="outline"
                      title="Create Shipment"
                      className="flex items-center space-x-1"
                    >
                      <Plus className="size-4" />
                      <span>{t("Create Shipment")}</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={"/shipments/create-shipment"}>
                  <Button>
                    <Plus className="size-4" />
                    <span>{t("Create Shipment")}</span>
                  </Button>
                </Link>
              )}

              {!isMerchant && (
                <Link to={"/shipments/create_customer_shipment"}>
                  <Button type="button" variant="secondary">
                    <User className="size-4" />
                    <span>{t("Create Walkin")}</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <Button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            variant="outline"
            className="flex items-center gap-2 justify-between w-full md:w-auto"
          >
            <div className="flex items-center gap-2">
              <Filter className="size-4" />
              <span>{t("Filters")}</span>
              {filters?.activeFiltersCount !== 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters?.activeFiltersCount}
                </Badge>
              )}
            </div>
          </Button>

          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-full md:w-[200px]"
              value={search}
              id="search"
              placeholder={t("e.g. PRE-2025-000123")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                <RefreshCcw
                  className="size-4 cursor-pointer"
                  onClick={handleRefresh}
                />
              }
            />
          </div>

          <div className="flex justify-between gap-2">
            {!isMerchant && importAbility && (
              <Button type="button" variant="upload" onClick={openShipmentImport}>
                <RefreshCcw className="hidden" />{" "}
                {/* keeps layout same height */}
              </Button>
            )}
            {isMerchant && importAbility && (
              <Button
                type="button"
                variant="upload"
                onClick={openMerchantShipmentImport}
                title={t("Import Shipments")}
              >
                <RefreshCcw className="hidden" />
              </Button>
            )}
            {importTemplateAbility && (
              <Button
                type="button"
                variant="download"
                disabled={btnLoading.donwloadImportTemplate}
                onClick={handleTemplateDownload}
              >
                {btnLoading.donwloadImportTemplate ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Container className="size-4" />
                )}
              </Button>
            )}
            {exportAbility && (
              <Button
                type="button"
                onClick={() => setShowExport(true)}
                disabled={btnLoading.exportBtn}
                variant="export"
              >
                {btnLoading.exportBtn ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Container />
                )}
              </Button>
            )}
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="size-4" />
            </Button>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                {t("Show")}
              </label>
              <Select
                value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
                onChange={(opt) => {
                  setItemsPerPage(Number(opt.value));
                  dispatch(setShipmentPage(1));
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
      </div>

      <div className="mt-4">
        {loading ? (
          <Table
            className={`text-xs ${filteredShipments.length > 0 ? "" : "!p-2"}`}
          >
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : filteredShipments.length > 0 ? (
          <Table
            className={`text-xs ${filteredShipments.length > 0 ? "" : "!p-2"}`}
          >
            <TableHeader>
              <TableRow>
                <TableHead isFixed>
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={toggleSelectAll}
                      className="h-4 w-4"
                      aria-label="Select all shipments"
                    />
                    <span className="ml-2">{t("Pre ID")}</span>
                  </div>
                </TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead>{t("Merchant")}</TableHead>
                <TableHead>{t("Consignee")}</TableHead>
                <TableHead>{t("Address")}</TableHead>
                <TableHead>{t("Financial Details")}</TableHead>
                <TableHead>{t("Hub Info")}</TableHead>
                <TableHead>{t("Created At")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment, index) => {
                const hubInfo = hubInfoByIndex[index] ?? {
                  from: null,
                  current: null,
                  to: null,
                };
                return (
                  <TableRow key={shipment.id ?? index}>
                    <TableCell isFixed hasCheckbox className="font-medium !p-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 flex items-start gap-1">
                          <Checkbox
                            checked={selectedRows.has(shipment.id)}
                            onCheckedChange={() => toggleRowSelection(shipment.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 mt-1"
                            aria-label={`Select shipment ${shipment.pre_id}`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPreId(shipment?.pre_id);
                            }}
                            className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors mt-1"
                            aria-label="Copy pre id"
                          >
                            {copiedPreId === shipment?.pre_id ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-x-2 mb-2">
                            <span className="font-bold text-sm truncate">
                              {shipment?.pre_id || t("No Pre ID")}
                            </span>
                          </div>

                          <div className="flex gap-1.5">
                            {/* View */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(shipment);
                              }}
                              variant="show"
                              size="xs"
                              className="h-7 w-7 p-0 flex items-center justify-center"
                              title={t("View")}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Generate Tracking */}
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateTracking(shipment);
                              }}
                              variant="refresh"
                              size="xs"
                              disabled={!!genLoading[shipment.id]}
                              className="h-7 w-7 p-0 flex items-center justify-center"
                              title={t("Generate Tracking")}
                            >
                              {genLoading[shipment.id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            {/* Edit */}
                            {updateAbility && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(shipment);
                                }}
                                type="button"
                                variant="edit"
                                size="xs"
                                className="h-7 w-7 p-0 flex items-center justify-center"
                                title={t("Edit")}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Delete */}
                            {deleteAbility && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteAlert([shipment?.id]);
                                }}
                                type="button"
                                variant="delete"
                                size="xs"
                                className="h-7 w-7 p-0 flex items-center justify-center"
                                title={t("Delete")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium">
                      {renderStatusBadge(shipment)}
                    </TableCell>

                    <TableCell>
                      {shipment?.is_walkin ? (
                        <div>
                          {shipment?.customer_name} <br /> {shipment?.customer_phone}{" "}
                          <br />
                          {shipment?.merchant?.merchant?.is_guest && (
                            <Badge
                              variant={"delivered"}
                              className="cursor-pointer mt-2"
                            >
                              {t("Guest Merchant")}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div>
                          {shipment?.merchant?.name} <br />
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-center space-y-2">
                        <User className="size-4 inline-block mr-1 dark:text-gray-400 text-gray-800 fill-current" />
                        {shipment?.consignee?.name}
                        <b>
                          <PhoneCall className="size-4 inline-block mr-1 dark:text-gray-300 text-gray-800 fill-current" />
                        </b>
                        <span className="[direction:ltr]">{`${shipment?.consignee?.country_key_cellphone}${shipment?.consignee?.cellphone}`}</span>
                        {shipment?.consignee?.alternatePhone &&
                          shipment?.consignee?.country_key_alternatePhone && (
                            <>
                              <Phone className="size-4 inline-block mr-1 dark:text-gray-400 text-gray-600 stroke-[1.5]" />
                              <span className="[direction:ltr]">
                                {(shipment?.consignee
                                  ?.country_key_alternatePhone ?? "") +
                                  (shipment?.consignee?.alternatePhone ?? "")}
                              </span>
                            </>
                          )}
                      </div>
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        {shipment?.delivery_address?.governorate && (
                          <>
                            <b>{t("Governorate: ")}</b>
                            {language === "en"
                              ? shipment?.delivery_address?.governorate?.en_name
                              : shipment?.delivery_address?.governorate?.ar_name}
                          </>
                        )}
                        {shipment?.delivery_address?.state && (
                          <>
                            <b className="text-[14px] font-bold">
                              {t("State: ")}
                            </b>
                            <span className="text-[14px] font-bold">
                              {language === "en"
                                ? shipment?.delivery_address?.state?.en_name
                                : shipment?.delivery_address?.state?.ar_name}
                            </span>
                          </>
                        )}
                        {shipment?.delivery_address?.place && (
                          <>
                            <b>{t("Place: ")}</b>
                            {language === "en"
                              ? shipment?.delivery_address?.place?.en_name
                              : shipment?.delivery_address?.place?.ar_name}
                          </>
                        )}
                        {shipment?.delivery_address?.streetAddress && (
                          <>
                            <b>{t("Address")}</b>
                            {shipment?.delivery_address?.streetAddress}
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {shipment?.delivery_address?.approved ? (
                          <Badge
                            variant="success"
                            className="text-xs text-nowrap"
                          >
                            {t("Address Confirmed")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="destructive"
                            className="text-xs text-nowrap"
                          >
                            {t("Confirmation Pending")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{t("Amount")}: </span>
                        {shipment?.payment_type === "COD"
                          ? formatDecimalValue(shipment?.value, decimalPrecision)
                          : "-"}
                        <span className="font-bold">{t("Delivery Fee:")}</span>{" "}
                        {(() => {
                          const toShow = getDisplayDeliveryFee(shipment);
                          return toShow != null
                            ? formatDecimalValue(toShow, decimalPrecision)
                            : "N/A";
                        })()}
                        <span className="text-[14px] font-bold">
                          {t("Total COD:")}
                        </span>
                        <span className="text-[14px] font-bold">
                          {shipment?.fee_payer === "merchant"
                            ? formatDecimalValue(shipment?.value, decimalPrecision)
                            : formatDecimalValue(
                                shipment?.amount,
                                decimalPrecision
                              )}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {shipment?.payment_type ? (
                          <Badge
                            variant={
                              shipment?.payment_type === "COD"
                                ? "outline"
                                : "success"
                            }
                            className="ml-2"
                          >
                            {shipment?.payment_type === "COD" ? "COD" : "Paid"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-2">
                            N/A
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{t("From")}:</span>
                        <span>{hubInfo.from ?? "-"}</span>

                        <span className="font-bold">{t("Current")}:</span>
                        <span>{hubInfo.current ? hubInfo.current : "-"}</span>

                        <span className="font-bold">{t("Final")}:</span>
                        <span>{shipment?.destination_owner?.name ?? "-"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col items-center justify-center gap-1">
                        {shipment?.created_at ? (
                          <>
                            <span className="text-[11px]">
                              {new Date(shipment?.created_at).toLocaleTimeString()}
                            </span>
                            <span className="text-sm">
                              {new Date(shipment?.created_at).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}

        {/* Use server pagination as-is; list is merchant-filtered to unregistered */}
        <Pagination
          links={links}
          currentPage={filters?.currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {deleteAlert && (
        <DeleteAlert
          open={deleteAlert}
          onClose={closeDeleteAlert}
          record={
            Array.isArray(selectedRecord) ? selectedRecord : selectedRecord
          }
          api="shipments/delete"
          onSubmitSuccess={() => {
            if (Array.isArray(selectedRecord)) {
              setSelectedRows((prev) => {
                const next = new Set(prev);
                selectedRecord.forEach((id) => next.delete(id));
                return next;
              });
            }
            handleSubmitSuccess();
          }}
          multiple={Array.isArray(selectedRecord)}
        />
      )}

      <TaskEditNew
        shipment={selectedShipment}
        isOpen={editDialogOpen}
        setIsOpen={setEditDialogOpen}
        onClose={closeEditDialog}
        onSubmitSuccess={handleSubmitSuccess}
      />

      <ShipmentViewNew
        shipment={selectedShipment}
        isOpen={isViewModalOpen}
        setIsOpen={setIsViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedShipment(null);
        }}
      />

      <ShipmentFilters
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        facilityGroups={facilityGroups}
      />

      {shipmentImportDialog && (
        <ShipmentImportDialog
          open={shipmentImportDialog}
          onClose={closeShipmentImport}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {merchantShipmentImportDialog && (
        <MerchantShipmentImportDialog
          open={merchantShipmentImportDialog}
          onClose={closeMerchantShipmentImport}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}

      {showExport && (
        <ExportDialog
          model="shipments"
          endpoint="shipments/export"
          fields={[
            { key: "id", label: "ID" },
            { key: "pre_id", label: "Pre ID" }, // (⟵ changed)
            { key: "consignee.name", label: "Consignee Name" },
            { key: "consignee.cellphone", label: "Consignee Phone" },
            {
              key: "consignee.alernatePhone",
              label: "Consignee Alternate Phone",
            },
            { key: "consignee.country.name", label: "Consignee Country Name" },
            {
              key: "consignee.governorate.en_name",
              label: "Consignee Governorate Name",
            },
            { key: "consignee.state.en_name", label: "Consignee State Name" },
            {
              key: "consignee.streetAddress",
              label: "Consignee Street Address",
            },
            { key: "consignee.zipcode", label: "Consignee Zip Code" },
            { key: "amount", label: "COD" },
            { key: "payment_type", label: "Payment Type" },
            { key: "shipment_information.weight", label: "Weight" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default UnregisteredShipmentsIndex;
