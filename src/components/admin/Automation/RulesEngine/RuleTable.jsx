import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PropTypes from 'prop-types';
import Loader from '@/components/Loader';


const RuleTable = ({ 
    rules, 
    onEdit, 
    onDelete, 
    t, 
    loading 
}) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead isFixed>{t('Rule Name')}</TableHead>
                    <TableHead>{t('Condition Type')}</TableHead>
                    <TableHead>{t('Condition Value')}</TableHead>
                    <TableHead>{t('Action Type')}</TableHead>
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
                {!loading && rules.map((rule) => (
                    <TableRow key={rule.id}>
                        <TableCell isFixed>{rule.name}</TableCell>
                        <TableCell>{rule.condition_type}</TableCell>
                        <TableCell>{rule.condition_value}</TableCell>
                        <TableCell>{rule.action_type}</TableCell>
                        <TableCell>
                            <Badge
                                variant={rule.status === 'active' ? 'success' : 'secondary'}
                                className="capitalize"
                            >
                                {t(rule.status)}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(rule)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => onDelete(rule.id)}
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

RuleTable.propTypes = {
    rules: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        condition_type: PropTypes.string.isRequired,
        condition_value: PropTypes.string.isRequired,
        action_type: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    loading: PropTypes.bool.isRequired
};

export default RuleTable;
