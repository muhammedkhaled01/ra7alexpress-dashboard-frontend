import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import { X } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';

const ReminderDialog = ({
    open,
    onClose,
    onSubmit,
    formData,
    setFormData,
    t,
    shipments,
    drivers,
    isEdit,
    loading
}) => {
    const [errors, setErrors] = useState({
        shipment_id: '',
        recipient: '',
        reminderTime: '',
        methods: ''
    });
    const validateForm = () => {
        const newErrors = {
            shipment_id: formData.shipment_id ? '' : t('Shipment is required'),
            recipient: formData.recipient ? '' : t('Recipient is required'),
            reminderTime: formData.reminderTime ? '' : t('Reminder time is required'),
            methods: formData.methods.length > 0 ? '' : t('At least one notification method is required')
        };

        if (formData.recipient === 'driver' && !formData.recipient_id) {
            newErrors.recipient = t('Driver is required for driver recipient');
        }

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const resetForm = () => {
        setFormData({
            shipment_id: '',
            recipient: 'driver',
            recipient_id: '',
            recipient_name: '',
            reminderTime: '',
            methods: [],
            enabled: true
        });
        setErrors({
            shipment_id: '',
            recipient: '',
            reminderTime: '',
            methods: ''
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit({
                shipment_id: formData.shipment_id,
                recipient: formData.recipient,
                recipient_id: formData.recipient_id,
                reminder_time: formData.reminderTime,
                methods: formData.methods.map(m => m.toLowerCase()),
                enabled: formData.enabled
            });
            resetForm();
        }
    };

    const removeMethod = (methodToRemove) => {
        setFormData(prev => ({
            ...prev,
            methods: prev.methods.filter(method => method !== methodToRemove)
        }));
    };

    const receipientsOptions = [
        { value: 'driver', label: t('Driver') },
        { value: 'customer', label: t('Customer') }
    ];
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Reminder') : t('Create Reminder')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4 px-2">
                        <div className="space-y-2">
                            <label className="block mb-2">{t('Shipment')} <RequiredField /></label>
                            <Select
                                id="shipmentId"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={formData.shipment_id ? {
                                    value: formData.shipment_id,
                                    label: shipments?.find(o => o.id === formData.shipment_id)?.tracking_no || ''
                                } : null}
                                onChange={(selectedOption) => setFormData({
                                    ...formData,
                                    shipment_id: selectedOption?.value
                                })}
                                options={shipments?.map(shipment => ({
                                    value: shipment.id,
                                    label: shipment.tracking_no
                                })) || []}
                                placeholder={t("Select shipment...")}
                            />
                            {errors.shipment_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.shipment_id}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block mb-2">{t('Recipient')} <RequiredField /></label>
                            <Select
                                id="recipient"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                value={{ value: formData.recipient, label: formData.recipient === 'driver' ? t('Driver') : t('Customer') }}
                                onChange={(selectedOption) => setFormData({ ...formData, recipient: selectedOption.value })}
                                options={receipientsOptions}
                                placeholder={t("Select recipient")}
                            />
                            {errors.recipient && (
                                <p className="mt-1 text-sm text-red-500">{errors.recipient}</p>
                            )}
                        </div>
                        {formData.recipient === 'driver' && (
                            <div className="space-y-2">
                                <label className="block mb-2">{t('Select Driver')} <RequiredField /></label>
                                <Select
                                    id="driverId"
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    value={formData.recipient_id ? { value: formData.recipient_id, label: formData.recipient_name } : null}
                                    onChange={(selectedOption) => setFormData({
                                        ...formData,
                                        recipient_id: selectedOption?.value,
                                        recipient_name: selectedOption?.label
                                    })}
                                    options={drivers?.map(driver => ({
                                        value: driver.id,
                                        label: driver.name
                                    })) || []}
                                    placeholder={t("Select driver...")}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="block mb-2">{t('Reminder Time')} <RequiredField /></label>
                            <Input
                                id="reminderTime"
                                type="datetime-local"
                                value={formData.reminderTime}
                                onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                                className="w-full"
                            />
                            {errors.reminderTime && (
                                <p className="mt-1 text-sm text-red-500">{errors.reminderTime}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="block mb-2">{t('Reminder Methods')} <RequiredField /></label>
                            <div className="space-y-2">
                                <Select
                                    id="methods"
                                    className="basic-multi-select"
                                    classNamePrefix="select"
                                    value={formData.methods.map(method => ({
                                        value: method,
                                        label: method === 'email' ? t('Email Notification') :
                                            method === 'sms' ? t('SMS Alert') : t('In-System Message')
                                    }))}
                                    onChange={(selectedOptions) => setFormData({
                                        ...formData,
                                        methods: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                                    })}
                                    options={[
                                        { value: 'email', label: t('Email Notification') },
                                        { value: 'sms', label: t('SMS Alert') },
                                        { value: 'in_system', label: t('In-System Message') }
                                    ]}
                                    placeholder={t("Select methods...")}
                                    isMulti
                                />
                                {errors.methods && (
                                    <p className="mt-1 text-sm text-red-500">{errors.methods}</p>
                                )}
                                {formData.methods.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.methods.map(method => (
                                            <Badge
                                                key={method}
                                                variant="secondary"
                                                className="px-2 py-1 flex items-center gap-1"
                                            >
                                                {method === 'email' ? 'Email' :
                                                    method === 'sms' ? 'SMS' : 'In-System'}
                                                <X
                                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                    onClick={() => removeMethod(method)}
                                                />
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {t('Select one or more notification methods for this reminder')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-3 gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('Cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.shipment_id || !formData.reminderTime ||
                                (formData.recipient === 'driver' && !formData.recipient_id) ||
                                formData.methods.length === 0}
                        >
                            {isEdit ? t('Update') : t('Create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

ReminderDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        shipment_id: PropTypes.string.isRequired,
        recipient: PropTypes.string.isRequired,
        recipient_id: PropTypes.string,
        recipient_name: PropTypes.string,
        reminderTime: PropTypes.string.isRequired,
        methods: PropTypes.array.isRequired,
        enabled: PropTypes.bool.isRequired
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    shipments: PropTypes.array.isRequired,
    drivers: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired
};

export default ReminderDialog;
