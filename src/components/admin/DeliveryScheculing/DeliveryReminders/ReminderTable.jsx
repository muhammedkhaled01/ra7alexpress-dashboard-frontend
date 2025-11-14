import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';


const getStatusBadge = (status, t) => {
    const colors = {
        'Sent': 'bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700',
        'Pending': 'bg-amber-400 dark:bg-amber-500 hover:bg-amber-500 dark:hover:bg-amber-600',
        'Failed': 'bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700'
    };

    return (
        <Badge className={`${colors[status]} px-3 py-1 rounded-full font-medium`}>
            {t(status)}
        </Badge>
    );
};

const ReminderTable = ({ reminders, onToggleReminder, loading, t }) => {
    const formatMethod = (method) => {
        const methodMap = {
            'email': t('Email Notification'),
            'sms': t('SMS Alert'),
            'in_system': t('In-System Message')
        };
        return methodMap[method] || method;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead isFixed>{t('Reminder ID')}</TableHead>
                    <TableHead>{t('Shipment ID')}</TableHead>
                    <TableHead>{t('Recipient')}</TableHead>
                    <TableHead>{t('Reminder Time')}</TableHead>
                    <TableHead>{t('Methods')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Enabled')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading && reminders.map(reminder => (
                    <TableRow key={reminder.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <TableCell isFixed className="font-medium">REM-{String(reminder.id).padStart(3, '0')}</TableCell>
                        <TableCell>{reminder.shipment_id}</TableCell>
                        <TableCell>{reminder.recipient === 'driver' ? t('Driver') : t('Customer')}</TableCell>
                        <TableCell>{format(new Date(reminder.reminder_time), 'PPp')}</TableCell>
                        <TableCell>
                            <div className="flex flex-col md:flex-row gap-2">
                                {reminder.methods.map(method => (
                                    <Badge key={method} variant="outline" className="text-xs px-2 py-1">
                                        {formatMethod(method)}
                                    </Badge>
                                ))}
                            </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(reminder.status, t)}</TableCell>
                        <TableCell>
                            <Switch
                                checked={reminder.enabled}
                                onCheckedChange={() => onToggleReminder(reminder.id)}
                                disabled={reminder.status !== 'pending'}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

ReminderTable.propTypes = {
    reminders: PropTypes.array.isRequired,
    onToggleReminder: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired
};

export default ReminderTable;
