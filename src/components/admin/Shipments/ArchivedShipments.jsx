import axiosMerchant from "@/axios";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../ui/button";
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

import { useNavigate } from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";

import {
  Check,
  Container,
  Download,
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
  Copy,
  Eye,
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
import { Modal, ModalContent, ModalFooter, ModalHeader, ModalTitle } from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { useFilters } from "@/contexts/ShipmentFiltersContext";

const ArchivedShipments = () => {
  const { filters, setCurrentPage } = useFilters()
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
  const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
  const [selectedRecord, setselectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [expandedShipmentId, setExpandedShipmentId] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [pendingShipment, setPendingShipment] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);


  const { language } = useLanguage();

  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const isAdmin = hasRole("Super Admin");
  const facilities = useSelector((state) => state.ajax.facilities);

  const accessAbility = can(" Archived Shipment access");
  const restoreAbility = can(" Archived Shipment restore");
  const deleteAbility = can("Archived Shipment delete");

  const { decimalPrecision } = useSelector((state) => state.setting);
  useEffect(() => {
    console.log('Decimal precision updated to:', decimalPrecision);
  }, [decimalPrecision]);
  const openDeleteAlert = (record) => {
    if (Array.isArray(record)) {
      setselectedRecord(Array.from(record));
    } else {
      setselectedRecord(record);
    }
    setDeleteAlert(true);
  };

  const toggleRowSelection = useCallback((id) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = shipments.map(shipment => shipment.id);
      setSelectedRows(new Set(allIds));
    }
    setSelectAll(!selectAll);
  }, [selectAll, shipments]);
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [shipments]);

  const handleBulkDelete = useCallback(() => {
    if (selectedRows.size > 0) {
      openDeleteAlert(Array.from(selectedRows));
    }
  }, [selectedRows]);

  const closeDeleteAlert = () => {
    setselectedRecord(null);
    setDeleteAlert(false);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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
          per_page: itemsPerPage,
          query: trackingNo,
          page: filters?.currentPage,
          is_outsourced: 0,
          ...(filters.status && { status: filters.status['value'] }),
          ...(filters.facility && {
            facility_id: filters.facility['value'],
            facility_type: filters.facility['type']
          }),
          ...(filters.consignee_country && { consignee_country_id: filters.consignee_country['value'] }),
          ...(filters.consignee_gov && { consignee_governorate_id: filters.consignee_gov['value'] }),
          ...(filters.consignee_state && { consignee_state_id: filters.consignee_state['value'] }),
          ...(filters.consignee_place && { consignee_place_id: filters.consignee_place['value'] }),
          ...(filters.sender_country && { sender_country_id: filters.sender_country['value'] }),
          ...(filters.sender_gov && { sender_governorate_id: filters.sender_gov['value'] }),
          ...(filters.sender_state && { sender_state_id: filters.sender_state['value'] }),
          ...(filters.sender_place && { sender_place_id: filters.sender_place['value'] }),
          ...(filters.exception_type && { exception_type: filters.exception_type['value'] }),
          ...(filters.consignee_name !== "" && { consignee_name: filters.consignee_name }),
          ...(filters.consignee_email !== "" && { consignee_email: filters.consignee_email }),
          ...(filters.consignee_phone !== "" && { consignee_phone: filters.consignee_phone }),
          ...(filters.consignee_alt_phone !== "" && { consignee_alt_phone: filters.consignee_alt_phone }),
          ...(filters.sender_name !== "" && { sender_name: filters.sender_name }),
          ...(filters.sender_email !== "" && { sender_email: filters.sender_email }),
          ...(filters.sender_phone !== "" && { sender_phone: filters.sender_phone }),
          ...(filters.sender_alt_phone !== "" && { sender_alt_phone: filters.sender_alt_phone }),
          ...(filters.exception_from !== "" && { exception_from: `${filters.exception_from} ${filters.exception_from_time}` }),
          ...(filters.exception_to !== "" && { exception_to: `${filters.exception_to} ${filters.exception_to_time}` }),
          ...(filters.created_to !== "" && { created_to: `${filters.created_to} ${filters.created_to_time}` }),
          ...(filters.created_from !== "" && { created_from: `${filters.created_from} ${filters.created_from_time}` }),
          ...(filters.from && { from: `${filters.from} ${filters.from_time}` }),
          ...(filters.to && { created_to: `${filters.to} ${filters.to_time}` }),
          ...(filters.delivered_to && { delivered_to: `${filters.delivered_to} ${filters.delivered_to_time}` }),
          ...(filters.delivered_from && { delivered_from: `${filters.delivered_from} ${filters.delivered_from_time}` }),
          ...(filters.to_future && { to_future: `${filters.to_future} ${filters.to_time_future}` }),
          ...(filters.facility && { facility_id: filters.facility }),
          ...(filters.today && { today: filters.today }),
          ...(search && { query: search }),
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
  },
    [
      itemsPerPage,
      status?.value,
      filters,
    ]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const params = {
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: status?.value,
        today: filters?.todayOnly,
        query: search,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: filters?.from && filters?.from_time ? `${filters?.from} ${filters?.from_time}` : null,
        to: filters?.to && filters?.to_time ? `${filters?.to} ${filters?.to_time}` : null,
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
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: status?.value,
        today: filters?.todayOnly ? "true" : "false",
        query: trackingNo,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: filters?.from && filters?.from_time ? `${filters?.from} ${filters?.from_time}` : null,
        to: filters?.to && filters?.to_time ? `${filters?.to} ${filters?.to_time}` : null,
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
        page: filters?.currentPage,
        per_page: itemsPerPage,
        status: status?.value,
        today: filters?.todayOnly,
        query: trackingNo,
        facility_id: filters?.facility?.value,
        facility_type: filters?.facility?.type,
        from: filters?.from && filters?.from_time ? `${filters?.from} ${filters?.from_time}` : null,
        to: filters?.to && filters?.to_time ? `${filters?.to} ${filters?.to_time}` : null,
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

  const handleRestore = async (shipment = null) => {
    setLoading(true);
    try {
      if (shipment) {
        // Single shipment restore
        await axiosMerchant.post(`shipment-archive/restore`, {
          tracking_numbers: [shipment.tracking_no],
        });
      } else if (selectedRows.size > 0) {
        // Bulk restore
        const selectedShipments = shipments.filter(shipment => selectedRows.has(shipment.id));
        await axiosMerchant.post(`shipment-archive/restore`, {
          tracking_numbers: selectedShipments.map(shipment => shipment.tracking_no),
        });
        setSelectedRows(new Set());
        setSelectAll(false);
      }
      handleRefresh();
    } catch (error) {
      handleError(error);
    } finally {
      setRestoreModalOpen(false);
      setPendingShipment(null);
    }
  };

  const handleBulkRestore = useCallback(() => {
    if (selectedRows.size > 0) {
      setRestoreModalOpen(true);
    }
  }, [selectedRows]);

  return (
    <div>
      <PageTitle title={t("Archived Shipments")} />
      {/* Bulk actions bar */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-700 dark:text-blue-200">
            {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBulkRestore}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <RefreshCcw className="h-4 w-4 animate-pulse" />
              <span className="font-semibold">{t("Restore Selected")}</span>
            </Button>
            {(deleteAbility &&
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

      <div className={`flex flex-col md:flex-row md:justify-between md:items-center mt-2 gap-2 space-y-4 md:space-y-0 p-4 bg-white flex-wrap dark:bg-gray-800 shadow rounded ${selectedRows.size > 0 ? 'rounded-t-none' : ''}`}>
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
              {filters?.activeFiltersCount !== 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filters?.activeFiltersCount}
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
          <div className="flex items-center gap-2">
            <Button type="button" variant="refresh" onClick={handleRefresh}>
              <RefreshCcw className="w-4 h-4" />
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
                  { value: 5, label: '5' },
                  { value: 8, label: '8' },
                  { value: 15, label: '15' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' }
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
                shipments?.map((shipment, index) => (
                  <TableRow key={index}>
                    {/* <TableHead className="w-[100px] sticky left-0">
                      {index + 1}
                    </TableHead> */}
                    <TableCell isFixed hasCheckbox className="font-medium !p-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 flex items-start gap-1">
                          <Checkbox
                            checked={selectedRows.has(shipment.id)}
                            onCheckedChange={() => toggleRowSelection(shipment.id)}
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
                          <div className="flex items-center gap-x-2 mb-2">
                            <span className="font-bold text-sm truncate">
                              {shipment?.tracking_no}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
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

                            {deleteAbility && isAdmin && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestoreClick(shipment);
                                }}
                                type="button"
                                variant="outline"
                                size="xs"
                                className="h-7 w-7 p-0 flex items-center justify-center"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {deleteAbility && isAdmin && (
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
                        <span className="text-[14px] font-bold">
                          {shipment?.fee_payer === "merchant" ? formatDecimalValue(shipment?.value, decimalPrecision) : "-"}
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
          currentPage={filters?.currentPage}
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
            multiple={Array.isArray(selectedRecord)}
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
          <ModalTitle>
            {pendingShipment
              ? t("Confirm Restore Shipment")
              : t("Confirm Restore Shipments")}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          <bdi>
            {pendingShipment ? (
              <>
                {t("Are you sure you want to restore the shipment")}
                <b> {pendingShipment.tracking_no}</b>
                {language === 'en' ? '?' : '؟'}
              </>
            ) : (
              <>
                {t("Are you sure you want to restore")}
                <b> {selectedRows.size} </b>
                {selectedRows.size === 1 ? t("shipment") : t("shipments")}
                {language === 'en' ? '?' : '؟'}
              </>
            )}
          </bdi>
        </ModalContent>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setRestoreModalOpen(false)}
            disabled={loading}
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={() => handleRestore(pendingShipment || null)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("Restoring...")}
              </>
            ) : (
              t("Confirm")
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div >
  );
};

export default ArchivedShipments;
