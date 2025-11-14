import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';
import RequiredField from "@/components/misc/RequiredField";
import { useState } from 'react';

const SlotDialog = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        date: '',
        startTime: '',
        endTime: '',
        capacity: ''
    });

    const validateForm = () => {
        const newErrors = {
            date: formData.date ? '' : t('Date is required'),
            startTime: formData.startTime ? '' : t('Start time is required'),
            endTime: formData.endTime ? '' : t('End time is required'),
            capacity: formData.capacity ? '' : t('Capacity is required')
        };

        // Validate time format
        if (formData.startTime && formData.endTime) {
            const start = new Date(`1970-01-01T${formData.startTime}:00`);
            const end = new Date(`1970-01-01T${formData.endTime}:00`);
            if (end <= start) {
                newErrors.endTime = t('End time must be after start time');
            }
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit();
        }
    };
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Delivery Slot') : t('Create New Delivery Slot')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Date')} <RequiredField /></label>
                            <Input
                                type="date"
                                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                error={errors.date}
                            />
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Start Time')} <RequiredField /></label>
                            <Input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                error={errors.startTime}
                            />
                            {errors.startTime && (
                                <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('End Time')} <RequiredField /></label>
                            <Input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                error={errors.endTime}
                            />
                            {errors.endTime && (
                                <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Capacity (Max Shipments)')} <RequiredField /></label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                error={errors.capacity}
                            />
                            {errors.capacity && (
                                <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="mt-3 flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('Cancel')}
                        </Button>
                        <Button disabled={loading} type="submit">
                            {isEdit ? t('Update') : t('Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

SlotDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        date: PropTypes.string,
        startTime: PropTypes.string,
        endTime: PropTypes.string,
        capacity: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default SlotDialog;
