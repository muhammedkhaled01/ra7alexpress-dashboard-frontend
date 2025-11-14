import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Select from '@/components/misc/Select';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import axiosMerchant from '@/axios';

const initialTriggerDataEvent = JSON.stringify({ event: '', status: '' });
const initialTriggerDataTime = JSON.stringify({ cron: '' });

const initialActionDataEmail = JSON.stringify({ template: '', shipment_tracking_number: '' });
const initialActionDataSms = JSON.stringify({ phone: '', message: '' });
const initialActionDataStatus = JSON.stringify({ shipment_tracking_number: '', new_status: '' });

export default function EditTask({ isOpen, onClose, onUpdate, task }) {
    const [isLoading, setIsLoading] = useState(false);
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
    const { t } = useTranslation();

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
        if (task && isOpen) {
            setForm({
                task_name: task.task_name || '',
                trigger_type: task.trigger_type || 'event',
                trigger_display: task.trigger_display || '',
                trigger_data: task.trigger_data || (task.trigger_type === 'time' ? initialTriggerDataTime : initialTriggerDataEvent),
                action_type: task.action_type || 'send_email',
                action_display: task.action_display || '',
                action_data: task.action_data || (
                    task.action_type === 'send_sms' ? initialActionDataSms :
                        task.action_type === 'status_update' ? initialActionDataStatus :
                            initialActionDataEmail
                ),
                status: task.status || 'active'
            });
            setErrors({});
        }
    }, [task, isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        setForm(prevForm => {
            if (prevForm.trigger_type === 'time' && (!prevForm.trigger_data || !Object.hasOwn(JSON.parse(prevForm.trigger_data), 'cron'))) {
                return { ...prevForm, trigger_data: initialTriggerDataTime };
            } else if (prevForm.trigger_type === 'event' && (!prevForm.trigger_data || !Object.hasOwn(JSON.parse(prevForm.trigger_data), 'event'))) {
                return { ...prevForm, trigger_data: initialTriggerDataEvent };
            }
            return prevForm;
        });
        setErrors(prevErrors => ({ ...prevErrors, trigger_event: null, trigger_status: null, trigger_cron: null }));

    }, [form.trigger_type, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setForm(prevForm => {
            let newActionData;
            let needsReset = false;
            try {
                const currentActionData = JSON.parse(prevForm.action_data || '{}');
                if (prevForm.action_type === 'send_email' && (!Object.hasOwn(currentActionData, 'template') || !Object.hasOwn(currentActionData, 'shipment_tracking_number'))) {
                    needsReset = true;
                } else if (prevForm.action_type === 'send_sms' && (!Object.hasOwn(currentActionData, 'phone') || !Object.hasOwn(currentActionData, 'message'))) {
                    needsReset = true;
                } else if (prevForm.action_type === 'status_update' && (!Object.hasOwn(currentActionData, 'shipment_tracking_number') || !Object.hasOwn(currentActionData, 'new_status'))) {
                    needsReset = true;
                }
            } catch { needsReset = true; }

            if (needsReset) {
                switch (prevForm.action_type) {
                    case 'send_sms': newActionData = initialActionDataSms; break;
                    case 'status_update': newActionData = initialActionDataStatus; break;
                    case 'send_email': default: newActionData = initialActionDataEmail; break;
                }
                return { ...prevForm, action_data: newActionData };
            }
            return prevForm;
        });
        setErrors(prevErrors => ({
            ...prevErrors,
            action_template: null, action_shipment_tracking_number: null, action_phone: null,
            action_message: null, action_new_status: null
        }));
    }, [form.action_type, isOpen]);


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
            const payload = { ...form, id: task.id };
            await axiosMerchant.put(`/automated_tasks/update`, payload);
            onUpdate();
            _onClose();
            toast.success(t('Task updated successfully'));
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            console.error('Error updating task:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error(t('Please check the form for errors.'));
            } else if (error.response?.data?.message) {
                setIsLoading(false);
                toast.error(error.response.data.message);
            } else {
                setIsLoading(false);
                toast.error(t('Failed to update task'));
            }
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
            if (task && task[name.startsWith('trigger_') ? 'trigger_data' : 'action_data']) {
                try {
                    const originalTaskData = JSON.parse(task[name.startsWith('trigger_') ? 'trigger_data' : 'action_data']);
                    return originalTaskData[key] || defaultValue;
                } catch (e) {
                    console.error('Failed to parse original task data:', e);
                }
            }
            return defaultValue;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={_onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Edit Automated Task')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="input-container">
                        <Label htmlFor="edit-task_name">{t('Task Name')}</Label>
                        <Input
                            id="edit-task_name"
                            name="task_name"
                            value={form.task_name}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter task name')}
                            className={errors.task_name ? 'border-destructive' : ''}
                            error={errors.task_name}
                        />
                        {errors.task_name && <p className="text-sm text-destructive mt-1">{errors.task_name}</p>}
                    </div>

                    <div className="input-container">
                        <Label htmlFor="edit-trigger_type">{t('Trigger Type')}</Label>
                        <Select
                            id="edit-trigger_type"
                            name="trigger_type"
                            value={triggerTypeOptions.find(option => option.value === form.trigger_type)}
                            onChange={(option) => handleFieldChange('trigger_type', option.value)}
                            options={triggerTypeOptions}
                            className={errors.trigger_type ? 'border-destructive' : ''}
                            error={errors.trigger_type}
                        />
                        {errors.trigger_type && <p className="text-sm text-destructive mt-1">{errors.trigger_type}</p>}
                    </div>

                    {form.trigger_type === 'event' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="edit-trigger_data.event">{t('Trigger Event')}</Label>
                                <Select
                                    id="edit-trigger_data.event"
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
                                <Label htmlFor="edit-trigger_data.status">{t('Trigger Status (for event)')}</Label>
                                <Select
                                    id="edit-trigger_data.status"
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
                            <label htmlFor="edit-trigger_data.cron">{t('Schedule (Cron or DateTime)')}</label>
                            <Input
                                id="edit-trigger_data.cron"
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

                    <div className="input-container">
                        <Label htmlFor="edit-trigger_display">{t('Trigger Display')}</Label>
                        <Input
                            id="edit-trigger_display"
                            name="trigger_display"
                            value={form.trigger_display}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter human-readable trigger description')}
                            className={errors.trigger_display ? 'border-destructive' : ''}
                            error={errors.trigger_display}
                        />
                        {errors.trigger_display && <p className="text-sm text-destructive mt-1">{errors.trigger_display}</p>}
                    </div>

                    <div className="input-container">
                        <Label htmlFor="edit-action_type">{t('Action Type')}</Label>
                        <Select
                            id="edit-action_type"
                            name="action_type"
                            value={actionTypeOptions.find(option => option.value === form.action_type)}
                            onChange={(option) => handleFieldChange('action_type', option.value)}
                            options={actionTypeOptions}
                            className={errors.action_type ? 'border-destructive' : ''}
                            error={errors.action_type}
                        />
                        {errors.action_type && <p className="text-sm text-destructive mt-1">{errors.action_type}</p>}
                    </div>

                    {form.action_type === 'send_email' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="edit-action_data.template">{t('Email Template')}</Label>
                                <Select
                                    id="edit-action_data.template"
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
                                <Label htmlFor="edit-action_data.shipment_id_email">{t('Shipment ID (for Email)')}</Label>
                                <Input
                                    id="edit-action_data.shipment_id_email"
                                    name="action_data.shipment_id"
                                    value={getJsonDataValue(form.action_data, 'shipment_id')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter shipment ID')}
                                    className={errors.action_shipment_id ? 'border-destructive' : ''}
                                    error={errors.action_shipment_id}
                                />
                                {errors.action_shipment_id && <p className="text-sm text-destructive mt-1">{errors.action_shipment_id}</p>}
                            </div>
                        </>
                    )}
                    {form.action_type === 'send_sms' && (
                        <>
                            <div className="input-container">
                                <Label htmlFor="edit-action_data.phone">{t('Phone Number')}</Label>
                                <Input
                                    id="edit-action_data.phone"
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
                                <Label htmlFor="edit-action_data.message">{t('Message')}</Label>
                                <Input
                                    id="edit-action_data.message"
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
                                <Label htmlFor="edit-action_data.shipment_id_status">{t('Shipment ID (for Status Update)')}</Label>
                                <Input
                                    id="edit-action_data.shipment_id_status"
                                    name="action_data.shipment_id"
                                    value={getJsonDataValue(form.action_data, 'shipment_id')}
                                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                                    placeholder={t('Enter shipment ID')}
                                    className={errors.action_shipment_id ? 'border-destructive' : ''}
                                    error={errors.action_shipment_id}
                                />
                                {errors.action_shipment_id && <p className="text-sm text-destructive mt-1">{errors.action_shipment_id}</p>}
                            </div>
                            <div className="input-container">
                                <Label htmlFor="edit-action_data.new_status">{t('New Status')}</Label>
                                <Select
                                    id="edit-action_data.new_status"
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

                    <div className="input-container">
                        <Label htmlFor="edit-action_display">{t('Action Display')}</Label>
                        <Input
                            id="edit-action_display"
                            name="action_display"
                            value={form.action_display}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            placeholder={t('Enter human-readable action description')}
                            className={errors.action_display ? 'border-destructive' : ''}
                            error={errors.action_display}
                        />
                        {errors.action_display && <p className="text-sm text-destructive mt-1">{errors.action_display}</p>}
                    </div>

                    <div className="input-container">
                        <Label htmlFor="edit-status">{t('Status')}</Label>
                        <Select
                            id="edit-status"
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
                        <div className="flex gap2-">
                            <Button type="button" variant="outline" onClick={_onClose}>{t('Cancel')}</Button>
                            <Button type="submit" disabled={isLoading} onClick={handleSubmit}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("Updating...")}
                                    </>
                                ) : (
                                    t("Update Task")
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

EditTask.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    task: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        task_name: PropTypes.string,
        trigger_type: PropTypes.string,
        trigger_display: PropTypes.string,
        trigger_data: PropTypes.string,
        action_type: PropTypes.string,
        action_display: PropTypes.string,
        action_data: PropTypes.string,  // نتوقع أن تكون سلسلة JSON
        status: PropTypes.string
    }).isRequired
};