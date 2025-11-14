import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card';
import {
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/components/ui/table';
import { Container, RefreshCcw } from 'lucide-react';
import LineChartComponent from '@/components/charts/LineChartComponent';
import axiosMerchant from '@/axios';
import { can, handleError } from '@/utils/helpers';
import ExportDialog from '@/components/misc/ExportDialog';
import Loader from '@/components/Loader';
import { useNavigate } from 'react-router-dom';

const DriverPerformance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [performanceData, setPerformanceData] = useState({
        drivers: [],
        summary: {},
        trend: []
    });

    const [filters, setFilters] = useState({
        dateRange: { from: '', to: '' },
        driverName: ''
    });

    const canAccess = can("Drivers access");

    useEffect(() => {
        if (!canAccess) {
            navigate("/unauthorized");
        }
    }, [canAccess, navigate]);

    const fetchPerformanceData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get('drivers/performance', {
                params: {
                    from_date: filters.dateRange.from,
                    to_date: filters.dateRange.to,
                    driver_name: filters.driverName
                }
            });

            const data = response?.data?.data || {};
            console.log(data,'data')
            setPerformanceData({
                drivers: data?.data?.data || [],
                summary: data?.summary || {},
                trend: data?.trend || []
            });
        } catch (error) {
            handleError(error);
            setPerformanceData({
                drivers: [],
                summary: {},
                trend: []
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchPerformanceData();
    }, [filters, fetchPerformanceData]);

    const handleChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleDateChange = (type, value) => {
        setFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [type]: value }
        }));
    };

    const handleRefresh = () => {
        setFilters({ dateRange: { from: '', to: '' }, driverName: '' });
        fetchPerformanceData();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Driver Performance')}</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Drivers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.summary.total_drivers ?? 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Average On-Time Rate')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.summary.average_on_time_rate ?? 0}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Deliveries')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{performanceData.summary.total_deliveries_all_drivers ?? 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label>{t('Date From')}</Label>
                        <Input
                            type="date"
                            value={filters.dateRange.from}
                            onChange={(e) => handleDateChange('from', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>{t('Date To')}</Label>
                        <Input
                            type="date"
                            value={filters.dateRange.to}
                            onChange={(e) => handleDateChange('to', e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>{t('Driver Name')}</Label>
                        <Input
                            type="text"
                            value={filters.driverName}
                            onChange={(e) => handleChange('driverName', e.target.value)}
                            placeholder={t('Search by Driver Name')}
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Button variant="export" onClick={() => setShowExport(true)}>
                        <Container className="w-4 h-4 mr-2" /> {t('Export')}
                    </Button>
                    <Button variant="refresh" onClick={handleRefresh}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Performance Trend */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Performance Trend')}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <LineChartComponent data={performanceData.trend} />
                </CardContent>
            </Card>

            {/* Performance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Driver Performance Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead isFixed>{t('Driver Name')}</TableHead>
                                    <TableHead>{t('Total Deliveries')}</TableHead>
                                    <TableHead>{t('On-Time Deliveries')}</TableHead>
                                    <TableHead>{t('Delayed Deliveries')}</TableHead>
                                    <TableHead>{t('On-Time Rate')}</TableHead>
                                    <TableHead>{t('Customer Rating')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performanceData.drivers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            {t('No data available')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    performanceData.drivers.map((driver, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell isFixed>{driver.driver_name}</TableCell>
                                            <TableCell>{driver.total_deliveries}</TableCell>
                                            <TableCell>{driver.on_time_deliveries}</TableCell>
                                            <TableCell>{driver.delayed_deliveries}</TableCell>
                                            <TableCell>{driver.on_time_rate}%</TableCell>
                                            <TableCell>{driver.average_rating}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="driver_performance"
                    endpoint="drivers/performance/export"
                    fields={[
                        { key: 'name', label: 'Driver Name' },
                        { key: 'total_deliveries', label: 'Total Deliveries' },
                        { key: 'on_time_deliveries', label: 'On-Time Deliveries' },
                        { key: 'delayed_deliveries', label: 'Delayed Deliveries' },
                        { key: 'on_time_rate', label: 'On-Time Rate' },
                        { key: 'customer_rating', label: 'Customer Rating' }
                    ]}
                    filters={[
                        { key: 'from_date', label: 'From Date', type: 'date' },
                        { key: 'to_date', label: 'To Date', type: 'date' },
                        { key: 'driver_name', label: 'Driver Name', type: 'text' }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default DriverPerformance;
