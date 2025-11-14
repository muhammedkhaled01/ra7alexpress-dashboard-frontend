import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import Loader from '@/components/Loader';
import { useTranslation } from 'react-i18next';

const getStatusBadge = (status, t) => {
    const colors = {
        'Scheduled': 'bg-blue-500 dark:bg-blue-600',
        'In Progress': 'bg-yellow-500 dark:bg-yellow-600',
        'Delivered': 'bg-green-500 dark:bg-green-600'
    };

    return (
        <Badge className={`${colors[status]} text-white px-3 py-1 rounded-full font-medium`}>
            {t(`deliverySchedule.status.${status.toLowerCase().replace(' ', '_')}`)}
        </Badge>
    );
};

const DeliveryScheduleTable = ({ deliveries, onReschedule, onCancel, loading }) => {
    const { t } = useTranslation();
    return (
        <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                    <TableHead className="text-gray-700 dark:text-gray-300" isFixed>{t('deliverySchedule.shipmentId')}</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">{t('deliverySchedule.customerName')}</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">{t('deliverySchedule.deliverySlot')}</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">{t('deliverySchedule.driverAssigned')}</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">{t('deliverySchedule.status')}</TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300">{t('deliverySchedule.actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                ) : deliveries.map(delivery => (
                    <TableRow key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <TableCell isFixed className="text-gray-900 dark:text-gray-100">{delivery.shipmentId}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">{delivery.customerName}</TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                            {format(new Date(delivery.slotDate), 'PP')} {delivery.slotTime}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">{delivery.driverName}</TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onReschedule(delivery)}
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    {t('deliverySchedule.reschedule')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onCancel(delivery.id)}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    {t('deliverySchedule.cancel')}
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

DeliveryScheduleTable.propTypes = {
    deliveries: PropTypes.array.isRequired,
    drivers: PropTypes.array.isRequired,
    onReschedule: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default DeliveryScheduleTable;
