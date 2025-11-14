import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const AlertTable = ({ 
    alerts, 
    onEdit, 
    onDelete, 
    t, 
    loading 
}) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead isFixed>{t('Alert Name')}</TableHead>
                    <TableHead>{t('Condition')}</TableHead>
                    <TableHead>{t('Triggered At')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Recipients')}</TableHead>
                    <TableHead>{t('Notification Method')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
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
                {!loading && alerts.map((alert) => (
                    <TableRow key={alert.id}>
                        <TableCell isFixed>{alert.alert_name}</TableCell>
                        <TableCell>{t(alert.condition)}</TableCell>
                        <TableCell>{formatDate(alert.triggeredAt)}</TableCell>
                        <TableCell>
                            <Badge
                                variant={alert.status === 'active' ? 'success' : 'secondary'}
                                className="capitalize"
                            >
                                {t(alert.status)}
                            </Badge>
                        </TableCell>
                        <TableCell
                            className="capitalize"
                        >{alert.recipients.join(', ')}</TableCell>
                        <TableCell
                            className="capitalize"
                        >{alert.notification_methods.join(', ')}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(alert)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDelete(alert.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

AlertTable.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        condition: PropTypes.string.isRequired,
        triggeredAt: PropTypes.string,
        status: PropTypes.string.isRequired,
        recipients: PropTypes.arrayOf(PropTypes.string).isRequired,
        notificationMethod: PropTypes.string.isRequired
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default AlertTable;
