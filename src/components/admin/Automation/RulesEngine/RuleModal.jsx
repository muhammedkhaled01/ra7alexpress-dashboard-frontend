import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/misc/Select';
import RequiredField from "@/components/misc/RequiredField";
import PropTypes from 'prop-types';

const RuleModal = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        name: '',
        condition_type: '',
        condition_value: '',
        action_type: '',
        action_payload: '',
        status: ''
    });

    const validateForm = () => {
        const newErrors = {
            name: formData.name ? '' : t('Rule name is required'),
            condition_type: formData.condition_type ? '' : t('Condition type is required'),
            condition_value: formData.condition_value ? '' : t('Condition value is required'),
            action_type: formData.action_type ? '' : t('Action type is required'),
            status: formData.status ? '' : t('Status is required')
        };

        setErrors(newErrors);
        return Object.values(newErrors).every(error => error === '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validateForm()) {
            // Convert action_payload to JSON string if it's an object
            const data = {
                name: formData.name,
                condition_type: formData.condition_type,
                condition_value: formData.condition_value,
                action_type: formData.action_type,
                action_payload: typeof formData.action_payload === 'object' ? JSON.stringify(formData.action_payload) : formData.action_payload,
                status: formData.status
            };
            onSubmit(data);
        }
    };

    const conditionTypeOptions = [
        { value: 'ORDER_STATUS', label: t('Shipment Status') },
        { value: 'DELAY_TIME', label: t('Delay Time') },
        { value: 'ORDER_VALUE', label: t('Shipment Value') }
    ];

    const shipmentStatusOptions = [
        { value: 'Pending', label: t('Pending') },
        { value: 'Processing', label: t('Processing') },
        { value: 'Delayed', label: t('Delayed') },
        { value: 'Shipped', label: t('Shipped') },
        { value: 'Delivered', label: t('Delivered') }
    ];

    const actionOptions = [
        { value: 'SEND_ALERT', label: t('Send Alert') },
        { value: 'UPDATE_STATUS', label: t('Update Status') },
        { value: 'REASSIGN_DRIVER', label: t('Reassign Driver') }
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
                        {isEdit ? t('Edit Rule') : t('Create New Rule')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <Label>{t('Rule Name')} <RequiredField /></Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                error={errors.name}
                                placeholder={t('Enter rule name')}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Condition Type')} <RequiredField /></Label>
                            <Select
                                options={conditionTypeOptions}
                                value={conditionTypeOptions.find(opt => opt.value === formData.condition_type)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, condition_type: opt.value }))}
                                error={errors.condition_type}
                                placeholder={t('Select condition type')}
                            />
                            {errors.condition_type && (
                                <p className="mt-1 text-sm text-red-500">{errors.condition_type}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Condition Value')} <RequiredField /></Label>
                            <Select
                                options={shipmentStatusOptions}
                                value={shipmentStatusOptions.find(opt => opt.value === formData.condition_value)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, condition_value: opt.value }))}
                                error={errors.condition_value}
                                placeholder={t('Select condition value')}
                            />
                            {errors.condition_value && (
                                <p className="mt-1 text-sm text-red-500">{errors.condition_value}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Action Type')} <RequiredField /></Label>
                            <Select
                                options={actionOptions}
                                value={actionOptions.find(opt => opt.value === formData.action_type)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, action_type: opt.value }))}
                                error={errors.action_type}
                                placeholder={t('Select action type')}
                            />
                            {errors.action_type && (
                                <p className="mt-1 text-sm text-red-500">{errors.action_type}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <Label>{t('Status')} <RequiredField /></Label>
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
                            {isEdit ? t('Save Changes') : t('Create Rule')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

RuleModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        name: PropTypes.string,
        condition_type: PropTypes.string,
        condition_value: PropTypes.string,
        action_type: PropTypes.string,
        action_payload: PropTypes.object,
        status: PropTypes.string
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default RuleModal;
