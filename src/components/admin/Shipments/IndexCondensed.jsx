import axiosMerchant from "@/axios";
import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import NoRecordFound from "../../NoRecordFound";
import Select from "@/components/misc/Select";

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

import {
  Check,
  Container,
  Copy,
  Download,
  Edit,
  Eye,
  Filter,
  Loader2,
  LucideLoader,
  Plus,
  PrinterIcon,
  RefreshCcw,
  Upload,
  User,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Pencil,
} from "lucide-react";

import {
  can,
  fileDownloader,
  handleError,
  hasRole,
  printLabel,
  printShipmentLabel,
  statusOptions,
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
import { closeTab } from "@/stores/features/tabsFeature";
import { useDispatch, useSelector } from "react-redux";
import { getFacilities } from "@/stores/features/ajaxFeature";
import { setShipmentFilters, setShipmentPage, clearShipmentFilters } from "@/stores/features/shipmentFiltersFeature";
import { useLanguage } from "@/contexts/LanguageProvider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ShipmentFilters from "./ShipmentFilters";
import { format } from 'date-fns';

const ShipmentIndexCondensed = () => {
  // Remove local pagination and filter state in favor of Redux
  const {
    status,
    facility,
    page: currentPage,
    todayOnly,
    dateFilter
  } = useSelector((state) => state.shipmentFilters);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState({});
  const [links, setLinks] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [refreshBtn, setRefreshBtn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [shipmentImportDialog, setShipmentImportDialog] = useState(false);
  const [merchantShipmentImportDialog, setMerchantShipmentImportDialog] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);

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

  const toggleRowExpansion = (shipmentId) => {
    setExpandedShipmentId(expandedShipmentId === shipmentId ? null : shipmentId);
  };

  const openDeleteAlert = (record) => {
    setselectedRecord(record);
    setDeleteAlert(true);
  };

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const closeEditDialog = () => {
    setSelectedShipment(null);
    setEditDialogOpen(false);
  };

  const handlePageChange = (pageNumber) => {
    dispatch(setShipmentPage(pageNumber));
  };

  const openShipmentImport = () => setShipmentImportDialog(true);
  const closeShipmentImport = () => setShipmentImportDialog(false);
  const openMerchantShipmentImport = () => setMerchantShipmentImportDialog(true);
  const closeMerchantShipmentImport = () => setMerchantShipmentImportDialog(false);

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
          page: currentPage,
          status: status?.value,
          today: todayOnly,
          query: trackingNo,
          facility_id: facility?.value,
          facility_type: facility?.type,
          date: dateFilter ? format(dateFilter, 'yyyy-MM-dd') : null
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
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, status?.value, facility?.value, todayOnly, dateFilter]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        status: status?.value,
        today: todayOnly,
        query: search,
        facility_id: facility?.value,
        facility_type: facility?.type,
        date: dateFilter ? format(dateFilter, 'yyyy-MM-dd') : null
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
      if (location.state?.name) {
        dispatch(closeTab("tab-/shipments/create"))
      }
      handleRefresh();
    }
  }, [location]);

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
        page: currentPage,
        status: status?.value,
        today: todayOnly ? 'true' : 'false',
        query: trackingNo,
        facility_id: facility?.value,
        facility_type: facility?.type,
        date: dateFilter ? format(dateFilter, 'yyyy-MM-dd') : null
      };

      axiosMerchant.get("shipments", { params }).then((response) => {
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
      }).catch((error) => {
        handleError(error);
      }).finally(() => {
        setLoading(false);
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handleSubmitSuccess = () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const trackingNo = urlParams.get("trackingNo");

    try {
      const params = {
        page: currentPage,
        status: status?.value,
        today: todayOnly,
        query: trackingNo,
        facility_id: facility?.value,
        facility_type: facility?.type,
        date: dateFilter ? format(dateFilter, 'yyyy-MM-dd') : null
      };

      axiosMerchant.get("shipments", { params }).then((response) => {
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
      }).catch((error) => {
        handleError(error);
      }).finally(() => {
        setLoading(false);
      });
    } catch (error) {
      handleError(error);
    }
  };

  const handlePrint = async (shipment) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shipment?.id]: true }));

      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment?.tracking_no },
      });

      const printResult = await printLabel(response.data.html);

      console.log("Print result:", printResult);

      // This condition is CORRECT - only create history on successful print
      if (printResult.success && printResult.printed) {
        try {
          await axiosMerchant.post(`/shipments/printCompleted`, null, {
            params: { tracking_no: shipment?.tracking_no },
          });
          console.log("Print history created");
        } catch (historyError) {
          console.error("Failed to create print history:", historyError);
        }
      } else {
        console.log("Print cancelled/failed - no history created");
      }

      setIsPrinting((prev) => ({ ...prev, [shipment?.id]: false }));
    } catch (error) {
      setIsPrinting((prev) => ({ ...prev, [shipment?.id]: false }));
      console.error("Error in printing process:", error);
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

  const mapToOptions = (arr) =>
    arr?.map((item) => ({
      value: item.id,
      label: item.name,
      type: item.type, // Include the type information
    })) || [];

  const facilityGroups = [
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
  ];

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
                {shipment?.core_status?.originActionName || "N/A"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {shipment?.core_status?.time
                  ? new Date(
                    shipment?.core_status.time
                  ).toLocaleString()
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0 p-4 bg-white dark:bg-gray-800 shadow rounded ">
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
                      <Plus className="w-4 h-4" />
                      <span>{t("Create Shipment")}</span>
                    </Button>
                  </Link>
                  <Link to={"/merchant/shipments/bulk-shipments-create"}>
                    <Button
                      type="button"
                      variant="default"
                      title="Bulk Create Shipment"
                      className="flex items-center space-x-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t("Bulk Create Shipment")}</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to={"/shipments/create"}>
                  <Button>
                    <Plus className="w-4 h-4" />
                    <span>{t("Create Shipment")}</span>
                  </Button>
                </Link>
              )}

              {!isMerchant && (
                <Link to={"/shipments/create_customer_shipment"}>
                  <Button type="button" variant="secondary">
                    <User className="w-4 h-4" />
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
              <Filter className="w-4 h-4" />
              <span>{t("Filters")}</span>
              {(status || facility || todayOnly || dateFilter) && (
                <Badge variant="secondary" className="text-xs">
                  {[status, facility, todayOnly ? 'today' : null, dateFilter ? 'date' : null].filter(Boolean).length}
                </Badge>
              )}
            </div>
            {/* <ChevronDown className="w-4 h-4" /> */}
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
                    className="w-4 h-4 cursor-pointer"
                    onClick={handleRefresh}
                  />
                )
              }
            />
          </div>
          <div className="flex justify-between gap-2">
            {!isMerchant && (
              <Button type="button" variant="upload" onClick={openShipmentImport}>
                <Upload />
              </Button>
            )}
            {isMerchant && (
              <Button
                type="button"
                variant="upload"
                onClick={openMerchantShipmentImport}
                title={t("Import Shipments")}
              >
                <Upload className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="download"
              disabled={btnLoading.donwloadImportTemplate}
              onClick={handleTemplateDownload}
            >
              {btnLoading.donwloadImportTemplate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              onClick={(e) => setShowExport(true)}
              disabled={btnLoading.exportBtn} variant="export"
            >
              {btnLoading.exportBtn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Container />
              )}
            </Button>
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
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
                <TableCell colSpan={6} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : shipments && shipments.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table
                className={`text-xs ${shipments && shipments.length > 0 ? "" : "!p-2"}`}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead isFixed>{t("Tracking No.")}</TableHead>
                    <TableHead>{t("Status")}</TableHead>
                    <TableHead>{t("Consignee")}</TableHead>
                    <TableHead>{t("Address")}</TableHead>
                    <TableHead>{t("Amount")}</TableHead>
                    <TableHead>{t("Created At")}</TableHead>
                    <TableHead>{t("Financial Details")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length > 0 &&
                    shipments?.map((shipment, index) => (
                      <React.Fragment key={index}>
                        <TableRow
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => toggleRowExpansion(shipment.id)}
                        >
                          <TableCell isFixed className="font-semibold">
                            <div className="flex justify-start items-start gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(shipment?.tracking_no);
                                }}
                                className="text-gray-500 hover:text-gray-900 hover:dark:text-black-100 font-semibold transition-colors"
                                aria-label="Copy tracking number"
                              >
                                {copiedTrackingNo === shipment?.tracking_no ? (
                                  <Check size={18} className="text-green-500" />
                                ) : (
                                  <Copy size={18} />
                                )}
                              </button>
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-x-2 mb-3">
                                  <span className="font-bold">
                                    {shipment?.tracking_no}
                                  </span>
                                  {expandedShipmentId === shipment.id ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    language === 'en' ? (
                                      <ChevronRight className="h-4 w-4" />
                                    ) : (
                                      <ChevronLeft className="h-4 w-4" />
                                    )
                                  )}
                                </div>

                                <div className="flex gap-x-2">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrint(shipment);
                                    }}
                                    disabled={isPrinting[shipment?.id]}
                                    variant="print"
                                    size="xs"
                                    className="font-semibold"
                                  >
                                    {isPrinting[shipment?.id] ? (
                                      <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                                    ) : (
                                      <PrinterIcon />
                                    )}
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleView(shipment);
                                    }}
                                    variant="show"
                                    size="xs"
                                    className="font-semibold"
                                  >
                                    <Eye />
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
                                      className="font-semibold"
                                    >
                                      <Pencil />
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
                            <div className="font-bold">{shipment?.consignee?.name}</div>
                            <div className="text-sm text-gray-500">{shipment?.consignee?.cellphone}</div>
                          </TableCell>
                          <TableCell>
                            {shipment?.consignee?.governorate && (
                              <div className="flex gap-2 justify-center items-center">
                                <b>{t("Governorate: ")}</b>
                                {language === 'en' ? shipment?.consignee?.governorate?.en_name : shipment?.consignee?.governorate?.ar_name}
                                <br />
                              </div>
                            )}
                            {shipment?.consignee?.state && (
                              <div className="flex gap-2 justify-center items-center">
                                <b>{t("State: ")}</b>
                                {language === 'en' ? shipment?.consignee?.state?.en_name : shipment?.consignee?.state?.ar_name}
                                <br />
                              </div>
                            )}
                            {shipment?.consignee?.place && (
                              <div className="flex gap-2 justify-center items-center">
                                <b>{t("Place: ")}</b>
                                {language === 'en' ? shipment?.consignee?.place?.en_name : shipment?.consignee?.place?.ar_name}
                                <br />
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-2 mt-2">
                              {shipment?.consignee?.old_address ? (
                                <Badge variant="outline" className="text-xs">
                                  {t("Address Changed")}
                                </Badge>
                              ) : shipment?.consignee?.address_confirmed ? (
                                <Badge variant="success" className="text-xs">
                                  {t("Address Confirmed")}
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  {t("Confirmation Pending")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {shipment?.payment_type === "COD" ? shipment?.amount : "Paid"}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-[14px]">{t("Created At")}</h4>
                              <div className="text-sm">
                                <p><span className="font-bold">{t("Date:")}</span> {shipment?.created_at
                                  ? new Date(shipment?.created_at).toLocaleString()
                                  : "N/A"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <h4 className="font-semibold text-[14px]">{t("Financial Details")}</h4>
                              <div className="space-y-1">
                                <p><span className="font-bold">{t("Amount:")}</span> {shipment?.payment_type === "COD" ? shipment?.amount : "Paid"}</p>
                                <p><span className="font-bold">{t("Delivery Fee:")}</span> {shipment?.delivery_fee ? shipment?.delivery_fee : "N/A"}</p>
                                {/* <p><span className="font-bold">{t("Value :")}</span> {shipment?.value ? shipment?.value : "N/A"}</p> */}
                                <p><span className="font-bold">{t("Payment Status:")}</span>
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
                                    <Badge variant="destructive" className="ml-2">N/A</Badge>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          {/* <TableCell>
                            <div className="flex gap-x-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrint(shipment);
                                }}
                                disabled={isPrinting[shipment?.id]}
                                variant="print"
                                size="xs"
                              >
                                {isPrinting[shipment?.id] ? (
                                  <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                                ) : (
                                  <PrinterIcon />
                                )}
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(shipment);
                                }}
                                variant="show"
                                size="xs"
                              >
                                <Eye />
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
                                >
                                  <Edit />
                                </Button>
                              )}
                            </div>
                          </TableCell> */}
                        </TableRow>

                        {/* Expanded Details Row */}
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <Collapsible
                              open={expandedShipmentId === shipment.id}
                              onOpenChange={() => toggleRowExpansion(shipment.id)}
                            >
                              <CollapsibleContent>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t text-[13px]">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Consignee Details */}
                                    <div className="space-y-2 flex flex-col items-center justify-center gap-2">
                                      <h4 className="font-semibold text-[14px]">{t("Consignee Details")}</h4>
                                      <div className="space-y-1">
                                        <p><span className="font-bold">{t("Name:")}</span> {shipment?.consignee?.name}</p>
                                        <p className="flex gap-2 justify-center gap-2 items-center"><span className="font-bold">{t("Cell Phone:")}</span> {shipment?.consignee?.cellphone}</p>
                                        <p className="flex gap-2 justify-center gap-2 items-center"><span className="font-bold">{t("Alternative Cell Phone:")}</span> {shipment?.consignee?.alternatePhone}</p>
                                      </div>
                                    </div>

                                    {/* Delivery Details */}
                                    <div className="space-y-2 col-span-2">
                                      <h4 className="font-semibold text-[14px]">{t("Delivery Details")}</h4>
                                      <div className="space-y-1 flex flex-col items-center justify-center gap-2">
                                        <p className="flex gap-2 justify-center gap-2 items-center"><span className="font-bold">{t("Delivery Status:")}</span> {shipment?.shipment_delivery?.status?.replace(/_/g, " ") || "N/A"}</p>
                                        <p className="flex gap-2 justify-center gap-2 items-center"><span className="font-bold">{t("Current Hub:")}</span> {shipment?.core_status?.operation_hub_name || "No Hub Assigned"}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {shipments.map((shipment, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow border">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => toggleRowExpansion(shipment.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(shipment?.tracking_no);
                          }}
                          className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                          aria-label="Copy tracking number"
                        >
                          {copiedTrackingNo === shipment?.tracking_no ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <span className="font-medium text-sm">{shipment?.tracking_no}</span>
                        {expandedShipmentId === shipment.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          language === 'en' ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronLeft className="h-4 w-4" />
                          )
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(shipment);
                          }}
                          disabled={isPrinting[shipment?.id]}
                          variant="print"
                          size="xs"
                        >
                          {isPrinting[shipment?.id] ? (
                            <LucideLoader className="h-3 w-3 animate-spin" />
                          ) : (
                            <PrinterIcon className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(shipment);
                          }}
                          variant="show"
                          size="xs"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {updateAbility && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(shipment);
                            }}
                            variant="edit"
                            size="xs"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-1">{shipment?.consignee?.name}</div>
                        <div className="text-xs text-gray-500">{shipment?.consignee?.cellphone}</div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          {renderStatusBadge(shipment)}
                        </div>
                        <div className="text-sm font-medium">
                          {shipment?.payment_type === "COD" ? shipment?.amount : "Paid"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Expanded Details */}
                  <Collapsible
                    open={expandedShipmentId === shipment.id}
                    onOpenChange={() => toggleRowExpansion(shipment.id)}
                  >
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 text-[13px]">
                        <div className="space-y-4 pt-3">
                          <div>
                            <h4 className="font-semibold text-sm mb-2">{t("Consignee Details")}</h4>
                            <div className="text-sm space-y-1">
                              <p><span className="font-bold">{t("Name:")}</span> {shipment?.consignee?.name}</p>
                              <p><span className="font-bold">{t("Cell Phone:")}</span> {shipment?.consignee?.cellphone}</p>
                              <p><span className="font-bold">{t("Alternative Cell Phone:")}</span> {shipment?.consignee?.alternatePhone}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-2">{t("Address Details")}</h4>
                            <div className="text-sm space-y-1">
                              {shipment?.consignee?.governorate && (
                                <p><span className="font-bold">{t("Governorate:")}</span> {language === 'en' ? shipment?.consignee?.governorate?.en_name : shipment?.consignee?.governorate?.ar_name}</p>
                              )}
                              {shipment?.consignee?.state && (
                                <p><span className="font-bold">{t("State:")}</span> {language === 'en' ? shipment?.consignee?.state?.en_name : shipment?.consignee?.state?.ar_name}</p>
                              )}
                              {shipment?.consignee?.place && (
                                <p><span className="font-bold">{t("Place:")}</span> {language === 'en' ? shipment?.consignee?.place?.en_name : shipment?.consignee?.place?.ar_name}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {shipment?.consignee?.old_address ? (
                                  <Badge variant="outline" className="text-xs">
                                    {t("Address Changed")}
                                  </Badge>
                                ) : shipment?.consignee?.address_confirmed ? (
                                  <Badge variant="success" className="text-xs">
                                    {t("Address Confirmed")}
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">
                                    {t("Confirmation Pending")}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-sm space-y-1">
                              <p><span className="font-bold">{t("Amount:")}</span> {shipment?.payment_type === "COD" ? shipment?.amount : "Paid"}</p>
                              <p><span className="font-bold">{t("Delivery Fee:")}</span> {shipment?.delivery_fee ? shipment?.delivery_fee : "N/A"}</p>
                              <p><span className="font-bold">{t("Value:")}</span> {shipment?.value ? shipment?.value : "N/A"}</p>
                              <p><span className="font-bold">{t("Payment Status:")}</span>
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
                                  <Badge variant="destructive" className="ml-2">N/A</Badge>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Delivery Details */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">{t("Delivery Details")}</h4>
                            <div className="text-sm space-y-1">
                              <p><span className="font-bold">{t("Delivery Status:")}</span> {shipment?.shipment_delivery?.status?.replace(/_/g, " ") || "N/A"}</p>
                              <p><span className="font-bold">{t("Current Hub:")}</span> {shipment?.core_status?.operation_hub_name || "No Hub Assigned"}</p>
                            </div>
                          </div>

                          {/* Shipment History */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">{t("Shipment History")}</h4>
                            <div className="text-sm space-y-1">
                              {shipment?.shipment_histories?.length > 0 ? (
                                shipment?.shipment_histories
                                  .slice(0, 3)
                                  .map((history, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2"
                                    >
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                          backgroundColor:
                                            idx === 0
                                              ? "#4CAF50"
                                              : idx === 1
                                                ? "#2196F3"
                                                : "#9E9E9E",
                                        }}
                                      ></div>
                                      <span className="text-sm">
                                        {history.name || "N/A"} -{" "}
                                        {history.time
                                          ? new Date(history.time).toLocaleString()
                                          : "N/A"}
                                      </span>
                                    </div>
                                  ))
                              ) : (
                                <span className="text-gray-500">
                                  {t("No History Available")}
                                </span>
                              )}
                              {shipment?.shipment_histories?.length > 3 && (
                                <Button
                                  variant="link"
                                  size="xs"
                                  onClick={() => handleView(shipment)}
                                  className="p-0 h-auto"
                                >
                                  {t("View All History")}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Created At */}
                          <div>
                            <h4 className="font-semibold text-sm mb-2">{t("Created At")}</h4>
                            <div className="text-sm">
                              <p><span className="font-bold">{t("Date:")}</span> {shipment?.created_at
                                ? new Date(shipment?.created_at).toLocaleString()
                                : "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoRecordFound />
        )}
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
          api={"shipments/delete"}
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
