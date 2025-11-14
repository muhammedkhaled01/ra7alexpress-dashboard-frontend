import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import AlertActions from './AlertActions';
import AlertDialog from './AlertDialog';
import AlertTable from './AlertTable';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LowStockAlerts() {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [formData, setFormData] = useState({
        inventory_item_id: '',
        minimum_stock_level: '',
        notification_methods: []
    });
    const [loading, setLoading] = useState(false);


    const fetchAlerts = useCallback(async (status = '') => {
        try {
            setLoading(true);
            const params = {
                status: status.trim()
            };
            const response = await axios.get('/low-stock-alerts', { params });
            setAlerts(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch alerts'));
        } finally {
            setLoading(false);
        }
    }, [setAlerts, setLoading, t]);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/inventory-items');
            setTransactions(response.data.data.data.map(item => ({
                value: item.id,
                label: item.item_name
            })));
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch items'));
        } finally {
            setLoading(false);
        }
    }, [setTransactions, setLoading, t]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post('/low-stock-alerts', {
                inventory_item_id: formData.inventory_item_id,
                minimum_stock_level: formData.minimum_stock_level,
                notification_methods: formData.notification_methods
            });
            setAlerts(prev => [...prev, response.data]);
            toast.success(t('Alert created successfully'));
            handleCloseDialog();
            fetchAlerts();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to create alert'));
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (alertId) => {
        try {
            setLoading(true);
            await axios.put(`/low-stock-alerts`, {
                id: alertId,
                status: 'resolved'
            });
            toast.success(t('Alert marked as resolved'));
            fetchAlerts();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to update alert'));
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
        setFormData({
            inventory_item_id: '',
            minimum_stock_level: '',
            notification_methods: []
        });
    };

    useEffect(() => {
        fetchAlerts();
        fetchItems();
    }, [fetchAlerts, fetchItems]);

    return (
        <div className="p-4 space-y-4">
            <AlertActions onAddAlert={() => setShowAddDialog(true)} />

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Active and Recent Alerts')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={async () => {
                            setLoading(true);
                            await fetchAlerts();
                            setLoading(false);
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <AlertTable
                        alerts={alerts}
                        onResolve={handleResolve}
                        loading={loading}
                        t={t}
                    />
                </CardContent>
            </Card>

            <AlertDialog
                open={showAddDialog}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
                transactions={transactions}
                formData={formData}
                setFormData={setFormData}
                t={t}
                loading={loading}
            />
        </div>
    );
}
