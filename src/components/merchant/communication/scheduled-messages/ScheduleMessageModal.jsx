import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Select from '@/components/misc/Select';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import RequiredField from '@/components/misc/RequiredField';

const ScheduleMessageModal = ({ open, onClose, onSubmit, formData, setFormData, t, isEdit, loading }) => {
    const [errors, setErrors] = useState({
        title: '',
        channel: '',
        message_body: '',
        recipient_type: '',
        schedule_time: ''
    });

    const getSelectedOptions = (selectedValues) => {
        if (!selectedValues) return [];
        return recipientTypeOptions.filter(opt => selectedValues.includes(opt.value));
    };

    const validateForm = () => {
        const newErrors = {
            title: formData.title ? '' : t('Title is required'),
            channel: formData.channel ? '' : t('Channel is required'),
            message_body: formData.message_body ? '' : t('Message is required'),
            recipient_type: formData.recipient_type ? '' : t('Recipient type is required'),
            schedule_time: ''
        };

        if (!formData.schedule_time) {
            newErrors.schedule_time = t('Schedule time is required');
        } else {
            const now = new Date();
            const scheduled = new Date(formData.schedule_time);
            if (scheduled <= now) {
                newErrors.schedule_time = t('The scheduled time must be after the current time');
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

    const channelOptions = [
        { value: '', label: t('Select Channel') },
        { value: 'sms', label: t('SMS') },
        { value: 'email', label: t('Email') },
        { value: 'whatsapp', label: t('WhatsApp') }
    ];

    const recipientTypeOptions = [
        { value: '', label: t('Select Recipient Type') },
        { value: 'all_customers', label: t('All Customers') },
        { value: 'specific_tags', label: t('Specific Tags') },
        { value: 'manual_entry', label: t('Manual Entry') }
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? t('Edit Message') : t('Schedule New Message')}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="input-container">
                            <label className="block mb-2">{t('Message Title')} <RequiredField /></label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                error={errors.title}
                                placeholder={t("Enter Message Title...")}
                            />
                            {errors.title && (
                                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Channel')} <RequiredField /></label>
                            <Select
                                options={channelOptions}
                                value={channelOptions.find(opt => opt.value === formData.channel)}
                                onChange={(opt) => setFormData(prev => ({ ...prev, channel: opt.value }))}
                                error={errors.channel}
                                placeholder={t("Enter Channel...")}
                            />
                            {errors.channel && (
                                <p className="mt-1 text-sm text-red-500">{errors.channel}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Message Body')} <RequiredField /></label>
                            <Textarea
                                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows="4"
                                value={formData.message_body}
                                onChange={(e) => setFormData(prev => ({ ...prev, message_body: e.target.value }))}
                                error={errors.message_body}
                                placeholder={t("Enter Message Body...")}
                            />
                            {errors.message_body && (
                                <p className="mt-1 text-sm text-red-500">{errors.message_body}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Recipient Type')} <RequiredField /></label>
                            <Select
                                options={recipientTypeOptions}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder={t("Select Recipient Type...")}
                                isMulti
                                value={getSelectedOptions(formData.recipient_type)}
                                onChange={(opts) => {
                                    const selectedValues = opts.map(opt => opt.value);
                                    setFormData(prev => ({ ...prev, recipient_type: selectedValues }));
                                }}
                                error={errors.recipient_type}
                            />
                            {errors.recipient_type && (
                                <p className="mt-1 text-sm text-red-500">{errors.recipient_type}</p>
                            )}
                        </div>
                        <div className="input-container">
                            <label className="block mb-2">{t('Schedule Time')} <RequiredField /></label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={formData.schedule_time ? new Date(formData.schedule_time).toISOString().split('T')[0] : ''}
                                    onChange={(e) => {
                                        const newDate = new Date(e.target.value);
                                        setFormData(prev => ({ ...prev, schedule_time: newDate }));
                                    }}
                                    error={errors.schedule_time}
                                    className="flex-1"
                                />
                                <Input
                                    type="time"
                                    value={formData.schedule_time ? new Date(formData.schedule_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).split(' ')[0] : ''}
                                    onChange={(e) => {
                                        const date = formData.schedule_time ? new Date(formData.schedule_time) : new Date();
                                        const [hours, minutes] = e.target.value.split(':');
                                        date.setHours(parseInt(hours), parseInt(minutes));
                                        setFormData(prev => ({ ...prev, schedule_time: date }));
                                    }}
                                    error={errors.schedule_time}
                                    className="flex-1"
                                />
                            </div>
                            {errors.schedule_time && (
                                <p className="mt-1 text-sm text-red-500">{errors.schedule_time}</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {isEdit ? t('Save Changes') : t('Schedule Message')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

ScheduleMessageModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    formData: PropTypes.shape({
        title: PropTypes.string,
        channel: PropTypes.string,
        message_body: PropTypes.string,
        recipient_type: PropTypes.arrayOf(PropTypes.string),
        schedule_time: PropTypes.instanceOf(Date)
    }).isRequired,
    setFormData: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    isEdit: PropTypes.bool.isRequired,
    loading: PropTypes.bool.isRequired
};

export default ScheduleMessageModal;
