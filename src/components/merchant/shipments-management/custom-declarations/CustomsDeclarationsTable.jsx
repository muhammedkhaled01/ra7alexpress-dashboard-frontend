import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, EditIcon, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';

const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
        case 'draft':
            return { label: 'Draft', variant: 'default' };
        case 'submitted':
            return { label: 'Submitted', variant: 'warning' };
        case 'approved':
            return { label: 'Approved', variant: 'success' };
        default:
            return { label: status, variant: 'default' };
    }
};

const CustomsDeclarationsTable = ({ declarations, onEdit, onDelete, onExportPDF, t, loading }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Declaration ID')}</TableHead>
                    <TableHead>{t('Declared Value')}</TableHead>
                    <TableHead>{t('HS Code')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
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
                    declarations.map((declaration) => {
                        const status = getStatusBadge(declaration.status);
                        return (
                            <TableRow key={declaration.id}>
                                <TableCell>{declaration.id}</TableCell>
                                <TableCell>{declaration.declared_value} {declaration.currency}</TableCell>
                                <TableCell>{declaration.hs_code}</TableCell>
                                <TableCell>
                                    <Badge variant={status.variant}>{status.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="download"
                                            size="sm"
                                            onClick={() => onExportPDF(declaration.id)}
                                        >
                                            <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(declaration)}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(declaration.id)}
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

CustomsDeclarationsTable.propTypes = {
    declarations: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            shipment_id: PropTypes.string.isRequired,
            declared_value: PropTypes.number.isRequired,
            hs_code: PropTypes.string.isRequired,
            status: PropTypes.string.isRequired,
            currency: PropTypes.string.isRequired
        })
    ).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onExportPDF: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default CustomsDeclarationsTable;
