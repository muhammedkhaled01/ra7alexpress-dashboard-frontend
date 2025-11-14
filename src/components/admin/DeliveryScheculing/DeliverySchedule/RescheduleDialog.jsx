import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState } from 'react';

const RescheduleDialog = ({ open, onClose, onSubmit, formData, drivers, setFormData, loading }) => {
    const [errors, setErrors] = useState({
        date: '',
        startTime: '',
        endTime: '',
        driverId: ''
    });

    const validateForm = () => {
        const newErrors = {
            date: formData.date ? '' : 'Date is required',
            startTime: formData.startTime ? '' : 'Start time is required',
            endTime: formData.endTime ? '' : 'End time is required',
            driverId: formData.driverId ? '' : 'Driver is required'
        };

        // Validate time format
        if (formData.startTime && formData.endTime) {
            const start = new Date(`1970-01-01T${formData.startTime}:00`);
            const end = new Date(`1970-01-01T${formData.endTime}:00`);
            if (end <= start) {
                newErrors.endTime = 'End time must be after start time';
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
                    <DialogTitle>Reschedule Delivery</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4 px-2">
                        <div className="input-container">
                            <label className="block mb-2">Date</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) => {
                                    const newFormData = { ...formData, date: e.target.value };
                                    setFormData(newFormData);
                                }}
                                className="w-full"
                                required
                            />
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">Start Time</label>
                            <Input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => {
                                    const newFormData = { ...formData, startTime: e.target.value };
                                    setFormData(newFormData);
                                }}
                                className="w-full"
                                required
                            />
                            {errors.startTime && (
                                <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">End Time</label>
                            <Input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => {
                                    const newFormData = { ...formData, endTime: e.target.value };
                                    setFormData(newFormData);
                                }}
                                className="w-full"
                                required
                            />
                            {errors.endTime && (
                                <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">Assign Driver</label>
                            <Select
                                options={drivers.map(driver => ({
                                    value: driver.id,
                                    label: driver.name
                                }))}
                                value={drivers.find(driver => driver.id === formData.driverId)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, driverId: opt.value }))}
                                error={errors.driverId}
                                className="w-full"
                            />
                            {errors.driverId && (
                                <p className="mt-1 text-sm text-red-500">{errors.driverId}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button disabled={loading} type="submit">
                            Update
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

RescheduleDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        date: PropTypes.string,
        startTime: PropTypes.string,
        endTime: PropTypes.string,
        driverId: PropTypes.number
    }).isRequired,
    drivers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string
    })).isRequired,
    setFormData: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default RescheduleDialog;
