import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import Filters from './Filters';
import SummaryCards from './SummaryCards';
import DataTable from './DataTable';
import Charts from './Charts';
import { Button } from '@/components/ui/button';
import axiosMerchant from '@/axios';
import Loader from '@/components/Loader';

export default function FuelEfficiencyReports() {
    const { t } = useTranslation();
    const [data, setData] = useState({
        summary: {
            totalDistance: 0,
            totalFuel: 0,
            averageEfficiency: 0
        },
        detail: [],
        charts: {
            by_driver: [],
            trend: []
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        driverId: 'all'
    });

    const handleDateChange = (start, end) => {
        setFilters(prev => ({
            ...prev,
            startDate: start,
            endDate: end
        }));
        fetchReportData();
    };

    const handleDriverChange = (value) => {
        setFilters(prev => ({
            ...prev,
            driverId: value
        }));
        fetchReportData();
    };

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await axiosMerchant.get('/fuel-efficiency', {
                params: {
                    start_date: filters.startDate,
                    end_date: filters.endDate,
                    driver_id: filters.driverId === 'all' ? null : filters.driverId
                }
            });

            // Process the response data to match our state structure
            const processedData = {
                summary: {
                    totalDistance: response.data.data.summary.total_distance,
                    totalFuel: response.data.data.summary.total_fuel,
                    averageEfficiency: response.data.data.summary.average_efficiency
                },
                detail: response.data.data.detail.data, // Get the actual data array
                charts: {
                    by_driver: response.data.data.charts.by_driver,
                    trend: response.data.data.charts.trend
                }
            };

            setData(processedData);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch fuel efficiency report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReportData();
    }, [filters]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-100">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">{t('Fuel Efficiency Reports')}</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.open(`/api/fuel-efficiency/export/pdf?start_date=${filters.startDate}&end_date=${filters.endDate}&driver_id=${filters.driverId === 'all' ? '' : filters.driverId}`, '_blank');
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {t('Export PDF')}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            window.open(`/api/fuel-efficiency/export/csv?start_date=${filters.startDate}&end_date=${filters.endDate}&driver_id=${filters.driverId === 'all' ? '' : filters.driverId}`, '_blank');
                        }}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        {t('Export CSV')}
                    </Button>
                </div>
            </div>

            <Filters
                onDateChange={handleDateChange}
                onDriverChange={handleDriverChange}
                loading={loading}
            />

            {error && (
                <div className="text-red-500">{error}</div>
            )}
            {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
            ) : (
                <>
                    <SummaryCards
                        totalDistance={data.summary.totalDistance}
                        totalFuel={data.summary.totalFuel}
                        averageEfficiency={data.summary.averageEfficiency}
                    />
                    <Charts
                        efficiencyByDriver={data.charts.by_driver}
                        efficiencyTrend={data.charts.trend}
                    />
                    <DataTable
                        data={data.detail}
                    />
                </>
            )}
        </div>
    );
}
