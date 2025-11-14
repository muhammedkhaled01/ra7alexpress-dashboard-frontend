import axiosMerchant from "@/axios";
import { useEffect, useState, useCallback } from "react";
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

import {
    Container,
    Edit,
    Eye,
    Loader2,
    RefreshCcw,
    Check,
    Copy,
    Pencil,
} from "lucide-react";

import { can, handleError } from "@/utils/helpers";
import Loader from "@/components/Loader";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import ExportDialog from "@/components/misc/ExportDialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ReturnView from "./ReturnView";
import ReturnEdit from "./Edit";

const ReturnIndex = () => {
    const [loading, setLoading] = useState(true);
    const [btnLoading] = useState({});
    const [links, setLinks] = useState([]);
    const [returns, setReturns] = useState([]);
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
    });
    const [statusFilter, setStatusFilter] = useState("All");

    const navigate = useNavigate();
    const { t } = useTranslation();

    const accessAbility = can("Return access");
    const updateAbility = can("Return update");

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    const fetchReturns = useCallback(async (pageNumber) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pageNumber,
                status: statusFilter !== "All" ? statusFilter : "",
                from_date: dateRange.from || "",
                to_date: dateRange.to || "",
                query: search,
            });
            const response = await axiosMerchant.get(`returns?${params.toString()}`);
            if (response.data.data.length === 0) {
                setReturns([]);
            } else {
                setReturns(response.data.data.returns.data);
                setLinks(response.data.data.returns.links);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, dateRange, search]);


    useEffect(() => {
        if (!accessAbility) {
            navigate("unauthorized");
            return;
        }
        fetchReturns(currentPage);
    }, [currentPage, accessAbility, navigate, statusFilter, dateRange, fetchReturns]);

    const handleSearch = useCallback(async () => {
        if (!search.trim()) return;
        fetchReturns(1);
    }, [search, fetchReturns]);

    useEffect(() => {
        const timer = setTimeout(() => {
            search.trim() !== "" ? setRefreshBtn(true) : setRefreshBtn(false);
            handleSearch();
        }, 500);

        return () => clearTimeout(timer);
    }, [search, handleSearch]); // Added handleSearch to dependency array

    const handleRefresh = () => {
        setSearch("");
        setRefreshBtn(false);
        setStatusFilter("All");
        setDateRange({ from: "", to: "" });
        fetchReturns(1);
    };

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);

        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    const handleSubmitSuccess = () => {
        fetchReturns(currentPage);
    };

    const handleView = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsViewModalOpen(true);
    };

    const handleEdit = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsEditModalOpen(true);
    };
    return (
        <div>
            <PageTitle title={t("Returns")} />
            <div className="flex mt-2 space-y-4 md:space-y-0 p-4 bg-white dark:bg-gray-800 shadow rounded">
                <div className="flex flex-col md:flex-row  md:items-end gap-2 w-full">
                    <div className="flex gap-x-2 input-container">
                        <Label htmlFor="dateRange">{t("Search")}</Label>
                        <Input
                            name="search"
                            type="text"
                            className="w-[200px]"
                            value={search}
                            id="search"
                            placeholder={t("Search Returns...")}
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
                    <div className="flex flex-col gap-1 input-container">
                        <Label htmlFor="dateRange">{t("Date Range")}</Label>
                        <div className="flex flex-col md:flex-row gap-2 items-center">
                            <Input
                                type="date"
                                id="dateFrom"
                                className="w-full h-[40px]"
                                value={dateRange.from}
                                onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                placeholder={t("From")}
                            />
                            <span className="text-gray-500 text-center">{t("To")}</span>
                            <Input
                                type="date"
                                id="dateTo"
                                className="w-full h-[40px]"
                                value={dateRange.to}
                                onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                placeholder={t("To")}
                            />
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setShowExport(true)}
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

            <div className="mt-4">
                {loading ? (
                    <Table
                        className={`text-xs ${returns && returns.length > 0 ? "" : "!p-2"}`}
                    >
                        <TableRow>
                            <TableCell colSpan={7} className="text-center">
                                <Loader />
                            </TableCell>
                        </TableRow>
                    </Table>
                ) : returns && returns.length > 0 ? (
                    <Table
                        className={`text-xs ${returns && returns.length > 0 ? "" : "!p-2"}`}
                    >
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("Shipment ID")}</TableHead>
                                <TableHead isFixed>{t("Tracking Number")}</TableHead>
                                <TableHead>{t("Customer Name")}</TableHead>
                                <TableHead>{t("Reason")}</TableHead>
                                <TableHead>{t("Date Initiated")}</TableHead>
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead>{t("Actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {returns.map((returnItem) => (
                                <TableRow key={returnItem.id}>
                                    <TableCell className="font-medium">
                                        {returnItem.return_id}
                                    </TableCell>
                                    <TableCell isFixed>
                                        <div className="flex items-center gap-x-2">
                                            <button
                                                onClick={() => handleCopy(returnItem.shipment_tracking_no)}
                                                className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                aria-label="Copy tracking number"
                                            >
                                                {copiedTrackingNo === returnItem.shipment_tracking_no ? (
                                                    <Check size={18} className="text-green-500" />
                                                ) : (
                                                    <Copy size={18} />
                                                )}
                                            </button>
                                            <span className="font-medium">{returnItem.shipment_tracking_no}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{returnItem.customer_name}</TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="max-w-[200px] truncate cursor-help">
                                                        {returnItem.reason}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{returnItem.reason}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(returnItem.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={"exception"}>
                                            {returnItem.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-x-2">
                                            <Button
                                                onClick={() => handleView(returnItem)}
                                                size="icon"
                                                variant="show"
                                            >
                                                <Eye />
                                            </Button>
                                            {updateAbility && (
                                                <Button
                                                    onClick={() => handleEdit(returnItem)}
                                                    type="button"
                                                    variant="edit"
                                                >
                                                    <Pencil />
                                                </Button>
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

            {/* View Modal */}
            {isViewModalOpen && (
                <ReturnView
                    returnData={selectedReturn}
                    isOpen={isViewModalOpen}
                    setIsOpen={setIsViewModalOpen}
                    onClose={() => {
                        setIsViewModalOpen(false);
                        setSelectedReturn(null);
                    }}
                />
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <ReturnEdit
                    returnData={selectedReturn}
                    isOpen={isEditModalOpen}
                    setIsOpen={setIsEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedReturn(null);
                    }}
                    onSubmitSuccess={handleSubmitSuccess}
                />
            )}

            {showExport && (
                <ExportDialog
                    model="returns"
                    endpoint="returns/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "return_id", label: "Return ID" },
                        { key: "shipment_tracking_no", label: "Shipment ID" },
                        { key: "customer_name", label: "Customer Name" },
                        { key: "reason", label: "Reason for Return" },
                        { key: "status", label: "Status" },
                        { key: "created_at", label: "Date Initiated" },
                        { key: "updated_at", label: "Last Updated" },
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default ReturnIndex;
