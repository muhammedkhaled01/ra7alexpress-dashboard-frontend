import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Container, RefreshCcw } from 'lucide-react';
import axiosMerchant from '@/axios';
import { handleError } from '@/utils/helpers';
import ExportDialog from '@/components/misc/ExportDialog';
import Loader from '@/components/Loader';
import LineChartComponent from '@/components/charts/LineChartComponent';
import Select from '@/components/misc/Select';

const FinancialReports = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [showExport, setShowExport] = useState(false);
    const [financialData, setFinancialData] = useState({
        summary: {
            total_revenue: 0,
            cod_collected: 0,
            total_expenses: 0,
            net_profit: 0
        },
        chart_data: [],
        daily_breakdown: []
    });
    const today = new Date();
    const [filters, setFilters] = useState({
        start_date: today.toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        granularity: 'daily'
    });

    const fetchFinancialData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosMerchant.get('financial-reports', {
                params: {
                    start_date: filters.start_date,
                    end_date: filters.end_date,
                    granularity: filters.granularity
                }
            });
            setFinancialData(response.data.data || {
                summary: {
                    total_revenue: 0,
                    cod_collected: 0,
                    total_expenses: 0,
                    net_profit: 0
                },
                chart_data: [],
                daily_breakdown: []
            });
        } catch (error) {
            handleError(error);
            setFinancialData({
                summary: {
                    total_revenue: 0,
                    cod_collected: 0,
                    total_expenses: 0,
                    net_profit: 0
                },
                chart_data: [],
                daily_breakdown: []
            });
        } finally {
            setLoading(false);
        }
    }, [filters.start_date, filters.end_date, filters.granularity]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const handleDateRangeChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        fetchFinancialData();
    };

    const handleGranularityChange = (value) => {
        setFilters(prev => ({
            ...prev,
            granularity: value
        }));
        fetchFinancialData();
    };

    const handleRefresh = () => {
        setFilters({
            start_date: today.toISOString().split('T')[0],
            end_date: today.toISOString().split('T')[0],
            granularity: 'daily'
        });
        fetchFinancialData();
    };

    // const navigate = useNavigate()

    // const canAccess = can("Quality Check access")

    // if (!canAccess) {
    //     return navigate("/unauthorized");
    // }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Financial Reports')}</h1>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Revenue')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(financialData?.summary?.total_revenue || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('COD Collected')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(financialData?.summary?.cod_collected || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Expenses')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(financialData?.summary?.total_expenses || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">{t('Net Profit')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(financialData?.summary?.net_profit || 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="input-container">
                        <Label>{t('Date From')}</Label>
                        <Input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                            icon={filters.start_date && (
                                <RefreshCcw
                                    className="w-4 h-4 cursor-pointer"
                                    onClick={handleRefresh}
                                />
                            )}
                        />
                    </div>
                    <div className="input-container">
                        <Label>{t('Date To')}</Label>
                        <Input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                            icon={filters.end_date && (
                                <RefreshCcw
                                    className="w-4 h-4 cursor-pointer"
                                    onClick={handleRefresh}
                                />
                            )}
                        />
                    </div>
                    <div className="input-container">
                        <Label>{t('Granularity')}</Label>
                        <Select
                            options={[  
                                { value: 'daily', label: t('Daily') },
                                { value: 'monthly', label: t('Monthly') }
                            ]}
                            value={[
                                { value: 'daily', label: t('Daily') },
                                { value: 'monthly', label: t('Monthly') }
                            ].find(opt => opt.value === filters.granularity)}
                            onChange={(opt) => handleGranularityChange(opt.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <Button type="button" variant="export" onClick={() => setShowExport(true)} >
                        <Container />
                    </Button>
                    <Button variant="refresh" onClick={handleRefresh}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Financial Breakdown Chart */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>{t('Financial Breakdown')}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {financialData?.chart_data && (
                        <LineChartComponent data={financialData?.chart_data} />
                    )}
                </CardContent>
            </Card>

            {/* Financial Reports Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('Financial Report Details')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead isFixed>{t('Date')}</TableHead>
                                <TableHead>{t('Revenue')}</TableHead>
                                <TableHead>{t('COD Collected')}</TableHead>
                                <TableHead>{t('Expenses')}</TableHead>
                                <TableHead>{t('Net Profit')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        <Loader />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                financialData?.daily_breakdown?.map((report, index) => (
                                    <TableRow key={index}>
                                        <TableCell isFixed>{report?.date}</TableCell>
                                        <TableCell>${(report?.revenue || 0).toLocaleString()}</TableCell>
                                        <TableCell>${(report?.cod_collected || 0).toLocaleString()}</TableCell>
                                        <TableCell>${(report?.expenses || 0).toLocaleString()}</TableCell>
                                        <TableCell>${(report?.net_profit || 0).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Export Dialog */}
            {showExport && (
                <ExportDialog
                    model="financial_reports"
                    endpoint="financial-reports/export"
                    fields={[
                        { key: 'date', label: 'Date' },
                        { key: 'revenue', label: 'Revenue' },
                        { key: 'cod_collected', label: 'COD Collected' },
                        { key: 'expenses', label: 'Expenses' },
                        { key: 'net_profit', label: 'Net Profit' }
                    ]}
                    filters={[
                        {
                            key: 'start_date',
                            label: 'Start Date',
                            type: 'date'
                        },
                        {
                            key: 'end_date',
                            label: 'End Date',
                            type: 'date'
                        },
                        {
                            key: 'granularity',
                            label: 'Granularity',
                            type: 'select',
                            options: [
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' }
                            ]
                        }
                    ]}
                    onClose={() => setShowExport(false)}
                />
            )}
        </div>
    );
};

export default FinancialReports;
