import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import PropTypes from 'prop-types';

const AlertModal = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        alert_name: '',
        condition: '',
        recipients: '',
        notification_methods: ''
    });

    const validateForm = () => {
        const newErrors = {
            alert_name: formData.alert_name ? '' : t('Alert name is required'),
            condition: formData.condition ? '' : t('Condition is required'),
            recipients: formData.recipients.length > 0 ? '' : t('At least one recipient is required'),
            notification_methods: formData.notification_methods.length > 0 ? '' : t('At least one notification method is required')
        };

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit();
        }
    };

    const conditionOptions = [
        { value: 'Delayed Shipments > 5', label: t('Delayed Shipments > 5') },
        { value: 'High-Value Shipment > $1000', label: t('High-Value Shipment > $1000') },
        { value: 'Multiple Cancellations', label: t('Multiple Cancellations') },
        { value: 'Shipping Cost Exceeds Shipment Value', label: t('Shipping Cost Exceeds Shipment Value') }
    ];

    const recipientOptions = [
        { value: 'admin', label: t('Admin') },
        { value: 'driver', label: t('Driver') },
        { value: 'logistics_manager', label: t('Logistics Manager') }
    ];

    const notificationMethodOptions = [
        { value: 'email', label: t('Email') },
        { value: 'in_system', label: t('In-System Notification') },
        { value: 'sms', label: t('SMS') }
    ];

    const statusOptions = [
        { value: 'active', label: t('Active') },
        { value: 'inactive', label: t('Inactive') }
    ];
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Alert') : t('Create New Alert')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <Label>{t('Alert Name')} <RequiredField /></Label>
                            <Input
                                value={formData.alert_name}
                                onChange={(e) => setFormData(prev => ({ ...prev, alert_name: e.target.value }))}
                                error={errors.alert_name}
                                placeholder={t('Enter alert name')}
                            />
                            {errors.alert_name && (
                                <p className="mt-1 text-sm text-red-500">{errors.alert_name}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Condition')} <RequiredField /></Label>
                            <Select
                                options={conditionOptions}
                                value={conditionOptions.find(opt => opt.value === formData.condition)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, condition: opt.value }))}
                                error={errors.condition}
                                placeholder={t('Select condition')}
                            />
                            {errors.condition && (
                                <p className="mt-1 text-sm text-red-500">{errors.condition}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Recipients')} <RequiredField /></Label>
                            <Select
                                isMulti
                                options={recipientOptions}
                                value={recipientOptions.filter(opt => formData.recipients.includes(opt.value))}
                                onChange={(selectedOptions) =>
                                    setFormData(prev => ({ ...prev, recipients: selectedOptions.map(opt => opt.value) }))
                                }
                                error={errors.recipients}
                                placeholder={t('Select recipients')}
                            />
                            {errors.recipients && (
                                <p className="mt-1 text-sm text-red-500">{errors.recipients}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Notification Methods')} <RequiredField /></Label>
                            <Select
                                isMulti
                                options={notificationMethodOptions}
                                value={notificationMethodOptions.filter(opt => formData.notification_methods.includes(opt.value))}
                                onChange={(selectedOptions) =>
                                    setFormData(prev => ({ ...prev, notification_methods: selectedOptions.map(opt => opt.value) }))
                                }
                                error={errors.notification_methods}
                                placeholder={t('Select notification methods')}
                            />
                            {errors.notification_methods && (
                                <p className="mt-1 text-sm text-red-500">{errors.notification_methods}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Status')}</Label>
                            <Select
                                options={statusOptions}
                                value={statusOptions.find(opt => opt.value === formData.status)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, status: opt.value }))}
                                placeholder={t('Select status')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {isEdit ? t('Save Changes') : t('Create Alert')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

AlertModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        alert_name: PropTypes.string,
        condition: PropTypes.string,
        status: PropTypes.string,
        recipients: PropTypes.arrayOf(PropTypes.string),
        notification_methods: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default AlertModal;
