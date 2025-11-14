import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import axiosMerchant from "@/axios";
import { Check, Copy, RefreshCcw } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { handleError } from "@/utils/helpers";
import { useTranslation } from "react-i18next";
import Loader from "@/components/Loader";
import NoRecordFound from "../../NoRecordFound";
import Pagination from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const PendingTransferShipments = ({ onShipmentsFetched }) => {
    const [loading, setLoading] = useState(true);
    const [pendingShipments, setPendingShipments] = useState([]);
    const [pendingShipmentsLinks, setPendingShipmentsLinks] = useState([]);
    const [pendingShipmentsMeta, setPendingShipmentsMeta] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);
    const { t } = useTranslation();

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);

        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    const fetchPendingTransferShipments = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get(
                `transfer_tasks/pending-transfer-shipments?page=${page}`
            );
            const dataContainer = response.data.data;
            setPendingShipmentsLinks(dataContainer.links || []);
            setPendingShipmentsMeta(dataContainer.meta || {});
            const shipments = dataContainer.data || [];
            setPendingShipments(shipments);
            if (onShipmentsFetched) {
                onShipmentsFetched(shipments.length);
            }

        } catch (error) {
            handleError(error);
            setPendingShipments([]);
            setPendingShipmentsLinks([]);
            setPendingShipmentsMeta({});
        } finally {
            setLoading(false);
            setRefreshBtn(false);
        }
    }, [onShipmentsFetched]);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        fetchPendingTransferShipments(page);
    }, [fetchPendingTransferShipments]);

    const handleRefresh = useCallback(() => {
        setRefreshBtn(true);
        fetchPendingTransferShipments(currentPage);
    }, [fetchPendingTransferShipments, currentPage]);

    useEffect(() => {
        fetchPendingTransferShipments(currentPage);
    }, [fetchPendingTransferShipments, currentPage]);

    const startIndex = (pendingShipmentsMeta.current_page - 1) * pendingShipmentsMeta.per_page;

    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800">
                    {t("Pending Transfer Shipments")}
                </CardTitle>
                <Button
                    variant="refresh"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={loading || refreshBtn}
                    className="transition duration-150"
                >
                    <RefreshCcw
                        className={`h-4 w-4 ${refreshBtn ? "animate-spin" : ""}`}
                    />
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">{t("#")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("Tracking No")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("Consignee")}</TableHead>
                                <TableHead className="min-w-[180px]">{t("Source")}</TableHead>
                                <TableHead className="min-w-[180px]">{t("Destination")}</TableHead>
                                <TableHead className="min-w-[120px]">{t("Created At")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : pendingShipments && pendingShipments.length > 0 ? (
                                pendingShipments.map((shipment, index) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                                        <TableCell className="font-medium text-primary">
                                            <div className="flex items-center justify-center gap-2">
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
                                                <span>{shipment.tracking_no}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground flex flex-col items-center">
                                            <span className="font-medium text-primary">{shipment.shipment_details.consignee_name}</span>
                                            <span className="font-light text-primary">{shipment.shipment_details.consignee_phone}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold">{shipment.source.entity_name}</span>
                                                <Badge variant="outline" className="w-fit mt-1 text-xs px-2 py-0.5 border-blue-200 text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-200">
                                                    {shipment.source.entity_type}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold">{shipment.destination.entity_name}</span>
                                                <Badge variant="outline" className="w-fit mt-1 text-xs px-2 py-0.5 border-green-200 text-green-600 bg-green-50 dark:bg-green-900 dark:text-green-200">
                                                    {shipment.destination.entity_type === 'N/A' ? 'Unspecified' : shipment.destination.entity_type}
                                                </Badge>
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
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center">
                                        <NoRecordFound />
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end p-4">
                <Pagination
                    links={pendingShipmentsLinks}
                    currentPage={pendingShipmentsMeta.current_page || 1}
                    onPageChange={handlePageChange}
                    meta={pendingShipmentsMeta}
                />
            </CardFooter>
        </Card>
    );
};

export default PendingTransferShipments;
