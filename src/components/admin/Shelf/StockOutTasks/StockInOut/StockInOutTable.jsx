import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const StockInOutTable = ({ transactions, onHistory, t, dateRange, selectedType, loading }) => {
    const filteredTransactions = transactions.filter(transaction => {
        const matchesType = !selectedType || transaction?.type === selectedType;
        const matchesDateFrom = !dateRange.from || new Date(transaction?.transaction_date) >= new Date(dateRange.from);
        const matchesDateTo = !dateRange.to || new Date(transaction?.transaction_date) <= new Date(dateRange.to);
        return matchesType && matchesDateFrom && matchesDateTo;
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Transaction History')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Transaction ID')}</TableHead>
                            <TableHead isFixed>{t('Item Name')}</TableHead>
                            <TableHead>{t('Type')}</TableHead>
                            <TableHead className="text-right">{t('Quantity')}</TableHead>
                            <TableHead>{t('Date')}</TableHead>
                            <TableHead>{t('User')}</TableHead>
                            <TableHead>{t('Notes')}</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    <Loader />
                                </TableCell>
                            </TableRow>
                        ) : filteredTransactions.map((transaction) => (
                            <TableRow key={transaction?.id}>
                                <TableCell>{transaction?.id}</TableCell>
                                <TableCell isFixed>{transaction?.item?.item_name}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={transaction?.type === 'in' ? 'success' : 'destructive'}
                                    >
                                        {transaction?.type === 'in' ? t('Stock In') : t('Stock Out')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{transaction?.quantity}</TableCell>
                                <TableCell>{new Date(transaction?.transaction_date).toLocaleString()}</TableCell>
                                <TableCell>{transaction?.user?.name}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{transaction?.notes}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onHistory(transaction?.item?.item_name)}
                                    >
                                        <History className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

StockInOutTable.propTypes = {
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
    ).isRequired,
    onHistory: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    dateRange: PropTypes.shape({
        from: PropTypes.string,
        to: PropTypes.string
    }).isRequired,
    selectedType: PropTypes.string,
    loading: PropTypes.bool,
};

export default StockInOutTable;
