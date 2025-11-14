import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState } from 'react';
import RequiredField from '@/components/misc/RequiredField';

const operators = [
    { value: '===', label: '=' },
    { value: '>', label: '>' },
    { value: '<', label: '<' },
    { value: '!==', label: '!=' },
];

const actions = [
    { value: 'reject', label: 'Reject Shipment' },
    { value: 'flag', label: 'Flag Shipment' },
    { value: 'alert', label: 'Send Alert' },
    { value: 'modify', label: 'Modify Field' },
];

const RuleEditorModal = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        name: '',
        condition_json: '',
        action_json: '',
        is_active: ''
    });


    const conditionTypes = [
        { value: 'cod', label: t('COD Amount') },
        { value: 'weight', label: t('Weight') },
        { value: 'zone', label: t('Delivery Zone') },
        { value: 'service_type', label: t('Service Type') },
    ];
    const validateForm = () => {
        const newErrors = {
            name: formData.name ? '' : t('Name is required'),
            condition_json: {
                type: formData.condition_json.type ? '' : t('Condition type is required'),
                operator: formData.condition_json.operator ? '' : t('Operator is required'),
                value: formData.condition_json.value ? '' : t('Condition value is required')
            },
            action_json: {
                type: formData.action_json.type ? '' : t('Action type is required'),
                value: formData.action_json.value ? '' : t('Action value is required')
            },
            is_active: ''
        };

        setErrors(newErrors);
        return Object.values(newErrors).every(error => {
            if (typeof error === 'object') {
                return Object.values(error).every(subError => subError === '');
            }
            return error === '';
        });
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
                        {isEdit ? t('Edit Rule') : t('Add New Rule')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Rule Name')} <RequiredField /></label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                error={errors.name}
                                placeholder={t("Enter Rule Name...")}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2">{t('Condition Type')} <RequiredField /></label>
                                    <Select
                                        options={conditionTypes}
                                        value={conditionTypes.find(opt => opt.value === formData.condition_json.type)}
                                        onChange={(opt) => setFormData(prev => ({
                                            ...prev,
                                            condition_json: {
                                                ...prev.condition_json,
                                                type: opt.value
                                            }
                                        }))}
                                        placeholder={t("Enter Condition Type...")}
                                        error={errors.condition_json.type}
                                    />
                                    {errors.condition_json.type && <p className="mt-1 text-sm text-red-500">{errors.condition_json.type}</p>}
                                </div>
                                <div>
                                    <label className="block mb-2">{t('Operator')} <RequiredField /></label>
                                    <Select
                                        options={operators}
                                        value={operators.find(opt => opt.value === formData.condition_json.operator)}
                                        onChange={(opt) => setFormData(prev => ({
                                            ...prev,
                                            condition_json: {
                                                ...prev.condition_json,
                                                operator: opt.value
                                            }
                                        }))}
                                        placeholder={t("Enter Operator...")}
                                        error={errors.condition_json.operator}
                                    />
                                    {errors.condition_json.operator && <p className="mt-1 text-sm text-red-500">{errors.condition_json.operator}</p>}
                                </div>
                                <div>
                                    <label className="block mb-2">{t('Value')} <RequiredField /></label>
                                    <Input
                                        value={formData.condition_json.value}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            condition_json: {
                                                ...prev.condition_json,
                                                value: e.target.value
                                            }
                                        }))}
                                        placeholder={t("Enter Value...")}
                                        error={errors.condition_json.value}
                                    />
                                </div>
                            </div>
                            {Object.values(errors.condition_json).some(error => error) && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.condition_json.value && <p>{errors.condition_json.value}</p>}
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2">{t('Action Type')} <RequiredField /></label>
                                    <Select
                                        options={actions}
                                        value={actions.find(opt => opt.value === formData.action_json.type)}
                                        onChange={(opt) => setFormData(prev => ({
                                            ...prev,
                                            action_json: {
                                                ...prev.action_json,
                                                type: opt.value
                                            }
                                        }))}
                                        placeholder={t("Enter Action Type...")}
                                        error={errors.action_json.type}
                                    />
                                    {errors.action_json.type && <p className="mt-1 text-sm text-red-500">{errors.action_json.type}</p>}
                                </div>
                                <div>
                                    <label className="block mb-2">{t('Value')}<RequiredField /></label>
                                    <Input
                                        value={formData.action_json.value}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            action_json: {
                                                ...prev.action_json,
                                                value: e.target.value
                                            }
                                        }))}
                                        placeholder={t("Enter Value...")}
                                        error={errors.action_json.value}
                                    />
                                </div>
                            </div>
                            {Object.values(errors.action_json).some(error => error) && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.action_json.value && <p>{errors.action_json.value}</p>}
                                </div>
                            )}
                        </div>

                        <div className="input-container">
                            <label className="block mb-2">{t('Status')}</label>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-2">{t('Active')}</span>
                            </div>
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

RuleEditorModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        name: PropTypes.string,
        condition_json: PropTypes.shape({
            type: PropTypes.string,
            operator: PropTypes.string,
            value: PropTypes.string
        }),
        action_json: PropTypes.shape({
            type: PropTypes.string,
            value: PropTypes.string
        }),
        is_active: PropTypes.bool
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default RuleEditorModal;
