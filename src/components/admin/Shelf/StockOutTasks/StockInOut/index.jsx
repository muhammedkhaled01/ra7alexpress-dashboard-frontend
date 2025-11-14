import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import StockInOutTable from './StockInOutTable';
import StockInOutFilters from './StockInOutFilters';
import StockInOutDialog from './StockInOutDialog';
import StockHistoryDialog from './StockHistoryDialog';

export default function StockInOut() {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState([]);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const today = new Date();
    const [dateRange, setDateRange] = useState({
        from: today.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
    });
    const [selectedType, setSelectedType] = useState('');
    const [formData, setFormData] = useState({
        inventory_item_id: '',
        type: '',
        quantity: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    // Transaction type options
    const typeOptions = [
        { value: '', label: t('All Types') },
        { value: 'In', label: t('Stock In') },
        { value: 'Out', label: t('Stock Out') }
    ];

    // Fetch items for dropdown
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true)
                const response = await axios.get('/inventory-items');
                setItems(response.data.data.data.map(item => ({
                    value: item.id,
                    label: item.item_name
                })));
                setLoading(false)
            } catch (error) {
                setLoading(false)
                toast.error(error.response?.data?.message || t('Failed to fetch items'));
            }
        };
        fetchItems();
    }, [t]);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true)
            const params = {
                date_from: dateRange.from,
                date_to: dateRange.to,
                type: selectedType
            };
            const response = await axios.get('/stock-transactions', { params });
            setTransactions(response.data.data.data);
            setLoading(false)
        } catch (error) {
            setLoading(false)
            toast.error(error.response?.data?.message || t('Failed to fetch transactions'));
        }
    }, [dateRange, selectedType, t]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true)
            const response = await axios.post('/stock-transactions', { ...formData, type: formData.type.toLowerCase() });
            setTransactions(prev => [...prev, response.data.data]);
            toast.success(t('Transaction recorded successfully'));
            handleCloseDialog();
            await fetchTransactions();
            setLoading(false)
        } catch (error) {
            setLoading(false)
            toast.error(error.response?.data?.message || t('Failed to save transaction'));
        }
        setLoading(false)
    }

    const handleViewHistory = (item_name) => {
        setSelectedItem(item_name);
        setShowHistoryDialog(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
        setShowHistoryDialog(false);
        setSelectedItem(null);
        setFormData({
            inventory_item_id: '',
            type: '',
            quantity: '',
            notes: ''
        });
    };



    return (
        <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                <h1 className="text-2xl font-bold">{t('Stock In/Out')}</h1>
                <div className="flex gap-2">
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('Record Transaction')}
                    </Button>
                    <Button type="button" variant="refresh" onClick={async () => {
                        setLoading(true);
                        await fetchTransactions();
                        setLoading(false);
                    }}>
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <StockInOutFilters
                dateRange={dateRange}
                setDateRange={setDateRange}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                t={t}
            />

            <StockInOutTable
                transactions={transactions}
                onHistory={handleViewHistory}
                t={t}
                dateRange={dateRange}
                selectedType={selectedType}
                loading={loading}
            />

            <StockInOutDialog
                open={showAddDialog}
                onClose={handleCloseDialog}
                t={t}
                formData={formData}
                setFormData={setFormData}
                typeOptions={typeOptions}
                items={items}
                onSubmit={handleSubmit}
                loading={loading}
            />

            <StockHistoryDialog
                open={showHistoryDialog}
                onClose={handleCloseDialog}
                t={t}
                selectedItem={selectedItem}
                transactions={transactions}
            />
        </div>
    );
}
