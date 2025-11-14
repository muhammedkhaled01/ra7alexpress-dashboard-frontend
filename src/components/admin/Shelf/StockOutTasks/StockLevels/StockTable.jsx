import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const getStatusBadge = (current_stock, minimum_stock) => {
    if (current_stock === 0) {
        return { label: 'Out of Stock', variant: 'destructive' };
    }
    if (current_stock < minimum_stock) {
        return { label: 'Low Stock', variant: 'warning' };
    }
    return { label: 'In Stock', variant: 'success' };
};

const StockTable = ({ items, onEdit, onDelete, t, loading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Item ID')}</TableHead>
                    <TableHead isFixed>{t('Item Name')}</TableHead>
                    <TableHead>{t('Category')}</TableHead>
                    <TableHead className="text-right">{t('Current Stock')}</TableHead>
                    <TableHead className="text-right">{t('Minimum Stock')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                            <Loader />
                        </TableCell>
                    </TableRow>
                )}
                {!loading &&
                    items.map((item) => {
                        const status = getStatusBadge(item.current_stock, item.minimum_stock);
                        return (
                            <TableRow key={item.id}>
                                <TableCell>{item.id}</TableCell>
                                <TableCell isFixed>{item.item_name}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-right">{item.current_stock}</TableCell>
                                <TableCell className="text-right">{item.minimum_stock}</TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                }
            </TableBody>
        </Table>
    );
};

StockTable.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            category: PropTypes.string.isRequired,
            current_stock: PropTypes.number.isRequired,
            minimum_stock: PropTypes.number.isRequired
        })
    ).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default StockTable;
