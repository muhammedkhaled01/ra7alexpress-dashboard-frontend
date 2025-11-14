import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import axios from '@/axios';
import SlotTable from './SlotTable';
import SlotDialog from './SlotDialog';
import SlotActions from './SlotActions';
import DeleteAlert from '@/components/misc/DeleteAlert';

export default function DeliverySlots() {
    const { t } = useTranslation();
    const [slots, setSlots] = useState([]);
    const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null);
    const [slotForm, setSlotForm] = useState({
        date: '',
        startTime: '',
        endTime: '',
        capacity: 20
    });
    const [loading, setLoading] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const fetchSlots = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/delivery-slots');
            setSlots(response.data.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to fetch delivery slots'));
        } finally {
            setLoading(false);
        }
    }, [setSlots, setLoading, t]);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            if (currentSlot) {
                // Update existing slot
                await axios.put(`/delivery-slots`, {
                    id: currentSlot.id,
                    date: slotForm.date,
                    start_time: slotForm.startTime,
                    end_time: slotForm.endTime,
                    capacity: parseInt(slotForm.capacity)
                });
                toast.success(t('Slot updated successfully'));
            } else {
                // Create new slot
                await axios.post('/delivery-slots', {
                    date: slotForm.date,
                    start_time: slotForm.startTime,
                    end_time: slotForm.endTime,
                    capacity: parseInt(slotForm.capacity)
                });
                toast.success(t('Slot created successfully'));
            }
            setIsSlotModalOpen(false);
            await fetchSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || t('Failed to save slot'));
        } finally {
            setLoading(false);
        }
    };

    const handleEditSlot = (slot) => {
        setCurrentSlot(slot);
        setSlotForm({
            date: slot.date,
            startTime: slot.start_time,
            endTime: slot.end_time,
            capacity: slot.capacity.toString()
        });
        setIsSlotModalOpen(true);
    };

    const handleDelete = (slotId) => {
        setSelectedRecord({ id: slotId });
        setDeleteAlert(true);
    };

    const handleDeleteConfirm = async () => {
        await fetchSlots();
    };

    const handleCloseDialog = () => {
        setIsSlotModalOpen(false);
        setCurrentSlot(null);
        setSlotForm({
            date: '',
            startTime: '',
            endTime: '',
            capacity: 20
        });
    };

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('Delivery Slots')}</h1>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-2 justify-between md:items-center">
                        <CardTitle>{t('Available Slots')}</CardTitle>
                        <SlotActions onCreate={() => setIsSlotModalOpen(true)} t={t} />
                    </div>
                </CardHeader>
                <CardContent>
                    <SlotTable
                        slots={slots}
                        onEdit={handleEditSlot}
                        onDelete={handleDelete}
                        t={t}
                        loading={loading}
                    />
                </CardContent>
            </Card>

            {/* Slot Creation/Edit Modal */}
            <SlotDialog
                open={isSlotModalOpen}
                onClose={handleCloseDialog}
                onSubmit={handleSubmit}
                formData={slotForm}
                setFormData={setSlotForm}
                t={t}
                loading={loading}
                isEdit={!!currentSlot}
            />

            {deleteAlert && (
                <DeleteAlert
                    onSubmitSuccess={handleDeleteConfirm}
                    record={selectedRecord}
                    onClose={() => {
                        setDeleteAlert(false);
                        setSelectedRecord(null);
                    }}
                    api="delivery-slots/delete"
                    message={t('Are you sure you want to delete this slot?')}
                    title={t('Delete Slot')}
                />
            )}
        </div>
    );
}
