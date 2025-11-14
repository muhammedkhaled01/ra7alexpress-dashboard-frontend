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

import { Link, useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";

import {
  Check,
  Container,
  Copy,
  Download,
  Eye,
  Filter,
  Loader2,
  LucideLoader,
  Plus,
  PrinterIcon,
  RefreshCcw,
  Upload,
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
  printLabel,
} from "@/utils/helpers";

import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import ExportDialog from "@/components/misc/ExportDialog";

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

const ShipmentIndexCondensed = () => {
  // Remove local pagination and filter state in favor of Redux
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
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [individualPrinting, setIndividualPrinting] = useState({});
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [shipmentImportDialog, setShipmentImportDialog] = useState(false);
  const [merchantShipmentImportDialog, setMerchantShipmentImportDialog] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { language } = useLanguage();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isMerchant = hasRole("Merchant");
  // const isAdmin = hasRole("Super Admin");
  const facilities = useSelector((state) => state.ajax.facilities);

  const accessAbility = can("Shipment access");
  const createAbility = can("Shipment create");
  const updateAbility = can("Shipment update");
  const deleteAbility = can("Shipment delete");
  const printAbility = can("Shipment Print access");
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
      {
        label: "Hubs",
        options: mapToOptions(facilities?.hubs),
      },
      {
        label: "Stations",
        options: mapToOptions(facilities?.stations),
      },
      {
        label: "Branches",
        options: mapToOptions(facilities?.branches),
      },
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

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const openShipmentImport = () => setShipmentImportDialog(true);
  const closeShipmentImport = () => setShipmentImportDialog(false);
  const openMerchantShipmentImport = () => setMerchantShipmentImportDialog(true);
  const closeMerchantShipmentImport = () => setMerchantShipmentImportDialog(false);
  const toArray = (maybeArray) => (Array.isArray(maybeArray) ? maybeArray : []);

  const handlePrint = async (shipment) => {
    try {
      setIndividualPrinting((prev) => ({ ...prev, [shipment.id]: true }));

      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment.tracking_no },
      });

      const printResult = await printLabel(response.data.html);

      if (printResult.success && printResult.printed) {
        try {
          await axiosMerchant.post(`/shipments/printCompleted`, null, {
            params: { tracking_no: shipment.tracking_no },
          });
          console.log("Print history created for:", shipment.tracking_no);
        } catch (historyError) {
          console.error("Failed to create print history:", historyError);
        }
      }
    } catch (error) {
      console.error("Error in printing process:", error);
      handleError(error);
    } finally {
      setIndividualPrinting((prev) => ({ ...prev, [shipment.id]: false }));
    }
  };
  const { decimalPrecision } = useSelector((state) => state.setting);

  // Track decimal precision changes
  useEffect(() => {
    console.log("Decimal precision updated to:", decimalPrecision);
  }, [decimalPrecision]);
  const handleBulkPrint = async () => {
    if (selectedRows.size === 0) return;

    setIsPrinting(true);

    try {
      const selectedShipments = shipments.filter((shipment) =>
        selectedRows.has(shipment.id)
      );
      const trackingNumbers = selectedShipments.map((shipment) => shipment.tracking_no);

      // استدعاء الـ endpoint الجديد للطباعة المتعددة
      const response = await axiosMerchant.post(`/shipments/printMultipleShipments`, {
        tracking_numbers: trackingNumbers,
      });

      const printResult = await printLabel(response.data.html);

      // تسجيل تاريخ الطباعة للشحنات المطبوعة بنجاح
      if (printResult.success && printResult.printed) {
        for (const shipment of selectedShipments) {
          try {
            await axiosMerchant.post(`/shipments/printCompleted`, null, {
              params: { tracking_no: shipment.tracking_no },
            });
            console.log("Print history created for:", shipment.tracking_no);
          } catch (historyError) {
            console.error("Failed to create print history:", historyError);
          }
        }
      }
    } catch (error) {
      console.error("Error in bulk printing:", error);
      handleError(error);
    } finally {
      setIsPrinting(false);
    }
  };

  useEffect(() => {
    if (!accessAbility) {
      navigate("/unauthorized");
      return;
    }

    const fetchData = async () => {
      if (!facilities) {
        await dispatch(getFacilities());
      }

      const urlParams = new URLSearchParams(window.location.search);
      const trackingNo = urlParams.get("trackingNo");

      setLoading(true);
      try {
        const params = {
          per_page: itemsPerPage,
          query: trackingNo,
          page: filters?.currentPage,
          is_outsourced: 0,
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
          ...(filters.facility && { facility_id: filters.facility }),
          ...(filters.today && { today: filters.today }),
          ...(search && { query: search }),
        };

        const response = await axiosMerchant.get("shipments", { params });

        if (response.data.data) {
          if (response.data.data?.shipments?.data?.length === 0) {
            setShipments([]);
            setLinks([]);
          } else {
            setShipments(response.data?.data?.shipments?.data || []);
            setLinks(response.data?.data?.shipments?.links || []);
          }
        } else {
          setShipments([]);
          setLinks([]);
        }
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
    if (!search.trim()) return;
    setLoading(true);
    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: filters.status?.value,
        today: filters?.todayOnly,
        query: search,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: `${filters?.from} ${filters?.from_time}`,
        to: `${filters?.to} ${filters?.to_time}`,
        is_outsourced: 0,
      };

      const response = await axiosMerchant.get("shipments", { params });

      if (response.data.data) {
        if (response.data.data?.shipments?.data?.length === 0) {
          setShipments([]);
          setLinks([]);
        } else {
          setShipments(response.data?.data?.shipments?.data);
          setLinks(response.data?.data?.shipments?.links || []);
        }
      } else {
        setShipments([]);
        setLinks([]);
      }
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
      search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
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
    setRefreshBtn(false);
    dispatch(clearShipmentFilters());
    setExpandedShipmentId(null);
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const trackingNo = urlParams.get("trackingNo");

    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: filters.status?.value,
        today: filters?.todayOnly ? "true" : "false",
        query: trackingNo,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: `${filters?.from} ${filters?.from_time}`,
        to: `${filters?.to} ${filters?.to_time}`,
        is_outsourced: 0,
      };

      axiosMerchant
        .get("shipments", { params })
        .then((response) => {
          if (response.data.data) {
            if (response.data.data?.shipments?.data?.length === 0) {
              setShipments([]);
              setLinks([]);
            } else {
              setShipments(response.data?.data?.shipments?.data || []);
              setLinks(response.data?.data?.shipments?.links || []);
            }
          } else {
            setShipments([]);
            setLinks([]);
          }
          const list = toArray(response?.data?.data?.shipments?.data);
          const nav = toArray(response?.data?.data?.shipments?.links);
          setShipments(list);
          setLinks(nav);
        })
        .catch((error) => {
          handleError(error);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      handleError(error);
    }
  };

  // Handle row selection
  const toggleRowSelection = useCallback((id) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  // Handle select all rows
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = shipments.map((shipment) => shipment.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, shipments]);

  // Clear selection when shipments change
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [shipments]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size > 0) {
      openDeleteAlert(Array.from(selectedRows));
    }
  }, [selectedRows]);

  const handleSubmitSuccess = () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const trackingNo = urlParams.get("trackingNo");

    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: filters.status?.value,
        today: filters?.todayOnly,
        query: trackingNo,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: `${filters?.from} ${filters?.from_time}`,
        to: `${filters?.to} ${filters?.to_time}`,
        is_outsourced: 0,
      };

      axiosMerchant
        .get("shipments", { params })
        .then((response) => {
          if (response.data.data) {
            if (response.data.data?.shipments?.data?.length === 0) {
              setShipments([]);
              setLinks([]);
            } else {
              setShipments(response.data?.data?.shipments?.data || []);
              setLinks(response.data?.data?.shipments?.links || []);
            }
          } else {
            setShipments([]);
            setLinks([]);
          }
          const list = toArray(response?.data?.data?.shipments?.data);
          const nav = toArray(response?.data?.data?.shipments?.links);
          setShipments(list);
          setLinks(nav);
        })
        .catch((error) => {
          handleError(error);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      handleError(error);
    }
  };

  const handleCopy = async (trackingNo) => {
    await navigator.clipboard.writeText(trackingNo);
    setCopiedTrackingNo(trackingNo);

    setTimeout(() => {
      setCopiedTrackingNo(null);
    }, 2000);
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
    setBtnLoading({
      donwloadImportTemplate: true,
    });
    try {
      await fileDownloader({
        url: "shipments/import_template",
        fileName: "shipments_import_template.xlsx",
      });
    } catch (error) {
      handleError(error);
    } finally {
      setBtnLoading({
        donwloadImportTemplate: false,
      });
    }
  };

  const hubInfoByIndex = useMemo(() => {
    return toArray(shipments).map((shipment) =>
      getHubInformationByShipmentStatus(shipment?.status, shipment?.shipment_histories)
    );
  }, [shipments]);
  // const facilityGroups = [
  //   {
  //     label: "Hubs",
  //     options: mapToOptions(facilities?.hubs),
  //   },
  //   {
  //     label: "Stations",
  //     options: mapToOptions(facilities?.stations),
  //   },
  //   {
  //     label: "Branches",
  //     options: mapToOptions(facilities?.branches),
  //   },
  // ];
  const getDisplayDeliveryFee = (shipment) => {
    const base = Number(shipment?.base_delivery_fee ?? NaN);
    const fee = Number(shipment?.delivery_fee ?? NaN);

    if (!Number.isNaN(base) && base > 0) return base;
    if (!Number.isNaN(fee)) return fee;

    return null;
  };

  const renderStatusBadge = (shipment) => {
    if (shipment?.shipment_histories[0]?.name === "SORT_OFD") {
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
              {(() => {
                const { label, value } = getHubOrStation(
                  shipment?.shipment_histories?.[0]
                );
                return (
                  <p>
                    <span className="font-semibold">{label}: </span>
                    {value}
                  </p>
                );
              })()}
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
      <PageTitle title={t("Shipments")} />

      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"}{" "}
            selected
          </div>
          <div className="flex items-center gap-2">
            {printAbility && (
              <Button
                onClick={handleBulkPrint}
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PrinterIcon className="h-4 w-4" />
                )}
                {t("Print Selected")}
              </Button>
            )}
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
                  {/* <Link to={"/merchant/shipments/bulk-shipments-create"}>
                    <Button
                      type="button"
                      variant="default"
                      title="Bulk Create Shipment"
                      className="flex items-center space-x-1"
                    >
                      <Plus className="size-4" />
                      <span>{t("Bulk Create Shipment")}</span>
                    </Button>
                  </Link> */}
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
          {/* Filters Accordion */}
          {/* <div className="flex flex-col gap-2">
            <Collapsible className="bg-white dark:bg-gray-700 rounded-lg border">
              <CollapsibleTrigger asChild>
              </CollapsibleTrigger>
              <CollapsibleContent>
              </CollapsibleContent>
            </Collapsible>
          </div> */}

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
            {/* <ChevronDown className="size-4" /> */}
          </Button>

          <div className="flex gap-x-2">
            <Input
              name="search"
              type="text"
              className="w-full md:w-[200px]"
              value={search}
              id="search"
              placeholder={t("e.g. PE040525590507")}
              onChange={(e) => setSearch(e.target.value)}
              icon={
                refreshBtn && (
                  <RefreshCcw
                    className="size-4 cursor-pointer"
                    onClick={handleRefresh}
                  />
                )
              }
            />
          </div>
          <div className="flex justify-between gap-2">
            {!isMerchant && importAbility && (
              <Button type="button" variant="upload" onClick={openShipmentImport}>
                <Upload />
              </Button>
            )}
            {isMerchant && importAbility && (
              <Button
                type="button"
                variant="upload"
                onClick={openMerchantShipmentImport}
                title={t("Import Shipments")}
              >
                <Upload className="size-4" />
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
                  <Download className="size-4" />
                )}
              </Button>
            )}
            {exportAbility && (
              <Button
                type="button"
                onClick={(e) => setShowExport(true)}
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
                onChange={(selectedOption) => {
                  setItemsPerPage(Number(selectedOption.value));
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
            className={`text-xs ${shipments && shipments.length > 0 ? "" : "!p-2"}`}
          >
            <TableBody>
              <TableRow>
                <TableCell colSpan={11} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : shipments && shipments.length > 0 ? (
          <Table
            className={`text-xs ${shipments && shipments.length > 0 ? "" : "!p-2"}`}
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
                    <span className="ml-2">{t("Tracking No.")}</span>
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
              {shipments.length > 0 &&
                shipments?.map((shipment, index) => {
                  console.log(
                    shipment?.consignee?.alternatePhone,
                    "shipment?.consignee?.alternatePhone"
                  );
                  const hubInfo = hubInfoByIndex[index] ?? {
                    from: null,
                    current: null,
                    to: null,
                  };
                  return (
                    <TableRow key={index}>
                      {/* <TableHead className="w-[100px] sticky left-0">
                      {index + 1}
                    </TableHead> */}
                      <TableCell
                        isFixed
                        hasCheckbox
                        className="font-medium !p-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 flex items-start gap-1">
                            <Checkbox
                              checked={selectedRows.has(shipment.id)}
                              onCheckedChange={() =>
                                toggleRowSelection(shipment.id)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 mt-1"
                              aria-label={`Select shipment ${shipment.tracking_no}`}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(shipment?.tracking_no);
                              }}
                              className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors mt-1"
                              aria-label="Copy tracking number"
                            >
                              {copiedTrackingNo === shipment?.tracking_no ? (
                                <Check size={16} className="text-green-500" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-col gap-x-2 mb-2">
                              {shipment?.pre_id && shipment?.tracking_no && (
                                <Badge
                                  variant="success"
                                  className="flex flex-col items-start leading-tight"
                                >
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                    {shipment.pre_id}
                                  </span>

                                  {/* هنا ممكن تضيف أي محتوى جوه الـBadge نفسه لو محتاج */}
                                </Badge>
                              )}

                              <span className="font-bold text-sm truncate">
                                {/* لو فيه tracking_no → اعرضه */}
                                {shipment?.tracking_no
                                  ? shipment.tracking_no
                                  : shipment?.pre_id
                                  ? shipment.pre_id
                                  : t("Pending Tracking")}
                              </span>
                            </div>

                            <div className="flex gap-1.5">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(shipment);
                                }}
                                variant="show"
                                size="xs"
                                className="h-7 w-7 p-0 flex items-center justify-center"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>

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
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {printAbility && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(shipment);
                                  }}
                                  disabled={
                                    individualPrinting[shipment?.id] || isPrinting
                                  }
                                  variant="print"
                                  size="xs"
                                  className="h-7 w-7 p-0 flex items-center justify-center"
                                >
                                  {individualPrinting[shipment?.id] ? (
                                    <LucideLoader className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <PrinterIcon className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              )}

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
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {shipment?.shipment_histories[0]?.name === "SORT_OFD" ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="inbounded">Inbounded</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p>
                                  <span className="font-semibold">
                                    Description:{" "}
                                  </span>
                                  {shipment?.core_status?.description ||
                                    "No description available"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Operator:{" "}
                                  </span>
                                  {shipment?.core_status?.operatorInfo || "N/A"}
                                </p>
                                <p>
                                  <span className="font-semibold">Hub: </span>
                                  {shipment?.core_status?.operation_hub_name ||
                                    "N/A"}
                                </p>
                                <p>
                                  <span className="font-semibold">
                                    Origin Action:{" "}
                                  </span>
                                  {shipment?.core_status?.originActionName ||
                                    "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {shipment?.core_status?.time
                                    ? new Date(
                                        shipment?.core_status.time
                                      ).toLocaleString()
                                    : shipment?.core_status.time
                                    ? new Date(
                                        shipment?.core_status.time
                                      ).toLocaleString()
                                    : "_"}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : shipment?.status === "DELIVERY_EXCEPTION" ? (
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge
                                variant="exception"
                                className="cursor-pointer"
                              >
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
                                  <span className="font-semibold">
                                    Operator:{" "}
                                  </span>
                                  {shipment?.shipment_histories?.[0]?.operatorInfo ||
                                    "N/A"}
                                </p>
                                <p>
                                  <span className="font-semibold">Hub: </span>
                                  {shipment?.shipment_histories?.[0]
                                    ?.operation_hub_name || "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(
                                    shipment?.shipment_histories?.[0]?.time
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge
                            variant={
                              shipment?.status === "CREATED"
                                ? "created"
                                : shipment?.status === "DELIVERED"
                                ? "delivered"
                                : "outline"
                                ? "delivered"
                                : "outline"
                            }
                            className="cursor-pointer"
                          >
                            {shipment?.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment?.is_walkin ? (
                          <div>
                            {shipment?.customer_name} <br />{" "}
                            {shipment?.customer_phone} <br />{" "}
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
                                  {`${
                                    shipment?.consignee
                                      ?.country_key_alternatePhone ?? ""
                                  }${shipment?.consignee?.alternatePhone}`}
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
                          <span className="font-bold">
                            {t("Delivery Fee:")}
                          </span>{" "}
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
                              ? formatDecimalValue(
                                  shipment?.value,
                                  decimalPrecision
                                )
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
                      {/* <TableCell>
                      {shipment?.shipment_delivery?.status?.replace(/_/g, " ") ||
                        "N/A"}
                    </TableCell> */}
                      {/* <TableCell className="!text-start">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p>
                          {shipment?.core_status?.operation_hub_name
                            ? `${t("Current Hub")}: ${shipment?.core_status?.operation_hub_name || "N/A"
                            }`
                            ? `${t("Current Hub")}: ${shipment?.core_status?.operation_hub_name || "N/A"
                            }`
                            : "No Hub Assigned"}
                        </p>
                      </div>
                    </TableCell> */}

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
                                {new Date(
                                  shipment?.created_at
                                ).toLocaleTimeString()}
                              </span>
                              <span className="text-sm">
                                {new Date(
                                  shipment?.created_at
                                ).toLocaleDateString()}
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
                const newSelection = new Set(prev);
                selectedRecord.forEach((id) => newSelection.delete(id));
                return newSelection;
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
        onClose={() => {
          setIsFiltersOpen(false);
        }}
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
            { key: "tracking_no", label: "Tracking No" },
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
            // { key: "shipper.name", label: "Shipper Name" },
            // { key: "shipper.country.name", label: "Shipper Country Name" },
            // { key: "shipper.governorate.en_name", label: "Shipper Governorate Name" },
            // { key: "shipper.state.en_name", label: "Shipper State Name" },
            { key: "created_at", label: "Created At" },
            { key: "updated_at", label: "Updated At" },
          ]}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};

export default ShipmentIndexCondensed;
