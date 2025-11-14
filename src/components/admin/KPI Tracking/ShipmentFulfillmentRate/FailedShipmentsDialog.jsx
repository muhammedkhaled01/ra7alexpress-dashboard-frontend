import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';

export default function FailedShipmentsDialog({ 
    open, 
    onOpenChange, 
    selectedDate,
    failedShipments
}) {

FailedShipmentsDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onOpenChange: PropTypes.func.isRequired,
    selectedDate: PropTypes.string,
    failedShipments: PropTypes.arrayOf(
        PropTypes.shape({
            shipment_id: PropTypes.string.isRequired,
            shipment_date: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired
        })
    ).isRequired
};
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {t('Failed Shipments')} - {selectedDate && new Date(selectedDate).toLocaleDateString()}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Shipment ID')}</TableHead>
                                <TableHead>{t('Shipment Date')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {failedShipments.map((shipment) => (
                                <TableRow key={shipment.shipment_id}>
                                    <TableCell>{shipment.shipment_id}</TableCell>
                                    <TableCell>{new Date(shipment.shipment_date).toLocaleDateString()}</TableCell>
                                    <TableCell>{shipment.status}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
