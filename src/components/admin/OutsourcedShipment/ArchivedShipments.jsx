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

import { useNavigate } from "react-router-dom";
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
  PhoneCall,
  Phone,
  Trash2,
} from "lucide-react";

import {
  can,
  fileDownloader,
  handleError,
  hasRole,
  printLabel,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ShipmentViewNew from "./ShipmentViewNew";
import { useDispatch, useSelector } from "react-redux";
import { getFacilities } from "@/stores/features/ajaxFeature";
import {
  setShipmentPage,
  clearShipmentFilters,
} from "@/stores/features/shipmentFiltersFeature";
import { useLanguage } from "@/contexts/LanguageProvider";
import ShipmentFilters from "./ShipmentFilters";
import { format } from "date-fns";
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";

const ArchivedShipments = () => {
  // Remove local pagination and filter state in favor of Redux
  const {
    status,
    facility,
    page: currentPage,
    todayOnly,
    from,
    to,
    from_time,
    to_time,
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
  const [shipmentImportDialog, setShipmentImportDialog] = useState(false);
  const [merchantShipmentImportDialog, setMerchantShipmentImportDialog] = useState(false);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [pendingShipment, setPendingShipment] = useState(null);


  const { language } = useLanguage();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isMerchant = hasRole("Merchant");
  const isAdmin = hasRole("Super Admin");
  const facilities = useSelector((state) => state.ajax.facilities);

  const accessAbility = can("Outsourced Shipment access");
  const createAbility = can("Outsourced Shipment create");
  const updateAbility = can("Outsourced Shipment update");
  const deleteAbility = can("Outsourced Shipment delete");

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

  const handleRestoreClick = (shipment) => {
    setPendingShipment(shipment);
    setRestoreModalOpen(true);
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
          page: currentPage,
          status: status?.value,
          today: todayOnly,
          query: trackingNo,
          facility_id: facility?.value,
          facility_type: facility?.type,
          from: from && from_time ? `${from} ${from_time}` : null,
          to: to && to_time ? `${to} ${to_time}` : null,
        };

        const response = await axiosMerchant.get("shipment-archive", { params });

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
  }, [currentPage, status?.value, facility?.value, todayOnly,
    from,
    to,
    from_time,
    to_time,]);

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
        from: from && from_time ? `${from} ${from_time}` : null,
          to: to && to_time ? `${to} ${to_time}` : null,
      };

      const response = await axiosMerchant.get("shipment-archive", { params });

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
    if (location.state?.closeTabId) {
      // dispatch(closeTab(location.state.closeTabId));
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
        page: currentPage,
        status: status?.value,
        today: todayOnly ? "true" : "false",
        query: trackingNo,
        facility_id: facility?.value,
        facility_type: facility?.type,
        from: from && from_time ? `${from} ${from_time}` : null,
          to: to && to_time ? `${to} ${to_time}` : null,
      };

      axiosMerchant
        .get("shipment-archive", { params })
        .then((response) => {
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
        from: from && from_time ? `${from} ${from_time}` : null,
          to: to && to_time ? `${to} ${to_time}` : null,
      };

      axiosMerchant
        .get("shipment-archive", { params })
        .then((response) => {
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

  const handlePrint = async (shipment) => {
    try {
      setIsPrinting((prev) => ({ ...prev, [shipment?.id]: true }));

      const response = await axiosMerchant.get(`/shipments/printShipment`, {
        params: { tracking_no: shipment?.tracking_no },
      });

      const printResult = await printLabel(response.data.html);

      console.log("Print result:", printResult);

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

  const handleRestore = async () => {
    setLoading(true);
    try {
      const response = await axiosMerchant.post(`shipment-archive/restore`, {
        tracking_no: pendingShipment.tracking_no,
      });
      handleRefresh();
      console.log(response, "here");
    } catch (error) {
      handleError(error);
    } finally {
      setRestoreModalOpen(false);
      setPendingShipment(null);
      handleRefresh();
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
              <p>
                <span className="font-semibold">Hub: </span>
                {shipment?.shipment_histories?.[0]?.operation_hub_name || "N/A"}
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
      <PageTitle title={t("Archived Shipments")} />
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 space-y-4 md:space-y-0 p-4 bg-white dark:bg-gray-800 shadow rounded ">

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
              {(status || facility || todayOnly || from || to) && (
                <Badge variant="secondary" className="text-xs">
                  {
                    [
                      status,
                      facility,
                      todayOnly ? "today" : null,
                      from, 
                      to
                    ].filter(Boolean).length
                  }
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
          <div>
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
                <TableHead isFixed>{t("Tracking No.")}</TableHead>
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
                shipments?.map((shipment, index) => (
                  <TableRow key={index}>
                    {/* <TableHead className="w-[100px] sticky left-0">
                      {index + 1}
                    </TableHead> */}
                    <TableCell isFixed className="font-medium">
                      <div className="flex justify-center items-start gap-2">
                        <button
                          onClick={() => handleCopy(shipment?.tracking_no)}
                          className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
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
                            <span className="font-medium">
                              {shipment?.tracking_no}
                            </span>
                          </div>

                          <div className="flex gap-x-2">
                            {deleteAbility && isAdmin && (
                              <Button
                                onClick={() => openDeleteAlert(shipment)}
                                type="button"
                                variant="delete"
                                size="xs"
                              >
                                <Trash2 />
                              </Button>
                            )}
                            {deleteAbility && isAdmin && (
                              <Button
                                onClick={() => handleRestoreClick(shipment)}
                                type="button"
                                variant="outline"
                                size="xs"
                              >
                                <RefreshCcw />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleView(shipment)}
                              variant="show"
                              size="xs"
                            >
                              <Eye />
                            </Button>
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
                          {shipment?.customer_name} <br /> {shipment?.customer_phone}{" "}
                        </div>
                      ) : (
                        <div>
                          {shipment?.merchant?.name} <br />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <b>{t("Name: ")}</b>
                        {shipment?.consignee?.name}
                        <b><PhoneCall className="w-5 h-5 inline-block mr-1 dark:text-gray-300 text-gray-800 fill-current" /></b>
                        {shipment?.consignee?.cellphone}
                        <b><Phone className="w-5 h-5 inline-block mr-1 dark:text-gray-400 text-gray-600 stroke-[1.5]" /></b>
                        {shipment?.consignee?.alternatePhone}
                      </div>
                    </TableCell>
                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        {shipment?.consignee?.governorate && (
                          <>
                            <b>{t("Governorate: ")}</b>
                            {language === "en"
                              ? shipment?.consignee?.governorate?.en_name
                              : shipment?.consignee?.governorate?.ar_name}
                          </>
                        )}
                        {shipment?.consignee?.state && (
                          <>
                            <b className="text-[14px] font-bold">{t("State: ")}</b>
                            {language === "en"
                              ? <span className="text-[14px] font-bold">{shipment?.consignee?.state?.en_name}</span>
                              : <span className="text-[14px] font-bold">{shipment?.consignee?.state?.ar_name}</span>}
                          </>
                        )}
                        {shipment?.consignee?.place && (
                          <>
                            <b>{t("Place: ")}</b>
                            {language === "en"
                              ? shipment?.consignee?.place?.en_name
                              : shipment?.consignee?.place?.ar_name}
                          </>
                        )}
                      </div>
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
                    <TableCell className="!text-start">
                      <div className="grid [grid-template-columns:auto_auto] w-max mx-auto gap-x-4 items-baseline space-y-2">
                        <span className="font-bold">{t("Amount")}: </span>
                        {shipment?.payment_type === "COD" ? shipment?.value : "-"}
                        <span className="font-bold">
                          {t("Delivery Fee:")}
                        </span>{" "}
                        {shipment?.delivery_fee ? shipment?.delivery_fee : "N/A"}
                        <span className="text-[14px] font-bold">{t("Total Value:")}</span>
                        <span className="text-[14px] font-bold">{shipment?.amount}</span>
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
                    <TableCell className="!text-start">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p>
                          {shipment?.core_status?.operation_hub_name
                            ? `${t("Current Hub")}: ${shipment?.core_status?.operation_hub_name || "N/A"
                            }`
                            : "No Hub Assigned"}
                        </p>
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
                      <div className="flex flex-col items-center justify-center gap-1">
                        {shipment?.deleted_at ? (
                          <>
                            <span className="text-[11px]">
                              {t("Deleted At: ")} {new Date(shipment?.deleted_at).toLocaleTimeString()}
                            </span>
                            <span className="text-sm">
                              {new Date(shipment?.deleted_at).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <NoRecordFound />
        )}
        <Pagination
          links={links}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {
        deleteAlert && (
          <DeleteAlert
            onSubmitSuccess={handleSubmitSuccess}
            record={selectedRecord}
            onClose={closeDeleteAlert}
            api={"shipment-archive/delete"}
            title={"Permanently Delete Shipment"}
          />
        )
      }

      <ShipmentViewNew
        shipment={selectedShipment}
        isOpen={isViewModalOpen}
        setIsOpen={setIsViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedShipment(null);
        }}
        deleted={true}
      />

      <ShipmentFilters
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        onClose={() => {
          setIsFiltersOpen(false);
        }}
      />

      {/* Restoration Confirmation Modal */}
      <Modal
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
      >
        <ModalHeader>
          <ModalTitle>{t("Confirm Restore Shipment")}</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <bdi>
            {t("Are you sure you want to")} {t("restore")} {t("the shipment")}
            <b> {pendingShipment?.tracking_no}</b>
            {language === 'en' ? '?' : '؟'}
          </bdi>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setRestoreModalOpen(false)}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={handleRestore}
            disabled={loading}
          >
            {loading ? t("Restoring...") : t("Confirm")}
          </Button>
        </ModalFooter>
      </Modal>
    </div >
  );
};

export default ArchivedShipments;
