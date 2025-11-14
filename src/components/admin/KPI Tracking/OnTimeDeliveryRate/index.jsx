import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download, Eye, RefreshCcw } from 'lucide-react';
import Select from '@/components/misc/Select';
import LineChartComponent from '@/components/charts/LineChartComponent';
import { toast } from 'react-toastify';
import axiosMerchant from '@/axios';
import { useSelector } from 'react-redux';
import { formatDecimalValue } from '@/utils/helpers';

export default function OnTimeDeliveryRate() {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const { decimalPrecision } = useSelector((state) => state.setting)
    const [filteredData, setFilteredData] = useState([]);
    const today = new Date();
    const [dateRange, setDateRange] = useState({ from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
    const [selectedRegion, setSelectedRegion] = useState('');
    const [showDelayedShipments, setShowDelayedShipments] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [delayedShipments, setDelayedShipments] = useState([]);
    const [refreshBtn, setRefreshBtn] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = () => {
        setLoading(true);
        axiosMerchant.get('/on-time-delivery', {
            params: {
                start_date: dateRange.from,
                end_date: dateRange.to,
                region: selectedRegion
            }
        })
            .then(response => {
                setData(response.data.data);
                setFilteredData(response.data.data);
            })
            .catch(error => {
                toast.error(error.response?.data?.message || 'Error fetching data');
            })
            .finally(() => setLoading(false));
    };

    // Calculate current rate (last 7 days)
    const currentRate = () => {
        if (!data.length) return '0.0';
        const last7Days = data.slice(-7);
        const totalDeliveries = last7Days.reduce((sum, day) => sum + day.total_shipments, 0);
        const totalOnTime = last7Days.reduce((sum, day) => sum + day.on_time_deliveries, 0);
        return formatDecimalValue((totalOnTime / totalDeliveries * 100), decimalPrecision);
    };

    // Region options
    const regionOptions = [
        { value: '', label: t('All Regions') },
        { value: 'dubai', label: t('Dubai') },
        { value: 'abu_dhabi', label: t('Abu Dhabi') },
        { value: 'sharjah', label: t('Sharjah') }
    ];

    // Apply filters
    useEffect(() => {
        fetchData();
    }, [dateRange, selectedRegion]);

    // Chart data
    const chartData = filteredData.map(item => ({
        title: item.date,
        value: item.on_time_rate
    }));

    const handleExport = () => {
        axiosMerchant.post('/on-time-delivery/export', {
            start_date: dateRange.from,
            end_date: dateRange.to,
            region: selectedRegion
        }, {
            responseType: 'blob'
        })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'on-time-delivery-rate.csv');
                document.body.appendChild(link);
                link.click();
                link.parentNode.removeChild(link);
            })
            .catch(error => {
                toast.error(error.response?.data?.message || 'Error exporting data');
            });
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setShowDelayedShipments(true);

        // Fetch delayed shipments for this date
        axiosMerchant.get(`/on-time-delivery/${date}`, {
            params: {
                region: selectedRegion
            }
        })
            .then(response => {
                setDelayedShipments(response.data.delayed_shipments);
            })
            .catch(error => {
                toast.error(error.response?.data?.message || 'Error fetching delayed shipments');
            });
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">{t('On-Time Delivery Rate')}</h1>
                <Button variant="outline" onClick={handleExport} disabled={loading}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export CSV')}
                </Button>
            </div>

            {/* KPI Widget */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-4xl font-bold">{loading ? '...' : currentRate()}%</div>
                            <div className="text-sm text-muted-foreground mt-1">{t('Current On-Time Rate')}</div>
                            {currentRate() < 80 && (
                                <Badge variant="destructive" className="mt-2">
                                    <AlertTriangle className="w-4 h-4 mr-1" />
                                    {t('Below Target')}
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Filters')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('From Date')}</label>
                            <Input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                                disabled={loading}
                            />
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('To Date')}</label>
                            <Input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                                disabled={loading}
                            />
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Region')}</label>
                            <Select
                                options={regionOptions}
                                value={regionOptions.find(opt => opt.value === selectedRegion)}
                                onChange={(opt) => setSelectedRegion(opt.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chart */}
            <Card>
                <CardContent>
                    <div className="h-[300px]">
                        <LineChartComponent data={chartData} />
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Delivery Performance')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={async () => {
                            setRefreshBtn(true);
                            await fetchData();
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t('Date')}</TableHead>
                                <TableHead className="text-right">{t('Total Shipments')}</TableHead>
                                <TableHead className="text-right">{t('On-Time')}</TableHead>
                                <TableHead className="text-right">{t('Delayed')}</TableHead>
                                <TableHead className="text-right">{t('On-Time Rate')}</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">
                                        <div className="animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredData.map((row) => (
                                <TableRow key={row.date}>
                                    <TableCell isFixed>{row.date}</TableCell>
                                    <TableCell className="text-right">{row.total_shipments}</TableCell>
                                    <TableCell className="text-right">{row.on_time_deliveries}</TableCell>
                                    <TableCell className="text-right">{row.delayed_deliveries}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant={row.on_time_rate >= 80 ? 'success' : 'destructive'}
                                        >
                                            {formatDecimalValue(row.on_time_rate, decimalPrecision)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {row.delayed_deliveries > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDateClick(row.date)}
                                                disabled={loading}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Delayed Shipments Dialog */}
            <Dialog open={showDelayedShipments} onOpenChange={setShowDelayedShipments}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('Delayed Shipments')} - {selectedDate && new Date(selectedDate).toLocaleDateString()}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-2">
                        {delayedShipments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('Shipment ID')}</TableHead>
                                        <TableHead>{t('Scheduled Delivery Date')}</TableHead>
                                        <TableHead>{t('Actual Delivery Date')}</TableHead>
                                        <TableHead>{t('Delay Duration (minutes)')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {delayedShipments.map((shipment) => (
                                        <TableRow key={shipment.shipment_id}>
                                            <TableCell>{shipment.shipment_id}</TableCell>
                                            <TableCell>{new Date(shipment.scheduled_delivery_date).toLocaleDateString()}</TableCell>
                                            <TableCell>{new Date(shipment.delivered_at).toLocaleDateString()}</TableCell>
                                            <TableCell>{shipment.delay_minutes}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">
                                {t('No delayed shipments found')}
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
