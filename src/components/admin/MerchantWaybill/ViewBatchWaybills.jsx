import React, { useEffect, useState, useCallback } from "react";
import { Button } from "../../ui/button";
import PageTitle from "../Layouts/PageTitle";
import { hasRole } from "../../../utils/helpers.js";
import NoRecordFound from "../../NoRecordFound";
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
import {useParams, useNavigate} from "react-router-dom";
import Pagination from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Loader2,
    MoreHorizontal,
    PrinterIcon,
    RefreshCcw,
    Trash2Icon,
    LucideLoader,
} from "lucide-react";
import {
    can,
    convertBoolean,
    handleError,
    printLabel,
} from "@/utils/helpers";
import Loader from "@/components/Loader";
import DeleteAlert from "@/components/misc/DeleteAlert";
import { useTranslation } from "react-i18next";
import axiosMerchant from "@/axios";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import RequestWaybillButton from "@/components/RequestWaybillButton";
import Select from "@/components/misc/Select.jsx";

const ViewBatchWaybills = () => {
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [merchantWaybills, setMerchantWaybills] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const navigate = useNavigate();
    const { t } = useTranslation();
    const { merchant_id, batch_id } = useParams();

    const accessAbility = can("Merchant Waybill access");
    const deleteAbility = can("Merchant Waybill delete");

    const openDeleteAlert = (record) => {
        setSelectedRecord(record);
        setDeleteAlert(true);
    };
    const fetchMerchantWaybills = useCallback(async (currentSearchValue, pageNumber, perPage) => {
        if (!accessAbility) {
            navigate("/unauthorized");
            return;
        }

        setLoading(true);
        const query = String(currentSearchValue).trim();
        const apiUrl = `merchant_waybills/batches/${batch_id}?page=${pageNumber}&merchant_id=${merchant_id}&per_page=${perPage}&query=${query}`;

        try {
            const response = await axiosMerchant.get(apiUrl);
            setLinks(response.data.data.links);
            setMerchantWaybills(response.data.data.data);
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [batch_id, merchant_id, accessAbility, navigate]);

    useEffect(() => {
        const delay = search.trim() ? 500 : 0;

        const timer = setTimeout(() => {
            fetchMerchantWaybills(search, currentPage, itemsPerPage);
        }, delay);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, search, fetchMerchantWaybills]);


    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleItemsPerPageChange = (opt) => {
        setItemsPerPage(Number(opt.value));
        setCurrentPage(1);
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    }
    const handleRefresh = () => {
        if(search === "") {
            fetchMerchantWaybills()
        }
        setSearch("");
        setCurrentPage(1);
    };

    const handleSubmitSuccess = () => {
        fetchMerchantWaybills(search, currentPage, itemsPerPage);
    };
    const handleBulkPrint = async () => {
        if (selectedRows.size === 0) return;
        setIsPrinting(true);
        try {
            const selectedWaybills = merchantWaybills.filter((shipment) =>
                selectedRows.has(shipment.id)
            );
            const ids = selectedWaybills.map((merchant_waybill) => merchant_waybill.id);
            const response = await axiosMerchant.post(`/merchant_waybills/printMultipleWaybills`, {
                ids: ids,
                forcePrintMode: 'local-waybill',
            });
            await printLabel(response.data.html);
        } catch (error) {
            console.error("Error in bulk printing:", error);
            handleError(error);
        } finally {
            setIsPrinting(false);
        }
    };

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

    const toggleSelectAll = useCallback(() => {
        if (selectAll) {
            setSelectedRows(new Set());
        } else {
            const allIds = merchantWaybills.map((shipment) => shipment.id);
            setSelectedRows(new Set(allIds));
        }
        setSelectAll(!selectAll);
    }, [selectAll, merchantWaybills]);

    useEffect(() => {
        setSelectedRows(new Set());
        setSelectAll(false);
    }, [merchantWaybills]);

    const closeDeleteAlert = () => {
        setSelectedRecord(null);
        setDeleteAlert(false);
    };

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);

        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    const handlePrint = async (waybill) => {
        try {
            setIsPrinting((prev) => ({ ...prev, [waybill.id]: true }));
            const response = await axiosMerchant.post(`/merchant_waybills/printMultipleWaybills`, {
                ids: [waybill?.id],
                forcePrintMode: 'local-waybill',
            });
            await printLabel(response.data.html);
            setIsPrinting(false);
        } catch (error) {
            console.error("Error in bulk printing:", error);
            handleError(error);
            setIsPrinting(false);
        } finally {
            setIsPrinting(false);
        }
    };
    const canAccessButton = hasRole("Merchant") || hasRole('Merchant Admin');
    return (
        <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center my-2 space-y-4 md:space-y-0">
                <PageTitle title={t("Merchant Waybills")} />
                <div className={"flex flex-col md:flex-row items-center gap-3"}>
                    <form
                        action=""
                        className="flex justify-end w-full md:w-auto"
                    >
                        <div className="flex flex-col md:flex-row md:gap-x-2 w-full">
                            <Input
                                name="search"
                                type="text"
                                className="w-full md:w-[200px]"
                                value={search}
                                id="search"
                                placeholder={t("Search By Tracking Number...")}
                                onChange={handleSearchChange} // تم التعديل هنا
                                icon={
                                    search.trim() !== "" && (
                                        <RefreshCcw className="w-4 h-4 cursor-pointer" onClick={handleRefresh} />
                                    )
                                }
                            />
                            <Button type="button" variant="refresh" onClick={handleRefresh}>
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                    <div className="flex items-center space-x-2">
                    </div>
                    <label className="text-sm text-gray-600 dark:text-gray-300">
                        {t("Show")}
                    </label>
                    <Select
                        value={{ value: itemsPerPage, label: String(itemsPerPage) }}
                        onChange={handleItemsPerPageChange} // تم التعديل هنا
                        options={[5, 8, 15, 25, 50, 100].map((n) => ({
                            value: n,
                            label: String(n),
                        }))}
                        className="w-20 text-sm"
                        isSearchable={false}
                    />
                </div>
            </div>
            {selectedRows.size > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900 p-3 mt-3 rounded-lg flex justify-between items-center">
                    <div className="text-sm text-blue-700 dark:text-blue-200">
                        {selectedRows.size} {selectedRows.size === 1 ? t("item") : t("items")}{" "}
                        {t("selected")}
                    </div>
                    <div className="flex items-center gap-2">
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
                    </div>
                </div>
            )}
            {canAccessButton && (
                <RequestWaybillButton
                    onSuccess={() => fetchMerchantWaybills(search, currentPage, itemsPerPage)}
                    className="bg-primary hover:bg-primary/90 text-white"
                />
            )}
            <div className="shadow-md py-4 mt-2 rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("#")}</TableHead>
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
                            <TableHead>
                                {t("Used")}
                            </TableHead>
                            <TableHead>{t("Print")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : merchantWaybills.length > 0 ? (
                            merchantWaybills.map((merchantWaybill, index) => (
                                <TableRow key={merchantWaybill.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell isFixed hasCheckbox>
                                        <div className="flex items-center gap-x-2">
                                            <Checkbox
                                                checked={selectedRows.has(merchantWaybill.id)}
                                                onCheckedChange={() => toggleRowSelection(merchantWaybill.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 mt-1"
                                                aria-label={`Select merchant Waybill ${merchantWaybill.tracking_no}`}
                                            />
                                            <button
                                                onClick={() => handleCopy(merchantWaybill.tracking_no)}
                                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                aria-label="Copy tracking number"
                                            >
                                                {copiedTrackingNo === merchantWaybill.tracking_no ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                            <span className="font-medium">{merchantWaybill.tracking_no}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge>{convertBoolean(merchantWaybill.used)}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            onClick={() => handlePrint(merchantWaybill)}
                                            disabled={
                                                isPrinting[merchantWaybill.id] || merchantWaybill.used
                                            }
                                        >
                                            {isPrinting[merchantWaybill.id] ? (
                                                <LucideLoader className="h-4 w-4 animate-spin inline-block" />
                                            ) : (
                                                <PrinterIcon className="h-6 w-6" />
                                            )}
                                        </Button>
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
            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleSubmitSuccess}
                    record={selectedRecord}
                    onClose={closeDeleteAlert}
                    api={"merchant_waybills/delete"}
                />
            )}
        </div>
    );
};
export default ViewBatchWaybills;