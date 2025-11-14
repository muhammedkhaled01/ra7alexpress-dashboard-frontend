import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import ReminderTable from './ReminderTable';
import ReminderDialog from './ReminderDialog';
import ReminderActions from './ReminderActions';

export default function DeliveryReminders() {
    const { t } = useTranslation();
    const [reminders, setReminders] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentReminder, setCurrentReminder] = useState(null);
    const [drivers, setDrivers] = useState();
    const [shipments, setShipments] = useState();
    const [reminderForm, setReminderForm] = useState({
        shipment_id: '',
        recipient: 'driver',
        recipient_id: '',
        reminderTime: '',
        methods: [],
        enabled: true
    });
    const [loading, setLoading] = useState(false);
    const fetchDrivers = async () => {
        setLoading(true);
        const response = await axios.get(`drivers`);
        setDrivers(response.data.data.data);
        setLoading(false);
    };
    useEffect(() => {
        if (!drivers) fetchDrivers();
    }, [drivers]);
    const fetchShipments = async () => {
        setLoading(true);
        const response = await axios.get(`shipments`);
        setShipments(response.data.data.shipments.data);
        setLoading(false);
    };
    useEffect(() => {
        if (!shipments) fetchShipments();
    }, [shipments]);
    const fetchReminders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/delivery-reminders');
            setReminders(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch delivery reminders'));
        } finally {
            setLoading(false);
        }
    }, [setReminders, setLoading, t]);

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            const formattedData = {
                ...formData,
                shipment_id: String(formData.shipment_id),  // Convert shipment_id to string
                reminder_time: formData.reminder_time
            };

            if (currentReminder) {
                // Update existing reminder
                await axios.put(`/delivery-reminders`, {
                    id: currentReminder.id,
                    ...formattedData
                });
                toast.success(t('Reminder updated successfully'));
            } else {
                // Create new reminder
                await axios.post('/delivery-reminders', formattedData);
                toast.success(t('Reminder created successfully'));
            }
            setIsCreateModalOpen(false);
            await fetchReminders();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to save reminder'));
        } finally {
            setLoading(false);
        }
    };

    const handleToggleReminder = async (id) => {
        try {
            setLoading(true);
            await axios.post('/delivery-reminders/toggle', { id });
            await fetchReminders();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to toggle reminder'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const handleCloseDialog = () => {
        setIsCreateModalOpen(false);
        setCurrentReminder(null);
        setReminderForm({
            shipment_id: '',
            recipient: 'driver',
            recipient_id: '',
            reminder_name: '',
            reminderTime: '',
            methods: [],
            enabled: true
        });
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                        <CardTitle>{t('Delivery Reminders')}</CardTitle>
                        <ReminderActions onCreate={() => setIsCreateModalOpen(true)} t={t} />
                    </div>
                </CardHeader>
                <CardContent>
                    <ReminderTable
                        reminders={reminders}
                        onToggleReminder={handleToggleReminder}
                        t={t}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            <ReminderDialog
                open={isCreateModalOpen}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
                formData={reminderForm}
                setFormData={setReminderForm}
                t={t}
                drivers={drivers}
                shipments={shipments}
                isEdit={!!currentReminder}
                loading={loading}
            />
        </div>
    );
}
