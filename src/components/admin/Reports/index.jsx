import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ExportDialog from '@/components/misc/ExportDialog';
import axiosMerchant from '@/axios';
import { handleError } from '@/utils/helpers';
import toast from 'react-hot-toast';
import PageTitle from '../Layouts/PageTitle';
import NoRecordFound from '../../NoRecordFound';
import Loader from '@/components/Loader';
import Pagination from '@/components/Pagination';
import LineChartComponent from '../../charts/LineChartComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Select from '@/components/misc/Select';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Loader2,
    RefreshCcw,
    Package,
    ShoppingCart,
    Truck,
    AlertTriangle,
    DollarSign,
    Container,
    Copy,
    Check,
} from 'lucide-react';


const ShipmentReport = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [btnLoading] = useState({});
    const [shipments, setShipments] = useState([]);
    const [links, setLinks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExport, setShowExport] = useState(false);



    // Summary statistics
    const [summaryStats, setSummaryStats] = useState({
        totalShipments: 0,
        totalDelivered: 0,
        totalPending: 0,
        totalInException: 0,
        totalAmount: 0,
    });
    const [copiedTrackingNo, setCopiedTrackingNo] = useState(null);

    const handleCopy = async (trackingNo) => {
        await navigator.clipboard.writeText(trackingNo);
        setCopiedTrackingNo(trackingNo);
        toast.success(t("Tracking number copied to clipboard"));
        setTimeout(() => {
            setCopiedTrackingNo(null);
        }, 2000);
    };

    // Chart data
    const [chartData, setChartData] = useState([]);

    // Filters
    const today = new Date();
    const [filters, setFilters] = useState({
        dateRange: {
            from: today.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0]
        },
        status: 'all',
        customer: '',
    });


    // Status options
    const [statusOptions, setStatusOptions] = useState([
        { value: 'all', label: 'All Statuses' }
    ]);

    // Fetch shipment statuses from API
    const fetchShipmentStatuses = async () => {
        try {
            const response = await axiosMerchant.get('statuses/all');

            // Combine system and static statuses from the API response
            const systemStatuses = response.data.data.system || [];
            const staticStatuses = response.data.data.static || [];

            // Format statuses for the dropdown and ensure no empty values
            const formattedStatuses = [
                { value: 'all', label: 'All Statuses' },
                ...systemStatuses,
                ...staticStatuses
            ]
                .filter(status => status.label && status.label.trim() !== '') // Filter out empty labels
                .map(status => ({
                    value: status.label || `status-${status.id}`,
                    label: t(status.label)
                }));

            setStatusOptions(formattedStatuses);
        } catch (error) {
            handleError(error);
            setStatusOptions([
                { value: 'all', label: t('All Statuses') },
                { value: 'DELIVERED', label: t('Delivered') },
                { value: 'CREATED', label: t('Created') },
                { value: 'OFD', label: t('Out for Delivery') },
                { value: 'in_exception', label: t('In Exception') }
            ]);
        }
    };

    useEffect(() => {
        fetchShipments();
        fetchShipmentStatuses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters]);

    const fetchShipments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                status: filters.status === 'all' ? '' : filters.status,
                from_date: filters.dateRange.from,
                to_date: filters.dateRange.to,
                customer: filters.customer,
            });
            const response = await axiosMerchant.get(`shipments/reports?${params.toString()}`);
            if (response.data.success) {
                setShipments(response.data.data.shipments.data || []);
                setLinks(response.data.data.shipments.links || []);
                setSummaryStats(response.data.data.summary || {
                    totalShipments: 0,
                    totalDelivered: 0,
                    totalPending: 0,
                    totalInException: 0,
                    totalAmount: 0
                });
                setChartData(response.data.data.chart_data || []);
            } else {
                setShipments([]);
            }
        } catch (error) {
            handleError(error);
            setShipments([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
        setCurrentPage(1);
    };

    const handleDateRangeChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            dateRange: {
                ...prev.dateRange,
                [key]: value
            }
        }));
        setCurrentPage(1);
    };



    const handleRefresh = () => {
        setFilters({
            dateRange: {
                from: today.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0]
            },
            status: 'all',
            customer: '',
        });
        setCurrentPage(1);
        fetchShipments();
    };





    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <div>
            <PageTitle title={t("ShipmentReports.Title")} />

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-y-0">
                        <CardTitle className="text-sm font-medium">{t("ShipmentReports.TotalShipments")}</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {summaryStats.totalShipments}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-y-0">
                        <CardTitle className="text-sm font-medium">{t("ShipmentReports.Delivered")}</CardTitle>
                        <Truck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                            {summaryStats.totalDelivered}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-y-0">
                        <CardTitle className="text-sm font-medium">{t("ShipmentReports.OFD")}</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
                            {summaryStats.totalPending}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-y-0">
                        <CardTitle className="text-sm font-medium">{t("ShipmentReports.InException")}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
                            {summaryStats.totalInException}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between gap-y-0">
                        <CardTitle className="text-sm font-medium">{t("ShipmentReports.TotalAmount")}</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            {summaryStats.totalAmount}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="input-container">
                        <Label htmlFor="dateRange">{t("ShipmentReports.DateRange")}</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                id="dateFrom"
                                value={filters.dateRange.from}
                                onChange={e => handleDateRangeChange('from', e.target.value)}
                                placeholder={t("ShipmentReports.From")}
                            />
                        </div>
                    </div>
                    <div className="">
                        <span className="text-gray-500">{t("ShipmentReports.To")}</span>
                        <Input
                            type="date"
                            id="dateTo"
                            value={filters.dateRange.to}
                            onChange={e => handleDateRangeChange('to', e.target.value)}
                            placeholder={t("ShipmentReports.To")}
                        />
                    </div>

                    <div className="input-container">
                        <Label htmlFor="status">{t("ShipmentReports.Status")}</Label>
                        <Select
                            className="basic-multi-select"
                            classNamePrefix="select"
                            value={statusOptions.find(option => option.value === filters.status) || null}
                            onChange={(selectedOption) => handleFilterChange('status', selectedOption.value)}
                            options={statusOptions}
                            placeholder={t("ShipmentReports.SelectStatus")}
                            noOptionsMessage={() => t("ShipmentReports.NoStatuses")}
                        />
                    </div>

                    <div className="input-container">
                        <Label htmlFor="tracking_no">{t("ShipmentReports.TrackingNumber")}</Label>
                        <Input
                            id="tracking_no"
                            className="mt-1"
                            value={filters.customer}
                            onChange={e => handleFilterChange('customer', e.target.value)}
                            placeholder={t("ShipmentReports.SearchTrackingNumber")}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Button variant="export" type="button" onClick={() => setShowExport(true)} disabled={btnLoading.exportBtn}>
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



            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">{t("ShipmentReports.ShipmentsByStatusChart")}</h3>
                <div className="h-[300px]">
                    {chartData.length > 0 ? (
                        <LineChartComponent data={chartData} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">{t("ShipmentReports.NoData")}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Shipments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {loading ? (
                    <div className="p-4 text-center">
                        <Loader />
                    </div>
                ) : shipments.length > 0 ? (
                    <>
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead isFixed>{t("ShipmentReports.ShipmentID")}</TableHead>
                                    <TableHead>{t("ShipmentReports.CustomerName")}</TableHead>
                                    <TableHead>{t("ShipmentReports.ShipmentDate")}</TableHead>
                                    <TableHead>{t("ShipmentReports.DeliveryDate")}</TableHead>
                                    <TableHead>{t("ShipmentReports.Status")}</TableHead>
                                    <TableHead>{t("ShipmentReports.TotalAmount")}</TableHead>
                                    <TableHead>{t("ShipmentReports.CustomerPhone")}</TableHead>
                                    <TableHead>{t("ShipmentReports.Governorate")}</TableHead>
                                    <TableHead>{t("ShipmentReports.State")}</TableHead>
                                    <TableHead>{t("ShipmentReports.PaymentType")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shipments.map((shipment) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell isFixed>
                                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-x-2">
                                                <button
                                                    onClick={() => handleCopy(shipment.tracking_no)}
                                                    className="text-gray-500 hover:text-gray-900 hover:dark:text-gray-100 transition-colors"
                                                    aria-label="Copy tracking number"
                                                >
                                                    {copiedTrackingNo === shipment.tracking_no ? (
                                                        <Check size={18} className="text-green-500" />
                                                    ) : (
                                                        <Copy size={18} />
                                                    )}
                                                </button>
                                                <span className="font-medium">{shipment.tracking_no}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{shipment.consignee?.name || 'N/A'}</TableCell>
                                        <TableCell>{formatDate(shipment.created_at)}</TableCell>
                                        <TableCell>{formatDate(shipment.updated_at)}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                shipment.status === "CREATED"
                                                    ? "created"
                                                    : shipment.status === "DELIVERED"
                                                        ? "delivered"
                                                        : "outline"
                                            }>
                                                {shipment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{shipment.amount}</TableCell>
                                        <TableCell>{shipment.consignee?.cellphone || 'N/A'}</TableCell>
                                        <TableCell>{shipment.consignee?.governorate?.en_name || 'N/A'}</TableCell>
                                        <TableCell>{shipment.consignee?.state?.en_name || 'N/A'}</TableCell>
                                        <TableCell>{shipment.payment_type}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination
                            links={links}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                ) : (
                    <NoRecordFound />
                )}
            </div>

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="shipments"
                    endpoint="shipments/reports/export"
                    fields={[
                        { key: "id", label: "ID" },
                        { key: "tracking_no", label: "Tracking No" },
                        { key: "consignee.name", label: "Consignee Name" },
                        { key: "tracking_no", label: "Tracking Number" },
                        { key: "consignee.cellphone", label: "Consignee Phone" },
                        { key: "consignee.alternatePhone", label: "Consignee Alternate Phone" },
                        { key: "consignee.country.name", label: "Consignee Country Name" },
                        { key: "consignee.state.en_name", label: "Consignee State Name" },
                        { key: "amount", label: "COD" },
                        { key: "payment_type", label: "Payment Type" },
                        { key: "status", label: "Status" },
                        { key: "created_at", label: "Created At" },
                        { key: "updated_at", label: "Updated At" },
                    ]}
                    filters={[
                        {
                            key: "status",
                            label: "Select Status",
                            type: "select",
                            options: statusOptions,
                            defaultValue: "all"
                        },
                        {
                            key: "from_date",
                            label: "From Date",
                            type: "date",
                            defaultValue: ""
                        },
                        {
                            key: "to_date",
                            label: "To Date",
                            type: "date",
                            defaultValue: ""
                        }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default ShipmentReport;
