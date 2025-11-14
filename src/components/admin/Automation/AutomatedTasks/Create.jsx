import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/misc/Select';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import axios from '@/axios';
import { Loader2 } from 'lucide-react';
import RequiredField from "@/components/misc/RequiredField";

const initialTriggerDataEvent = JSON.stringify({ event: '', status: '' });
const initialTriggerDataTime = JSON.stringify({ cron: '' });

const initialActionDataEmail = JSON.stringify({ template: '', shipment_tracking_number: '' });
const initialActionDataSms = JSON.stringify({ phone: '', message: '' });
const initialActionDataStatus = JSON.stringify({ shipment_tracking_number: '', new_status: '' });

export default function CreateTask({ isOpen, onClose, onCreate }) {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);

    const triggerTypeOptions = [
        { value: 'event', label: t('Event-Based') },
        { value: 'time', label: t('Time-Based') }
    ];

    const actionTypeOptions = [
        { value: 'send_email', label: t('Send Email') },
        { value: 'send_sms', label: t('Send SMS') },
        { value: 'status_update', label: t('Update Status') }
    ];

    const statusOptions = [
        { value: 'active', label: t('Active') },
        { value: 'inactive', label: t('Inactive') }
    ];

    const emailTemplateOptions = [
        { value: 'delivery_confirm', label: t('Delivery Confirmation') },
        { value: 'status_update', label: t('Status Update') },
        { value: 'reminder', label: t('Reminder') }
    ];

    const newStatusOptions = [
        { value: 'pending', label: t('Pending') },
        { value: 'in_transit', label: t('In Transit') },
        { value: 'delivered', label: t('Delivered') },
        { value: 'cancelled', label: t('Cancelled') }
    ];

    const triggerEventStatusOptions = [
        { value: 'pending', label: t('Pending') },
        { value: 'confirmed', label: t('Confirmed') },
        { value: 'processing', label: t('Processing') }
    ];

    const triggerEventNameOptions = [
        { value: 'shipment_created', label: t('Shipment Created') },
        { value: 'shipment_status_changed', label: t('Shipment Status Changed') },
        { value: 'payment_received', label: t('Payment Received') }
    ];

    const [form, setForm] = useState({
        task_name: '',
        trigger_type: 'event',
        trigger_display: '',
        trigger_data: initialTriggerDataEvent,
        action_type: 'send_email',
        action_display: '',
        action_data: initialActionDataEmail,
        status: 'active'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        setForm(prevForm => ({
            ...prevForm,
            trigger_data: prevForm.trigger_type === 'time' ? initialTriggerDataTime : initialTriggerDataEvent
        }));
        setErrors(prevErrors => ({ ...prevErrors, trigger_event: null, trigger_status: null, trigger_cron: null }));
    }, [form.trigger_type]);

    useEffect(() => {
        let newActionData;
        switch (form.action_type) {
            case 'send_sms':
                newActionData = initialActionDataSms;
                break;
            case 'status_update':
                newActionData = initialActionDataStatus;
                break;
            case 'send_email':
            default:
                newActionData = initialActionDataEmail;
                break;
        }
        setForm(prevForm => ({
            ...prevForm,
            action_data: newActionData
        }));
        setErrors(prevErrors => ({
            ...prevErrors,
            action_template: null,
            action_shipment_tracking_number: null,
            action_phone: null,
            action_message: null,
            action_new_status: null
        }));
    }, [form.action_type]);

    const handleFieldChange = (name, value) => {
        setForm(prevForm => {
            const newForm = { ...prevForm };

            if (name.startsWith('trigger_data.')) {
                const key = name.split('.')[1];
                try {
                    const currentTriggerData = JSON.parse(newForm.trigger_data || '{}');
                    currentTriggerData[key] = value;
                    newForm.trigger_data = JSON.stringify(currentTriggerData);
                } catch (e) {
                    console.error("Failed to parse/update trigger_data", e);
                }
            } else if (name.startsWith('action_data.')) {
                const key = name.split('.')[1];
                try {
                    const currentActionData = JSON.parse(newForm.action_data || '{}');
                    currentActionData[key] = value;
                    newForm.action_data = JSON.stringify(currentActionData);
                } catch (e) {
                    console.error("Failed to parse/update action_data", e);
                }
            } else {
                newForm[name] = value;
            }
            return newForm;
        });

        if (errors[name]) {
            setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
        }
        if (name.startsWith('trigger_data.')) {
            const errorKey = `trigger_${name.split('.')[1]}`;
            if (errors[errorKey]) {
                setErrors(prevErrors => ({ ...prevErrors, [errorKey]: null }));
            }
        }
        if (name.startsWith('action_data.')) {
            const errorKey = `action_${name.split('.')[1]}`;
            if (errors[errorKey]) {
                setErrors(prevErrors => ({ ...prevErrors, [errorKey]: null }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.task_name?.trim()) {
            newErrors.task_name = t('Task name is required');
        }
        if (!form.trigger_type) {
            newErrors.trigger_type = t('Trigger type is required');
        }
        if (!form.trigger_display?.trim()) {
            newErrors.trigger_display = t('Trigger display is required');
        }
        if (!form.action_type) {
            newErrors.action_type = t('Action type is required');
        }
        if (!form.action_display?.trim()) {
            newErrors.action_display = t('Action display is required');
        }
        if (!form.status) {
            newErrors.status = t('Status is required');
        }

        try {
            const triggerData = JSON.parse(form.trigger_data || '{}');
            if (form.trigger_type === 'event') {
                if (!triggerData.event?.trim()) {
                    newErrors.trigger_event = t('Event is required');
                }
                if (!triggerData.status?.trim()) {
                    newErrors.trigger_status = t('Trigger Status is required');
                }
            } else if (form.trigger_type === 'time') {
                if (!triggerData.cron?.trim()) {
                    newErrors.trigger_cron = t('Cron expression or schedule date is required');
                }
            }
        } catch (e) {
            newErrors.trigger_data = t('Invalid trigger data format');
        }

        try {
            const actionData = JSON.parse(form.action_data || '{}');
            if (form.action_type === 'send_email') {
                if (!actionData.template?.trim()) {
                    newErrors.action_template = t('Email template is required');
                }
                if (!actionData.shipment_tracking_number?.toString().trim()) {
                    newErrors.action_shipment_tracking_number = t('Shipment Tracking Number is required');
                }
            } else if (form.action_type === 'send_sms') {
                if (!actionData.phone?.trim()) {
                    newErrors.action_phone = t('Phone number is required');
                }
                if (!actionData.message?.trim()) {
                    newErrors.action_message = t('Message is required');
                }
            } else if (form.action_type === 'status_update') {
                if (!actionData.shipment_tracking_number?.toString().trim()) {
                    newErrors.action_shipment_tracking_number = t('Shipment Tracking Number is required');
                }
                if (!actionData.new_status?.trim()) {
                    newErrors.action_new_status = t('New status is required');
                }
            }
        } catch (e) {
            newErrors.action_data = t('Invalid action data format');
        }

        return newErrors;
    };
    const _onClose = () => {
        setForm({
            task_name: '',
            trigger_type: 'event',
            trigger_display: '',
            trigger_data: initialTriggerDataEvent,
            action_type: 'send_email',
            action_display: '',
            action_data: initialActionDataEmail,
            status: 'active'
        })
        setErrors({})
        onClose();
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setIsLoading(false);
            toast.error(t('Please Check Required Fields'));
            setErrors(validationErrors);
            return;
        }
        setErrors({});

        try {
            const payload = {
                ...form,
                trigger_data: form.trigger_data,
                action_data: form.action_data,
            };

            await axios.post('/automated_tasks/store', payload);
            onCreate();
            _onClose();
            toast.success(t('Task created successfully'));
            setForm({
                task_name: '',
                trigger_type: 'event',
                trigger_display: '',
                trigger_data: initialTriggerDataEvent,
                action_type: 'send_email',
                action_display: '',
                action_data: initialActionDataEmail,
                status: 'active'
            });
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('Error creating task:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error(t('Please check the form for errors.'));
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error(t('Failed to create task'));
            }
            setIsLoading(false);
        }
    };

    const getJsonDataValue = (jsonString, key, defaultValue = '') => {
        try {
            if (jsonString === null || typeof jsonString === 'undefined') {
                return defaultValue;
            }
            const data = JSON.parse(jsonString);
            return data[key] === null || typeof data[key] === 'undefined' ? defaultValue : data[key];
        } catch {
            return defaultValue;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={_onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Create Automated Task')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">

                    {/* Task Name */}
                    <div className="input-container">
                        <Label htmlFor="task_name">{t('Task Name')} <RequiredField /></Label>
                        <Input
                            id="task_name"
                            name="task_name"
                            value={form.task_name}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter Name')}
                            className={errors.task_name ? 'border-destructive' : ''}
                            error={errors.task_name}
                        />
                        {errors.task_name && <p className="text-sm text-destructive mt-1">{errors.task_name}</p>}
                    </div>

                    {/* Trigger Type */}
                    <div className="input-container">
                        <Label htmlFor="trigger_type">{t('Trigger Type')} <RequiredField /></Label>
                        <Select
                            id="trigger_type"
                            name="trigger_type"
                            value={triggerTypeOptions.find(option => option.value === form.trigger_type)}
                            onChange={(option) => handleFieldChange('trigger_type', option.value)}
                            options={triggerTypeOptions}
                            className={errors.trigger_type ? 'border-destructive' : ''}
                            error={errors.trigger_type}
                        />
                        {errors.trigger_type && <p className="text-sm text-destructive mt-1">{errors.trigger_type}</p>}
                    </div>

                    {/* Conditional Trigger Fields */}
                    {form.trigger_type === 'event' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="trigger_data.event">{t('Trigger Event')} <RequiredField /></Label>
                                <Select
                                    id="trigger_data.event"
                                    name="trigger_data.event"
                                    value={triggerEventNameOptions.find(option => option.value === getJsonDataValue(form.trigger_data, 'event'))}
                                    onChange={(option) => handleFieldChange('trigger_data.event', option?.value || '')}
                                    options={triggerEventNameOptions}
                                    placeholder={t('Select an event')}
                                    className={errors.trigger_event ? 'border-destructive' : ''}
                                    isClearable
                                    error={errors.trigger_event}
                                />
                                {errors.trigger_event && <p className="text-sm text-destructive mt-1">{errors.trigger_event}</p>}
                            </div>
                            <div className="input-container">
                                <Label htmlFor="trigger_data.status">{t('Trigger Status (for event)')} <RequiredField /></Label>
                                <Select
                                    id="trigger_data.status"
                                    name="trigger_data.status"
                                    value={triggerEventStatusOptions.find(option => option.value === getJsonDataValue(form.trigger_data, 'status'))}
                                    onChange={(option) => handleFieldChange('trigger_data.status', option?.value || '')}
                                    options={triggerEventStatusOptions}
                                    placeholder={t('Select a status for the event')}
                                    className={errors.trigger_status ? 'border-destructive' : ''}
                                    isClearable
                                    error={errors.trigger_status}
                                />
                                {errors.trigger_status && <p className="text-sm text-destructive mt-1">{errors.trigger_status}</p>}
                            </div>
                        </>
                    )}
                    {form.trigger_type === 'time' && (
                        <div className="input-container">
                            <label htmlFor="trigger_data.cron">{t('Schedule (Cron or DateTime)')} <RequiredField /></label>
                            <Input
                                id="trigger_data.cron"
                                name="trigger_data.cron"
                                type="datetime-local"
                                value={getJsonDataValue(form.trigger_data, 'cron')}
                                onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                placeholder={t('e.g., 0 0 * * * or 2025-12-31T23:59')}
                                className={errors.trigger_cron ? 'border-destructive' : ''}
                                error={errors.trigger_cron}
                            />
                            {errors.trigger_cron && <p className="text-sm text-destructive mt-1">{errors.trigger_cron}</p>}
                        </div>
                    )}

                    {/* Trigger Display */}
                    <div className="input-container">
                        <Label htmlFor="trigger_display">{t('Trigger Display')} <RequiredField /></Label>
                        <Input
                            id="trigger_display"
                            name="trigger_display"
                            value={form.trigger_display}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter human-readable trigger description')}
                            className={errors.trigger_display ? 'border-destructive' : ''}
                            error={errors.trigger_display}
                        />
                        {errors.trigger_display && <p className="text-sm text-destructive mt-1">{errors.trigger_display}</p>}
                    </div>

                    {/* Action Type */}
                    <div className="input-container">
                        <Label htmlFor="action_type">{t('Action Type')} <RequiredField /></Label>
                        <Select
                            id="action_type"
                            name="action_type"
                            value={actionTypeOptions.find(option => option.value === form.action_type)}
                            onChange={(option) => handleFieldChange('action_type', option.value)}
                            options={actionTypeOptions}
                            className={errors.action_type ? 'border-destructive' : ''}
                            error={errors.action_type}
                        />
                        {errors.action_type && <p className="text-sm text-destructive mt-1">{errors.action_type}</p>}
                    </div>

                    {/* Conditional Action Fields */}
                    {form.action_type === 'send_email' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="action_data.template">{t('Email Template')} <RequiredField /></Label>
                                <Select
                                    id="action_data.template"
                                    name="action_data.template"
                                    value={emailTemplateOptions.find(option => option.value === getJsonDataValue(form.action_data, 'template'))}
                                    onChange={(option) => handleFieldChange('action_data.template', option?.value || '')}
                                    options={emailTemplateOptions}
                                    placeholder={t('Select email template')}
                                    className={errors.action_template ? 'border-destructive' : ''}
                                    isClearable
                                    error={errors.action_template}
                                />
                                {errors.action_template && <p className="text-sm text-destructive mt-1">{errors.action_template}</p>}
                            </div>
                            <div className="input-container">
                                <Label htmlFor="action_data.shipment_tracking_number_email">{t('Shipment Tracking Number (for Email)')} <RequiredField /></Label>
                                <Input
                                    id="action_data.shipment_tracking_number_email"
                                    name="action_data.shipment_tracking_number"
                                    value={getJsonDataValue(form.action_data, 'shipment_tracking_number')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter Shipment Tracking Number')}
                                    className={errors.action_shipment_tracking_number ? 'border-destructive' : ''}
                                    error={errors.action_shipment_tracking_number}
                                />
                                {errors.action_shipment_tracking_number && <p className="text-sm text-destructive mt-1">{errors.action_shipment_tracking_number}</p>}
                            </div>
                        </>
                    )}
                    {form.action_type === 'send_sms' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="action_data.phone">{t('Phone Number')} <RequiredField /></Label>
                                <Input
                                    id="action_data.phone"
                                    name="action_data.phone"
                                    value={getJsonDataValue(form.action_data, 'phone')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter phone number')}
                                    className={errors.action_phone ? 'border-destructive' : ''}
                                    error={errors.action_phone}
                                />
                                {errors.action_phone && <p className="text-sm text-destructive mt-1">{errors.action_phone}</p>}
                            </div>
                            <div className="input-container">
                                <Label htmlFor="action_data.message">{t('Message')} <RequiredField /></Label>
                                <Input
                                    id="action_data.message"
                                    name="action_data.message"
                                    value={getJsonDataValue(form.action_data, 'message')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter SMS message')}
                                    className={errors.action_message ? 'border-destructive' : ''}
                                    error={errors.action_message}
                                />
                                {errors.action_message && <p className="text-sm text-destructive mt-1">{errors.action_message}</p>}
                            </div>
                        </>
                    )}
                    {form.action_type === 'status_update' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="action_data.shipment_tracking_number_status">{t('Shipment Tracking Number (for Status Update)')} <RequiredField /></Label>
                                <Input
                                    id="action_data.shipment_tracking_number_status"
                                    name="action_data.shipment_tracking_number"
                                    value={getJsonDataValue(form.action_data, 'shipment_tracking_number')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter shipment Tracking Number')}
                                    className={errors.action_shipment_tracking_number ? 'border-destructive' : ''}
                                    error={errors.action_shipment_tracking_number}
                                />
                                {errors.action_shipment_tracking_number && <p className="text-sm text-destructive mt-1">{errors.action_shipment_tracking_number}</p>}
                            </div>
                            <div className="input-container">
                                <Label htmlFor="action_data.new_status">{t('New Status')} <RequiredField /></Label>
                                <Select
                                    id="action_data.new_status"
                                    name="action_data.new_status"
                                    value={newStatusOptions.find(option => option.value === getJsonDataValue(form.action_data, 'new_status'))}
                                    onChange={(option) => handleFieldChange('action_data.new_status', option?.value || '')}
                                    options={newStatusOptions}
                                    placeholder={t('Select new status')}
                                    className={errors.action_new_status ? 'border-destructive' : ''}
                                    isClearable
                                    error={errors.action_new_status}
                                />
                                {errors.action_new_status && <p className="text-sm text-destructive mt-1">{errors.action_new_status}</p>}
                            </div>
                        </>
                    )}

                    {/* Action Display */}
                    <div className="input-container">
                        <Label htmlFor="action_display">{t('Action Display')} <RequiredField /></Label>
                        <Input
                            id="action_display"
                            name="action_display"
                            value={form.action_display}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter human-readable action description')}
                            className={errors.action_display ? 'border-destructive' : ''}
                            error={errors.action_display}
                        />
                        {errors.action_display && <p className="text-sm text-destructive mt-1">{errors.action_display}</p>}
                    </div>

                    {/* Status */}
                    <div className="input-container">
                        <Label htmlFor="status">{t('Status')} <RequiredField /></Label>
                        <Select
                            id="status"
                            name="status"
                            value={statusOptions.find(option => option.value === form.status)}
                            onChange={(option) => handleFieldChange('status', option.value)}
                            options={statusOptions}
                            className={errors.status ? 'border-destructive' : ''}
                            error={errors.status}
                        />
                        {errors.status && <p className="text-sm text-destructive mt-1">{errors.status}</p>}
                    </div>

                    {errors.trigger_data && <p className="text-sm text-destructive mt-1">{errors.trigger_data}</p>}
                    {errors.action_data && <p className="text-sm text-destructive mt-1">{errors.action_data}</p>}

                    <DialogFooter>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={_onClose}>{t('Cancel')}</Button>
                            <Button type="submit" disabled={isLoading} onClick={handleSubmit}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("Creating...")}
                                    </>
                                ) : (
                                    t("Create Task")
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

CreateTask.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onCreate: PropTypes.func.isRequired,
};