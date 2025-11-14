import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';

const getNotificationIcon = (type) => {
    switch (type) {
        case 'shipment':
            return <Eye className="w-4 h-4" />;
        case 'billing':
            return <CheckCircle2 className="w-4 h-4" />;
        case 'support':
            return <AlertCircle className="w-4 h-4" />;
        default:
            return null;
    }
};

const NotificationsTable = ({ notifications, onDetails, onMarkAsRead, t }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Notification Title')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Time')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {getNotificationIcon(notification.type)}
                                <span>{notification.title}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {notification.type}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {new Date(notification.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                            <Badge variant={notification.status === 'unread' ? 'destructive' : 'default'}>
                                {notification.status}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onMarkAsRead(notification.id)}
                                >
                                    {notification.status === 'unread' ? t('Mark as Read') : t('Mark as Unread')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDetails(notification)}
                                >
                                    {t('View Details')}
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

NotificationsTable.propTypes = {
    notifications: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired
    })).isRequired,
    onDetails: PropTypes.func.isRequired,
    onMarkAsRead: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired
};

export default NotificationsTable;
