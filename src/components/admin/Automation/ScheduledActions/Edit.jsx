import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Select from '@/components/misc/Select';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const frequencyOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'CUSTOM', label: 'Custom Cron' }
];

const actionOptions = [
    { value: 'generate_report', label: 'Generate Daily Report' },
    { value: 'data_cleanup', label: 'System Data Cleanup' },
    { value: 'send_reminder', label: 'Send Reminder' }
];

const daysOfWeek = [
    { value: 'SUN', label: 'Sunday' },
    { value: 'MON', label: 'Monday' },
    { value: 'TUE', label: 'Tuesday' },
    { value: 'WED', label: 'Wednesday' },
    { value: 'THU', label: 'Thursday' },
    { value: 'FRI', label: 'Friday' },
    { value: 'SAT', label: 'Saturday' },
];

const dayToCronNumber = {
    SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
};
const isValidCron = (cronExpression) => {
    if (!cronExpression) return false;
    const parts = cronExpression.trim().split(/\s+/);
    return parts.length === 5;
};


export default function EditScheduledAction({ onClose, onUpdate, action }) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        action_name: '',
        frequency: frequencyOptions[0].value,
        day_of_week: daysOfWeek[1].value,
        time: '00:00',
        cron_expression_input: '',
        action_type: '',
        status: 'active'
    });
    const parseSchedule = (schedule) => {
        if (!schedule) return {};
        if (schedule.includes('cron:')) {
            const cronExpression = schedule.split('cron:')[1].trim();
            return {
                frequency: 'CUSTOM',
                cron_expression_input: cronExpression
            };
        }
        const parts = schedule.split(' ');
        const frequency = parts[0].toUpperCase();
        const time = parts[2] || '00:00';
        let day_of_week = '';
        if (frequency === 'WEEKLY' && parts.length > 4) {
            day_of_week = parts[4].substring(0, 3).toUpperCase();
        }
        return {
            frequency,
            time,
            day_of_week,
            cron_expression_input: ''
        };
    };
    useEffect(() => {
        if (action) {
            const parsedSchedule = parseSchedule(action.schedule_display);
            const actionOption = actionOptions.find(opt => opt.value === action.action_type);
            setForm({
                ...parsedSchedule,
                action_name: action.action_name,
                action_type: action.action_type,
                action_display: actionOption ? actionOption.label : '',
                status: action.status
            });
        }
    }, [action]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleFieldChange = useCallback((name, value) => {
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [errors]);

    const generateScheduleDetails = useCallback(() => {

        const { frequency, day_of_week, time, cron_expression_input } = form;
        let schedule_display_str = '';
        let cron_expression_str = '';

        const timeParts = time ? time.split(':') : ['0', '0'];
        const minute = timeParts[1] || '0';
        const hour = timeParts[0] || '0';

        switch (frequency) {
            case 'DAILY':
                schedule_display_str = `${t('Daily')} ${t('at')} ${time || '00:00'}`;
                cron_expression_str = `${minute} ${hour} * * *`;
                break;
            case 'WEEKLY': {
                const dayLabel = daysOfWeek.find(d => d.value === day_of_week)?.label || t(daysOfWeek[0].label);
                schedule_display_str = `${t('Weekly')} ${t('on')} ${dayLabel} ${t('at')} ${time || '00:00'}`;
                cron_expression_str = `${minute} ${hour} * * ${dayToCronNumber[day_of_week]}`;
                break;
            }
            case 'MONTHLY':
                schedule_display_str = `${t('Monthly')} ${t('at')} ${time || '00:00'}`;
                cron_expression_str = `${minute} ${hour} 1 * *`;
                break;
            case 'CUSTOM':
                schedule_display_str = `${t('Custom Cron')}: ${cron_expression_input}`;
                cron_expression_str = cron_expression_input;
                break;
            default:
                schedule_display_str = t('Schedule not configured');
                cron_expression_str = '';
        }
        return { schedule_display_str, cron_expression_str };
    }, [form, t]);


    const validateForm = () => {
        const newErrors = {};
        if (!form.action_name.trim()) {
            newErrors.action_name = [t('Action Name is required')];
        } else if (form.action_name.trim().length > 255) {
            newErrors.action_name = [t('Action Name must not exceed 255 characters')];
        }

        if (form.frequency === 'CUSTOM') {
            if (!form.cron_expression_input.trim()) {
                newErrors.cron_expression = [t('Cron Expression is required for custom frequency')];
            } else if (!isValidCron(form.cron_expression_input)) {
                newErrors.cron_expression = [t('Invalid Cron Expression format')];
            }
        } else {
            if (!form.time) {
                newErrors.schedule_display = [t('Time is required for this frequency')];
            }
        }


        if (!form.action_type) {
            newErrors.action_type = [t('Action type is required')];
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        const frontEndErrors = validateForm();
        if (Object.keys(frontEndErrors).length > 0) {
            setErrors(frontEndErrors);
            toast.error(t('Please correct the errors in the form.'));
            return;
        }
        setIsLoading(true);
        try {
            const { schedule_display_str, cron_expression_str } = generateScheduleDetails();
            const selectedActionObject = actionOptions.find(opt => opt.value === form.action_type);
            const apiPayload = {
                id: action.id,
                action_name: form.action_name,
                schedule_display: schedule_display_str,
                cron_expression: cron_expression_str,
                action_type: form.action_type.toLowerCase(),
                action_display: selectedActionObject ? selectedActionObject.label : '',
                status: form.status.toLowerCase(),
            };
            await onUpdate(apiPayload);
        } catch (error) {
            console.error('Error editing scheduled action:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="input-container">
                <Label htmlFor="action_name">{t('Action Name')}</Label>
                <Input
                    id="action_name"
                    name="action_name"
                    value={form.action_name}
                    onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                    placeholder={t('Enter action name')}
                    className={errors.action_name ? 'border-destructive' : ''}
                    error={errors.action_name}
                />
                {errors.action_name && <p className="text-sm text-destructive mt-1">{errors.action_name[0]}</p>}
            </div>

            <div className="input-container">
                <Label htmlFor="frequency">{t('Frequency')}</Label>
                <Select
                    id="frequency"
                    name="frequency"
                    options={frequencyOptions.map(opt => ({ ...opt, label: opt.label }))}
                    value={frequencyOptions.find(option => option.value === form.frequency) ? { value: form.frequency, label: t(frequencyOptions.find(option => option.value === form.frequency).label) } : null}
                    onChange={(selectedOption) => handleFieldChange('frequency', selectedOption.value)}
                    placeholder={t('Select Frequency')}
                    classNamePrefix={errors.schedule_display || errors.cron_expression || errors.frequency ? 'select-error' : ''}
                    error={errors.frequency}
                />
                {(errors.schedule_display && form.frequency !== 'CUSTOM') && <p className="text-sm text-destructive mt-1">{errors.schedule_display[0]}</p>}
                {errors.frequency && <p className="text-sm text-destructive mt-1">{errors.frequency[0]}</p>}
            </div>

            {form.frequency !== 'CUSTOM' && (
                <>
                    {form.frequency === 'WEEKLY' && (
                        <div className="input-container">
                            <Label htmlFor="day_of_week">{t('Day of Week')}</Label>
                            <Select
                                id="day_of_week"
                                name="day_of_week"
                                options={daysOfWeek.map(opt => ({ ...opt, label: opt.label }))}
                                value={daysOfWeek.find(option => option.value === form.day_of_week) ? { value: form.day_of_week, label: t(daysOfWeek.find(option => option.value === form.day_of_week).label) } : null}
                                onChange={(selectedOption) => handleFieldChange('day_of_week', selectedOption.value)}
                                placeholder={t('Select Day')}
                                error={errors.day_of_week}
                            />
                            {errors.day_of_week && <p className="text-sm text-destructive mt-1">{errors.day_of_week[0]}</p>}
                        </div>
                    )}
                    <div className="input-container">
                        <Label htmlFor="time">{t('Time')}</Label>
                        <Input
                            id="time"
                            name="time"
                            type="time"
                            value={form.time}
                            onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                            error={errors.schedule_display}
                            className={(errors.schedule_display || errors.time) ? 'border-destructive' : ''}
                        />
                        {errors.time && <p className="text-sm text-destructive mt-1">{errors.time[0]}</p>}
                    </div>
                </>
            )}

            {form.frequency === 'CUSTOM' && (
                <div className="input-container">
                    <Label htmlFor="cron_expression_input">{t('Cron Expression')}</Label>
                    <Input
                        id="cron_expression_input"
                        name="cron_expression_input"
                        value={form.cron_expression_input}
                        onChange={(e) => handleFieldChange(e.target.name, e.target.value)}
                        placeholder="e.g., 0 8 * * *"
                        className={errors.cron_expression ? 'border-destructive' : ''}
                        error={errors.cron_expression}
                    />
                    {errors.cron_expression && <p className="text-sm text-destructive mt-1">{errors.cron_expression[0]}</p>}
                </div>
            )}

            <div className="input-container">
                <Label htmlFor="action_type">{t('Action')}</Label>
                <Select
                    id="action_type"
                    name="action_type"
                    options={actionOptions.map(opt => ({ ...opt, label: opt.label }))}
                    value={actionOptions.find(option => option.value === form.action_type) ? {
                        value: form.action_type,
                        label: t(actionOptions.find(option => option.value === form.action_type).label)
                    } : null}
                    onChange={(selectedOption) => handleFieldChange('action_type', selectedOption.value)}
                    placeholder={t('Select Action')}
                    classNamePrefix={errors.action_type || errors.action_display ? 'select-error' : ''}
                    error={errors.action_type}
                />
                {errors.action_type && <p className="text-sm text-destructive mt-1">{errors.action_type[0]}</p>}
                {errors.action_display && <p className="text-sm text-destructive mt-1">{errors.action_display[0]}</p>}
            </div>

            <div className="input-container">
                <Label htmlFor="status">{t('Status')}</Label>
                <Select
                    id="status"
                    name="status"
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' }
                    ]}
                    value={{ value: form.status, label: t(form.status.charAt(0).toUpperCase() + form.status.slice(1)) }}
                    onChange={(selectedOption) => handleFieldChange('status', selectedOption.value)}
                    placeholder={t('Select Status')}
                    classNamePrefix={errors.status ? 'select-error' : ''}
                    error={errors.status}
                />
                {errors.status && <p className="text-sm text-destructive mt-1">{errors.status[0]}</p>}
            </div>

            <div className="flex justify-end gap-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                    {t('Cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('Updating...')}
                        </>
                    ) : (
                        t('Update')
                    )}
                </Button>
            </div>
        </form>
    );
}

EditScheduledAction.propTypes = {
    onClose: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
    action: PropTypes.shape({
        id: PropTypes.number,
        action_name: PropTypes.string,
        schedule_display: PropTypes.string,
        action_display: PropTypes.string,
        action_type: PropTypes.string,
        status: PropTypes.string
    }).isRequired,
};