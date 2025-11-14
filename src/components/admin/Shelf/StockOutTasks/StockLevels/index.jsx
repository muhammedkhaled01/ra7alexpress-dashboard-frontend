import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import StockTable from './StockTable';
import StockFilters from './StockFilters';
import StockDialog from './StockDialog';
import StockActions from './StockActions';
import DeleteAlert from '@/components/misc/DeleteAlert';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StockLevels() {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({
        item_name: '',
        category: '',
        current_stock: '',
        minimum_stock: ''
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const handleDeleteConfirm = async () => {
        setLoading(true);
        fetchItems();
        setLoading(false);
        setDeleteAlert(false);
        setSelectedRecord(null);
    };

    const fetchItems = useCallback(async (search = '', category = '') => {
        try {
            setLoading(true);
            const params = {
                search: search.trim(),
                category: category.trim()
            };
            const response = await axios.get('/inventory-items', { params });
            setItems(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch items'));
        } finally {
            setLoading(false);
        }
    }, [setItems, setLoading, t]);

    const handleExport = async () => {
        try {
            await axios.get('/inventory-items/export/csv', {
                responseType: 'blob'
            }).then((response) => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'inventory_items.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            });
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to export items'));
        }
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (showEditDialog && currentItem) {
                // Update existing item
                await axios.put(`/inventory-items`, {
                    id: currentItem.id,
                    item_name: formData.item_name,
                    category: formData.category,
                    current_stock: formData.current_stock,
                    minimum_stock: formData.minimum_stock
                });
                toast.success(t('Item updated successfully'));
            } else {
                // Create new item
                const response = await axios.post('/inventory-items', {
                    item_name: formData.item_name,
                    category: formData.category,
                    current_stock: formData.current_stock,
                    minimum_stock: formData.minimum_stock
                });
                setItems(prev => [...prev, response.data]);
                toast.success(t('Item added successfully'));
            }
            handleCloseDialog();
            await fetchItems();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to save item'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setCurrentItem(item);
        setFormData({
            item_name: item.item_name,
            category: item.category,
            current_stock: item.current_stock.toString(),
            minimum_stock: item.minimum_stock.toString()
        });
        setShowEditDialog(true);
    };

    const handleDelete = async (itemId) => {
        setSelectedRecord({ id: itemId });
        setDeleteAlert(true);
    };

    const handleCloseDialog = () => {
        setShowAddDialog(false);
        setShowEditDialog(false);
        setCurrentItem(null);
        setFormData({
            item_name: '',
            category: '',
            current_stock: '',
            minimum_stock: ''
        });
    };

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        fetchItems(searchTerm, selectedCategory);
    }, [searchTerm, selectedCategory, fetchItems]);

    return (
        <div className="p-4 space-y-4">
            <>
                <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                    <h1 className="text-2xl font-bold">{t('Stock Levels')}</h1>
                    <StockActions onExport={handleExport} onAdd={() => setShowAddDialog(true)} t={t} />
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <StockFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            selectedCategory={selectedCategory}
                            onCategoryChange={setSelectedCategory}
                            t={t}
                        />
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                        <CardTitle>{t('Inventory Items')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={async () => {
                            setLoading(true);
                            await fetchItems();
                            setLoading(false);
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                        <StockTable
                            items={items}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            loading={loading}
                            t={t}
                        />
                    </CardContent>
                </Card>
            </>

            {/* Add/Edit Item Dialog */}
            <StockDialog
                open={showAddDialog || showEditDialog}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={showEditDialog}
                loading={loading}
            />

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="inventory-items/delete"
                />
            )}
        </div>
    );
}
