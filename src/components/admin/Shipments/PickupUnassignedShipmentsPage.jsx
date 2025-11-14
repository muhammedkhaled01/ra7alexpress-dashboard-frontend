import axiosMerchant from "@/axios";
import { useEffect, useState, useCallback } from "react";
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
    Download,
    Filter,
    Loader2,
    PrinterIcon,
    RefreshCcw,
    Upload,
    Trash2, Plus, Eye,
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
import { Badge } from "@/components/ui/badge";
import ExportDialog from "@/components/misc/ExportDialog";

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
import { format } from "date-fns";
import { useFilters } from "@/contexts/ShipmentFiltersContext";

const PickupUnassignedShipmentsPage = () => {
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

    const apiBase = "shipments/pickup-unassigned";

    const navigate = useNavigate();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const isMerchant = hasRole("Merchant");
    const facilities = useSelector((state) => state.ajax.facilities);

    const accessAbility = can("Pickup Unassigned Shipment access");

    const openDeleteAlert = (record) => {
        if (Array.isArray(record)) setselectedRecord(Array.from(record));
        else setselectedRecord(record);
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
    const handlePageChange = (p) => setCurrentPage(p);

    const openShipmentImport = () => setShipmentImportDialog(true);
    const closeShipmentImport = () => setShipmentImportDialog(false);
    const openMerchantShipmentImport = () => setMerchantShipmentImportDialog(true);
    const closeMerchantShipmentImport = () => setMerchantShipmentImportDialog(false);
    const toArray = (maybeArray) => (Array.isArray(maybeArray) ? maybeArray : []);


    const { decimalPrecision } = useSelector((state) => state.setting);
    useEffect(() => {
        console.log("Decimal precision updated to:", decimalPrecision);
    }, [decimalPrecision]);

    useEffect(() => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }

        const fetchData = async () => {
            if (!facilities) await dispatch(getFacilities());

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
                const response = await axiosMerchant.get(apiBase, { params });

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
    }, [
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

            const response = await axiosMerchant.get(apiBase, { params });

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
            setRefreshBtn(search.trim() !== "");
            handleSearch();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const location = useLocation();
    useEffect(() => {
        if (location.state?.closeTabId) {
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
                is_outsourced: 0,
            };

            axiosMerchant
                .get(apiBase, { params })
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
                .catch(handleError)
                .finally(() => setLoading(false));
        } catch (error) {
            handleError(error);
        }
    };

    const toggleRowSelection = useCallback((id) => {
        setSelectedRows((prev) => {
            const ns = new Set(prev);
            if (ns.has(id)) ns.delete(id);
            else ns.add(id);
            return ns;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selectAll) setSelectedRows(new Set());
        else setSelectedRows(new Set(shipments.map((o) => o.id)));
        setSelectAll(!selectAll);
    }, [selectAll, shipments]);

    useEffect(() => {
        setSelectedRows(new Set());
        setSelectAll(false);
    }, [shipments]);

    const handleBulkDelete = useCallback(() => {
        if (selectedRows.size > 0) openDeleteAlert(Array.from(selectedRows));
    }, [selectedRows]);

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
                .get(apiBase, { params })
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
                .catch(handleError)
                .finally(() => setLoading(false));
        } catch (error) {
            handleError(error);
        }
    };

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);
        setTimeout(() => setCopiedTrackingNo(null), 2000);
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
    return (
        <div>
            <PageTitle title={t("Pickup Shipments (No Consignee)")} />
            {selectedRows.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
                    <div className="text-sm text-blue-700 dark:text-blue-200">
                        {selectedRows.size} {selectedRows.size === 1 ? "item" : "items"}{" "}
                        selected
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={/* تقدر تبقيها */ () => {
                            }}
                            variant="default"
                            size="sm"
                            className="flex items-center gap-2"
                            disabled
                        >
                            <PrinterIcon className="h-4 w-4" /> {t("Print Selected")}
                        </Button>
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" /> {t("Delete Selected")}
                        </Button>
                    </div>
                </div>
            )}

            <div
                className={`flex flex-col md:flex-row md:justify-between md:items-center mt-2 gap-2 space-y-4 md:space-y-0 p-4 bg-white flex-wrap dark:bg-gray-800 shadow rounded ${selectedRows.size > 0 ? "rounded-t-none" : ""
                    }`}
            >
                <div />
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
                                <Upload className="size-4" />
                            </Button>
                        )}
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
                                <TableHead>{t("Action")}</TableHead>
                                <TableHead>{t("Merchant")}</TableHead>
                                <TableHead>{t("Pickup Proof")}</TableHead>
                                <TableHead>{t("Created At")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipments.map((shipment, index) => {
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

                                                    {/*<div className="flex flex-wrap gap-1.5">*/}
                                                    {/*    <Button onCLick={() => } variant={'outline'}>*/}
                                                    {/*        {t("Create")}*/}
                                                    {/*    </Button>*/}
                                                    {/*    <Button onCLick={() => } variant={'outline'}>*/}
                                                    {/*        {t("Show")}*/}
                                                    {/*    </Button>*/}
                                                    {/*</div>*/}
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-medium">
                                            {shipment?.consignee_id ? (
                                                <Button>
                                                    <Eye /> {t("Show")}
                                                </Button>
                                            ) : (
                                                <Button onClick={() => {
                                                    navigate("/create-unassigned-shipment", {
                                                        state: {
                                                            shipment: shipment,
                                                        }
                                                    });
                                                }}>
                                                    <Plus /> {t("Create")}
                                                </Button>
                                            )}

                                        </TableCell>

                                        <TableCell>
                                            {shipment?.is_walkin ? (
                                                <div>
                                                    {shipment?.customer_name}
                                                    <br />
                                                    {shipment?.customer_phone}
                                                </div>
                                            ) : (
                                                <div>
                                                    {shipment?.merchant?.name}
                                                    <br />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="!text-start">
                                            {(() => {
                                                if (!shipment?.proofs.length) {
                                                    return (
                                                        <Badge variant="outline" className="text-xs">
                                                            {t("No Proof")}
                                                        </Badge>
                                                    );
                                                }

                                                return (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <a
                                                            href={shipment?.proofs[0]?.path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title={t("Open proof")}
                                                            className="block"
                                                        >
                                                            <img
                                                                src={shipment?.proofs[0]?.path}
                                                                alt={`proof-${shipment?.proofs[0]?.path}`}
                                                                className="h-12 w-12 rounded object-cover border"
                                                                loading="lazy"
                                                            />
                                                        </a>
                                                    </div>
                                                );
                                            })()}
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
                onClose={() => setIsFiltersOpen(false)}
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
                        { key: "created_at", label: "Created At" },
                        { key: "updated_at", label: "Updated At" },
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default PickupUnassignedShipmentsPage;
