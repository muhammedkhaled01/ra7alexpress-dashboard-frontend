import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw } from 'lucide-react';
import FulfillmentKPI from './FulfillmentKPI';
import Filters from './Filters';
import FulfillmentChart from './FulfillmentChart';
import FulfillmentTable from './FulfillmentTable';
import FailedShipmentsDialog from './FailedShipmentsDialog';
import axiosMerchant from '@/axios';
import { formatDecimalValue } from '@/utils/helpers';
import { useSelector } from 'react-redux';

export default function ShipmentFulfillmentRate() {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const today = new Date();
    const [dateRange, setDateRange] = useState({ from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] });
    const [showFailedShipments, setShowFailedShipments] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [failedShipments, setFailedShipments] = useState([]);
    const [refreshBtn, setRefreshBtn] = useState(false);
    const { decimalPrecision } = useSelector((state) => state.setting)


    const fetchData = useCallback(async () => {
        try {
            const params = {
                start_date: dateRange.from,
                end_date: dateRange.to,
            };

            const response = await axiosMerchant.get('/shipment-fulfillment', { params });
            setData(response.data.data.data);
            setFilteredData(response.data.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }, [dateRange]);

    // Fetch initial data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fetch data with filters
    useEffect(() => {
        fetchData();
    }, [dateRange, fetchData]);

    // Calculate current rate (last 7 days)
    const currentRate = () => {
        if (!data.length) return '0.0';

        const last7Days = data.slice(-7);
        const totalShipments = last7Days.reduce((sum, day) => sum + day.total_shipments, 0);
        const totalFulfilled = last7Days.reduce((sum, day) => sum + day.fulfilled_shipments, 0);
        return formatDecimalValue((totalFulfilled / totalShipments) * 100, decimalPrecision);
    };

    // Chart data
    const chartData = filteredData.map(item => ({
        title: new Date(item.date).toLocaleDateString(),
        value: item.fulfillment_rate
    }));

    const handleExport = async () => {
        try {
            const params = {
                start_date: dateRange.from,
                end_date: dateRange.to,
            };

            const response = await axiosMerchant.post('/shipment-fulfillment/export', params, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'shipment-fulfillment-rate.csv');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const handleDateClick = async (date) => {
        try {
            const response = await axiosMerchant.get(`/shipment-fulfillment/${date}`);
            setSelectedDate(date);
            setFailedShipments(response.data.data.failed_shipments);
            setShowFailedShipments(true);
        } catch (error) {
            console.error('Error fetching failed shipments:', error);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t('Shipment Fulfillment Rate')}</h1>
                    <Button type="button" variant="refresh" onClick={() => {
                        setRefreshBtn(true);
                        fetchData();
                    }}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export CSV')}
                </Button>
            </div>
            <FulfillmentKPI currentRate={currentRate()} />
            <Filters
                dateRange={dateRange}
                setDateRange={setDateRange}
            />
            <FulfillmentChart chartData={chartData} />
            <FulfillmentTable
                data={filteredData}
                onDateClick={handleDateClick}
            />
            <FailedShipmentsDialog
                open={showFailedShipments}
                onOpenChange={setShowFailedShipments}
                selectedDate={selectedDate}
                failedShipments={failedShipments}
            />
        </div>
    );
}
