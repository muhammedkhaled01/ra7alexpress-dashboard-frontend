import axiosMerchant from "@/axios";
import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/misc/Select";
import { format } from "date-fns";
import { Download, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Loader from "@/components/Loader";
import NoRecordFound from "@/components/NoRecordFound";
import Pagination from "@/components/Pagination";
import { Copy, Check } from "lucide-react";
import { formatCurrentCurrency, formatDecimalValue, handleError } from "@/utils/helpers";
import ExportDialog from "@/components/misc/ExportDialog";
import moment from '@/utils/moment';
import { useSelector } from "react-redux";
import { useLanguage } from "@/contexts/LanguageProvider";

export default function ShipmentHistory() {
    const { currencyEnglishName, currencyArabicName, decimalPrecision } = useSelector((state) => state.setting)
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [links, setLinks] = useState([]);
    const [shipments, setShipments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [shipmentStatuses, setShipmentStatuses] = useState([]);
    const [showExport, setShowExport] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const today = moment().format('YYYY-MM-DD');
    const [dateRange, setDateRange] = useState({
        startDate: today,
        endDate: today,
    });
    const [page, setPage] = useState(1);
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);

    const fetchShipments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: page,
                search: searchTerm || undefined,
                status: statusFilter || undefined,
                date_start: dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : undefined,
                date_end: dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : undefined
            };

            const query = Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== "")
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join("&");

            const response = await axiosMerchant.get(`shipments/history?${query}`);
            console.log(response.data, 'response.data');

            if (response.data.success === false && response.data.errors?.includes('no record')) {
                setShipments([]);
                setLinks([]);
                setPage(1);
                return;
            }

            const linksString = response.data.data.links;
            const linksRegex = /<(.+?)>; rel="(.+?)"/g;
            const links = {};
            let match;
            while ((match = linksRegex.exec(linksString)) !== null) {
                links[match[2]] = match[1];
            }

            const transformedLinks = Object.entries(links).map(([rel, url]) => ({
                label: rel === 'next' ? 'Next' : rel === 'prev' ? 'Previous' : rel === 'first' ? 'First' : rel === 'last' ? 'Last' : rel,
                url: url,
                active: false,
                disabled: rel === 'next' && !url
            }));
            setLinks(transformedLinks);
            setShipments(response.data.data.data.data.map(shipment => ({
                shipmentId: shipment.tracking_no,
                shipmentDate: new Date(shipment.created_at),
                totalAmount: parseFloat(shipment.amount),
                status: shipment.status,
                deliveryDate: shipment.shipment_delivery?.delivery_lat && shipment.shipment_delivery?.delivery_lng
                    ? new Date(shipment.updated_at)
                    : null,
                checked: false
            })));
            setPage(response.data.data.data.current_page);
        } catch (error) {
            console.error(error)
            toast.error(error.response?.data?.message || t("Failed to fetch shipments"));
        } finally {
            setIsLoading(false);
        }
    }, [page, searchTerm, statusFilter, dateRange, t]);

    useEffect(() => {
        fetchShipmentStatuses();
    }, []);

    useEffect(() => {
        fetchShipments();
    }, [page, searchTerm, statusFilter, dateRange, fetchShipments]);

    const fetchShipmentStatuses = async () => {
        setStatusLoading(true);
        try {
            const response = await axiosMerchant.get('statuses/all');

            const systemStatuses = response.data.data.system || [];
            const staticStatuses = response.data.data.static || [];

            const formattedStatuses = [...systemStatuses, ...staticStatuses]
                .filter(status => status.label && status.label.trim() !== '')
                .map(status => ({
                    value: status.label || `status-${status.id}`,
                    label: t(status.label)
                }));

            setShipmentStatuses(formattedStatuses);
        } catch (error) {
            handleError(error);
            setShipmentStatuses([
                { value: "ALL", label: t("All") },
                { value: "DELIVERED", label: t("Delivered") },
                { value: "CANCELLED", label: t("Cancelled") },
                { value: "PENDING", label: t("Pending") },
                { value: "PROCESSING", label: t("Processing") }
            ]);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleRefresh = () => {
        setSearchTerm("");
        setStatusFilter("");
        setDateRange({
            startDate: today,
            endDate: today
        });
        fetchShipments();
    };


    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);
        toast.success(t("Tracking number copied to clipboard"));
        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    const handleExport = () => {
        setShowExport(true);
    };

    return (
        <>
            <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-4">
                    {/* Filter Card */}
                    <div className="bg-white dark:bg-muted shadow-md rounded-lg p-4 flex flex-col gap-y-4">
                        <div className="mb-2 flex justify-between items-center">
                            <h2 className="text-lg font-semibold">{t("Filter Shipments")}</h2>
                            <div className="flex items-center gap-x-2">
                                <Button type="button" variant="refresh" onClick={handleRefresh}>
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                                <Button variant="download" type="submit" onClick={handleExport}>
                                    <Download />
                                </Button>
                            </div>
                        </div>
                        <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Search Field */}
                            <div className="flex flex-col gap-1 input-container col-span-1">
                                <Label htmlFor="search">{t("Search")}</Label>
                                <Input
                                    id="search"
                                    type="text"
                                    className="w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t("Enter Tracking Number")}
                                />
                            </div>
                            {/* Status Filter */}
                            <div className="flex flex-col gap-1 input-container">
                                <Label htmlFor="status">{t("Status")}</Label>
                                <Select
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    isDisabled={statusLoading}
                                    value={shipmentStatuses.find(option => option.value === statusFilter) || null}
                                    onChange={(selectedOption) => setStatusFilter(selectedOption.value)}
                                    options={shipmentStatuses}
                                    placeholder={statusLoading ? t("Loading statuses...") : t("Select status...")}
                                    noOptionsMessage={() => t("No statuses available")}
                                />
                            </div>
                            {/* Date Range */}
                            <div className="flex flex-col gap-1 input-container md:col-span-2">
                                <Label htmlFor="dateRange">{t("Date Range")}</Label>
                                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                    <Input
                                        type="date"
                                        id="dateFrom"
                                        className="w-full h-[40px]"
                                        value={dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) =>
                                            setDateRange(prev => ({
                                                ...prev,
                                                startDate: e.target.value ? new Date(e.target.value) : null
                                            }))
                                        }
                                    />
                                    <span className="text-gray-500 text-center">{t("To")}</span>
                                    <Input
                                        type="date"
                                        id="dateTo"
                                        className="w-full h-[40px]"
                                        value={dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : ""}
                                        onChange={(e) =>
                                            setDateRange(prev => ({
                                                ...prev,
                                                endDate: e.target.value ? new Date(e.target.value) : null
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* End Filter Card */}
                </div>

                <div className="shadow-md py-4 rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t("Tracking Number")}</TableHead>
                                <TableHead>{t("Shipment Date")}</TableHead>
                                <TableHead>{t("Total Amount")}</TableHead>
                                <TableHead>{t("Status")}</TableHead>
                                <TableHead>{t("Delivery Date")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : shipments && shipments.length > 0 ? (
                                shipments.map((shipment, index) => (
                                    <TableRow
                                        key={index}
                                        onClick={() => {
                                            window.location.href = `/track-shipment?tracking_no=${shipment.shipmentId}`;
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <TableCell isFixed className="flex items-center">
                                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-x-2">
                                                <button
                                                    onClick={() => handleCopy(shipment.shipmentId)}
                                                    className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                    aria-label="Copy tracking number"
                                                >
                                                    {copiedTrackingNo === shipment.shipmentId ? (
                                                        <Check size={18} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={18} />
                                                    )}
                                                </button>
                                                <span className="font-medium">{shipment.shipmentId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(shipment.shipmentDate, "yyyy-MM-dd HH:mm")}</TableCell>
                                        <TableCell>{formatDecimalValue(shipment.totalAmount, decimalPrecision)} {formatCurrentCurrency(currencyEnglishName, currencyArabicName, language)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                shipment.status === "CREATED"
                                                    ? "created"
                                                    : shipment.status === "DELIVERY_EXCEPTION"
                                                        ? "exception"
                                                        : shipment.status === "DELIVERED"
                                                            ? "delivered"
                                                            : "outline"
                                            }>
                                                {shipment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {shipment.deliveryDate
                                                ? format(shipment.deliveryDate, "yyyy-MM-dd HH:mm")
                                                : "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        <NoRecordFound />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination
                        links={links}
                        currentPage={page}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {showExport && (
                <ExportDialog
                    model="shipments"
                    endpoint="shipments/history/export"
                    fields={[
                        { key: "tracking_no", label: "Tracking Number" },
                        { key: "created_at", label: "Shipment Date" },
                        { key: "amount", label: "Total Amount" },
                        { key: "status", label: "Status" },
                        { key: "updated_at", label: "Delivery Date" }
                    ]}
                    filters={[
                        {
                            key: "search",
                            label: "Search",
                            type: "text",
                            placeholder: t("Enter Tracking Number")
                        },
                        {
                            key: "status",
                            label: "Status",
                            type: "select",
                            options: shipmentStatuses.map(status => ({
                                value: status.value,
                                label: status.label
                            })),
                            placeholder: t("Select status...")
                        },
                        {
                            key: "date_range",
                            label: "Date Range",
                            type: "date_range",
                            fields: [
                                { key: "date_start", label: "From" },
                                { key: "date_end", label: "To" }
                            ]
                        }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </>
    );
}
