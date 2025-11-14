import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

export default function AlertTable({ alerts, onResolve, loading, t }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Alert ID')}</TableHead>
                    <TableHead isFixed>{t('Item Name')}</TableHead>
                    <TableHead className="text-right">{t('Current Stock')}</TableHead>
                    <TableHead className="text-right">{t('Min Stock')}</TableHead>
                    <TableHead>{t('Alert Date')}</TableHead>
                    <TableHead>{t('Notification Method')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={8} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading && alerts?.map((alert) => (
                    <TableRow key={alert?.id} className={alert?.status === 'active' ? 'bg-destructive/10 dark:bg-destructive/20' : ''}>
                        <TableCell>{alert?.id}</TableCell>
                        <TableCell isFixed>{alert?.item?.item_name}</TableCell>
                        <TableCell className="text-right">{alert?.item?.current_stock}</TableCell>
                        <TableCell className="text-right">{alert?.minimum_stock_level}</TableCell>
                        <TableCell>{new Date(alert?.alert_date).toLocaleString()}</TableCell>
                        <TableCell>
                            {alert?.notification_methods?.map((method, index) => (
                                <Badge key={index} variant="secondary" className="mr-1">
                                    {t(method)}
                                </Badge>
                            ))}
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={alert?.status === 'active' ? 'destructive' : 'success'}
                            >
                                {t(alert?.status)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {alert?.status === 'active' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onResolve(alert?.id)}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

AlertTable.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        item: PropTypes.shape({
            id: PropTypes.string.isRequired,
            item_name: PropTypes.string.isRequired,
            current_stock: PropTypes.number.isRequired
        }).isRequired,
        minimum_stock_level: PropTypes.number.isRequired,
        alert_date: PropTypes.string.isRequired,
        notification_methods: PropTypes.arrayOf(PropTypes.string).isRequired,
        status: PropTypes.string.isRequired
    })).isRequired,
    onResolve: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired
};
