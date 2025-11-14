import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import { format } from 'date-fns';
import DeliveryScheduleTable from './DeliveryScheduleTable';
import RescheduleDialog from './RescheduleDialog';
import DeliveryScheduleFilters from './DeliveryScheduleFilters';

export default function DeliverySchedule() {
    const { t } = useTranslation();
    const [deliveries, setDeliveries] = useState([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState([]);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({
        date: '',
        startTime: '',
        endTime: '',
        driverId: ''
    });

    const [availableSlots, setAvailableSlots] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDeliveries = useCallback(async () => {
        try {
            setLoading(true);
            const params = {};
            if (dateRange.from) {
                params.date_from = dateRange.from.toISOString().split('T')[0];
            }
            if (dateRange.to) {
                params.date_to = dateRange.to.toISOString().split('T')[0];
            }
            if (selectedSlot) {
                params.delivery_slot_id = selectedSlot;
            }
            if (selectedStatus) {
                params.status = selectedStatus;
            }

            const response = await axios.get('/scheduled-deliveries', { params });
            setDeliveries(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch deliveries'));
        } finally {
            setLoading(false);
        }
    }, [dateRange, selectedSlot, selectedStatus, setLoading, t]);

    const fetchAvailableSlots = useCallback(async () => {
        try {
            const response = await axios.get('/delivery-slots');
            setAvailableSlots(response.data.data.data.map(slot => ({
                id: slot.id,
                date: new Date(slot.date),
                timeRange: `${slot.start_time} - ${slot.end_time}`,
                capacity: slot.capacity
            })));
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch slots'));
        }
    }, [t]);

    const fetchDrivers = useCallback(async () => {
        try {
            const response = await axios.get('/drivers');
            setDrivers(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch drivers'));
        }
    }, [t]);

    useEffect(() => {
        // Fetch initial data
        fetchDeliveries();
        fetchAvailableSlots();
        fetchDrivers();
    }, [fetchDeliveries, fetchAvailableSlots, fetchDrivers]);

    const filterDeliveries = useCallback(() => {
        let filtered = [...deliveries];

        if (dateRange.from && dateRange.to) {
            filtered = filtered.filter(delivery => {
                const deliveryDate = new Date(delivery.slotDate);
                return deliveryDate >= dateRange.from && deliveryDate <= dateRange.to;
            });
        }

        if (selectedSlot) {
            filtered = filtered.filter(delivery => delivery.slotId === selectedSlot);
        }

        if (selectedStatus) {
            filtered = filtered.filter(delivery => delivery.status === selectedStatus);
        }

        setFilteredDeliveries(filtered);
    }, [deliveries, dateRange, selectedSlot, selectedStatus]);

    useEffect(() => {
        // Apply filters
        filterDeliveries();
    }, [deliveries, dateRange, selectedSlot, selectedStatus, filterDeliveries]);

    const handleReschedule = (delivery) => {
        setSelectedDelivery(delivery);
        const [startTime, endTime] = delivery.slotTime.split(' - ');
        setRescheduleForm({
            date: format(new Date(delivery.slotDate), 'yyyy-MM-dd'),
            startTime,
            endTime,
            driverId: drivers.find(d => d.name === delivery.driverName)?.id || ''
        });
        setIsRescheduleModalOpen(true);
    };

    const handleCancel = async (deliveryId) => {
        try {
            setLoading(true);
            await axios.post('/scheduled-deliveries/delete', { id: deliveryId });

            // Refresh deliveries
            await fetchDeliveries();
            toast.success(t('Delivery cancelled successfully'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to cancel delivery'));
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleSubmit = async () => {
        try {
            setLoading(true);
            await axios.put(`/scheduled-deliveries/${selectedDelivery.id}`, {
                delivery_slot_id: selectedSlot,
                driver_id: rescheduleForm.driverId
            });

            // Refresh deliveries
            await fetchDeliveries();
            toast.success(t('Delivery rescheduled successfully'));
            setIsRescheduleModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to reschedule delivery'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('Scheduled Deliveries')}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <DeliveryScheduleFilters
                            dateRange={dateRange}
                            setDateRange={setDateRange}
                            availableSlots={availableSlots}
                            selectedSlot={selectedSlot}
                            setSelectedSlot={setSelectedSlot}
                            selectedStatus={selectedStatus}
                            setSelectedStatus={setSelectedStatus}
                            t={t}
                        />
                    </div>
                    <DeliveryScheduleTable
                        deliveries={filteredDeliveries}
                        drivers={drivers}
                        onReschedule={handleReschedule}
                        onCancel={handleCancel}
                        t={t}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            <RescheduleDialog
                open={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                onSubmit={handleRescheduleSubmit}
                formData={rescheduleForm}
                setFormData={setRescheduleForm}
                drivers={drivers}
                t={t}
                loading={loading}
            />
        </div>
    );
}
