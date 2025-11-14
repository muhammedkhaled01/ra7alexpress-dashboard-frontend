import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import AlertTable from './AlertTable';
import AlertFilters from './AlertFilters';
import AlertModal from './AlertModal';
import AlertActions from './AlertActions';
import DeleteAlert from '@/components/misc/DeleteAlert';

const CustomAlerts = () => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);
    const [formData, setFormData] = useState({
        alert_name: '',
        condition: '',
        status: 'active',
        recipients: [],
        notification_methods: []
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [refreshBtn, setRefreshBtn] = useState(false);

    const handleDeleteConfirm = async () => {
        setLoading(true);
        await fetchAlerts();
        setLoading(false);
        setDeleteAlert(false);
        setSelectedRecord(null);
    };

    const fetchAlerts = useCallback(async (search = '', status = '') => {
        try {
            setLoading(true);
            const params = {
                search: search.trim(),
                status: status.trim()
            };
            const response = await axios.get('/custom-alerts', { params });
            setAlerts(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch alerts'));
        } finally {
            setLoading(false);
        }
    }, [setAlerts, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (isEditModalOpen && currentAlert) {
                // Update existing alert
                await axios.post('/custom-alerts/update', {
                    id: currentAlert.id,
                    alert_name: formData.alert_name,
                    condition: formData.condition,
                    status: formData.status === "active",
                    recipients: formData.recipients,
                    notification_methods: formData.notification_methods
                });
                toast.success(t('Alert updated successfully'));
            } else {
                // Create new alert
                await axios.post('/custom-alerts/store', {
                    alert_name: formData.alert_name,
                    condition: formData.condition,
                    status: formData.status === "active",
                    recipients: formData.recipients,
                    notification_methods: formData.notification_methods
                });
                toast.success(t('Alert created successfully'));
            }
            handleCloseModal();
            await fetchAlerts();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to save alert'));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (alert) => {
        setCurrentAlert(alert);
        setFormData({
            alert_name: alert.alert_name,
            condition: alert.condition,
            status: alert.status,
            recipients: alert.recipients,
            notification_methods: alert.notification_methods
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (alertId) => {
        setSelectedRecord({ id: alertId });
        setDeleteAlert(true);
    };

    const handleCloseModal = () => {
        setIsCreateModalOpen(false);
        setIsEditModalOpen(false);
        setCurrentAlert(null);
        setFormData({
            alert_name: '',
            condition: '',
            status: 'active',
            recipients: [],
            notification_methods: []
        });
    };

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms debounce delay
        return () => clearTimeout(timer);
    }, [searchTerm]);
    useEffect(() => {
        fetchAlerts(debouncedSearchTerm, statusFilter);
    }, [debouncedSearchTerm, statusFilter, fetchAlerts]);

    return (
        <div className="p-4 space-y-4">
            <>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{t('Custom Alerts')}</h1>
                    <AlertActions onCreate={() => setIsCreateModalOpen(true)} t={t} />
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <AlertFilters
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            status={statusFilter}
                            onStatusChange={setStatusFilter}
                            t={t}
                        />
                    </CardContent>
                </Card>

                {/* Alerts Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                        <CardTitle>{t('Alert Details')}</CardTitle>
                        <Button type="button" variant="refresh" onClick={() => {
                            setRefreshBtn(true);
                            fetchAlerts();
                        }}>
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                    </div>
                    </CardHeader>
                    <CardContent>
                        <AlertTable
                            alerts={alerts}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            loading={loading}
                            t={t}
                        />
                    </CardContent>
                </Card>
            </>

            {/* Create/Edit Alert Modal */}
            <AlertModal
                open={isCreateModalOpen || isEditModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                t={t}
                isEdit={isEditModalOpen}
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
                    api="custom-alerts/delete"
                />
            )}
        </div>
    );
};

export default CustomAlerts;
