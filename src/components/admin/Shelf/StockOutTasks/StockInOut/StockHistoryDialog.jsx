import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PropTypes from 'prop-types';

const StockHistoryDialog = ({ open, onClose, t, selectedItem, transactions }) => {
    const getItemHistory = (itemName) => {
        return transactions.filter(t => t.item.item_name === itemName);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {t('Stock History')} - {selectedItem}
                    </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Date')}</TableHead>
                                <TableHead>{t('Type')}</TableHead>
                                <TableHead className="text-right">{t('Quantity')}</TableHead>
                                <TableHead>{t('User')}</TableHead>
                                <TableHead>{t('Notes')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedItem && getItemHistory(selectedItem).map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{new Date(transaction.transaction_date).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={transaction.type === 'in' ? 'success' : 'destructive'}
                                        >
                                            {transaction.type === 'in' ? t('Stock In') : t('Stock Out')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{transaction.quantity}</TableCell>
                                    <TableCell>{transaction.user.name}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{transaction.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
};

StockHistoryDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    selectedItem: PropTypes.string,
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            item: PropTypes.shape({
                name: PropTypes.string.isRequired
            }).isRequired,
            type: PropTypes.string.isRequired,
            quantity: PropTypes.number.isRequired,
            transaction_date: PropTypes.string.isRequired,
            user: PropTypes.shape({
                name: PropTypes.string.isRequired
            }).isRequired,
            notes: PropTypes.string
        })
    ).isRequired
};

export default StockHistoryDialog;
